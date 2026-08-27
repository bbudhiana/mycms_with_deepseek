<?php

use App\Enums\ContentStatus;
use App\Models\ActivityLog;
use App\Models\Category;
use App\Models\Content;
use Illuminate\Support\Carbon;

it('lets an author create a draft', function () {
    actingAsRole('author');

    $category = Category::factory()->create();

    $this->post('/contents', [
        'title' => 'Berita Terbaru',
        'body' => '<p>Isi artikel lengkap untuk diuji.</p>',
        'category_id' => $category->id,
    ])->assertRedirect();

    expect(Content::where('title', 'Berita Terbaru')->exists())->toBeTrue();
});

it('rejects content with an empty body after stripping tags', function () {
    actingAsRole('author');

    $this->post('/contents', [
        'title' => 'Tanpa Isi',
        'body' => '<div></div>',
    ])->assertSessionHasErrors('body');
});

it('sanitises the HTML body before storage', function () {
    actingAsRole('author');

    $this->post('/contents', [
        'title' => 'Sanitasi',
        'body' => '<p>Selamat datang</p><script>alert("x")</script><img src=x onerror=alert(1)>',
    ]);

    $saved = Content::where('title', 'Sanitasi')->first();
    expect($saved)->not->toBeNull();
    expect($saved->body)->not->toContain('<script');
    expect($saved->body)->not->toContain('onerror');
    expect($saved->body)->toBeString();
});

it('blocks a viewer from creating content', function () {
    actingAsRole('viewer');

    $this->post('/contents', [
        'title' => 'Nope',
        'body' => '<p>body</p>',
    ])->assertForbidden();
});

it('allows an author to view only their own content in the listing', function () {
    $author = userWithRole('author');
    $other = userWithRole('author');

    Content::factory()->create(['author_id' => $author->id]);
    Content::factory()->count(2)->create(['author_id' => $other->id]);

    $this->actingAs($author)
        ->get('/contents')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Contents/Index')->has('contents.data', 1));
});

it('prevents editing content once it leaves draft state', function () {
    $author = userWithRole('author');
    $published = Content::factory()->published()->create(['author_id' => $author->id]);

    $this->actingAs($author)
        ->patch('/contents/'.$published->id, [
            'title' => 'Edits?',
            'body' => '<p>baru</p>',
            'status' => ContentStatus::Published->value,
        ])
        ->assertForbidden();
});

it('logs activity when a draft is created', function () {
    actingAsRole('author');

    $this->post('/contents', ['title' => 'Bercerita', 'body' => '<p>isi</p>']);

    $content = Content::where('title', 'Bercerita')->first();

    expect(ActivityLog::where('entity_type', Content::class)
        ->where('entity_id', $content->id)
        ->where('action', 'content.created')
        ->exists())->toBeTrue();
});

it('lets an author open their own content while it is awaiting review', function () {
    $author = userWithRole('author');
    $content = Content::factory()->review()->create(['author_id' => $author->id]);

    $this->actingAs($author)
        ->get('/contents/'.$content->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Contents/Editor'));
});

it('lets an author open their own content after it is submitted', function () {
    $author = userWithRole('author');
    $content = Content::factory()->draft()->create(['author_id' => $author->id]);

    $this->actingAs($author)
        ->post('/contents/'.$content->id.'/submit')
        ->assertRedirect();

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Review);

    $this->get('/contents/'.$content->id)->assertOk();
});

it('prevents an author from opening someone else\u{27}s content in review', function () {
    $author = userWithRole('author');
    $other = userWithRole('author');
    $content = Content::factory()->review()->create(['author_id' => $other->id]);

    $this->actingAs($author)
        ->get('/contents/'.$content->id)
        ->assertForbidden();
});

it('lets an editor open a content submitted for review', function () {
    $editor = userWithRole('editor');
    $content = Content::factory()->review()->create();

    $this->actingAs($editor)
        ->get('/contents/'.$content->id)
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Contents/Editor'));
});

it('allows a partial update (autosave) with only the body field', function () {
    $author = userWithRole('author');
    $content = Content::factory()->draft()->create(['author_id' => $author->id, 'title' => 'Tetap', 'body' => '<p>lama</p>']);

    $this->actingAs($author)
        ->patch('/contents/'.$content->id, ['body' => '<p>baru hasil autosave</p>'])
        ->assertRedirect();

    $content->refresh();
    expect($content->body)->toContain('baru hasil autosave')
        ->and($content->title)->toBe('Tetap');
});

it('autosave endpoint persists body without setting flash toast', function () {
    $author = userWithRole('author');
    $content = Content::factory()->draft()->create(['author_id' => $author->id, 'body' => '<p>lama</p>']);

    $this->actingAs($author)
        ->patch('/contents/'.$content->id.'/autosave', ['body' => '<p>revisi diam-diam</p>'])
        ->assertNoContent();

    expect(session('success'))->toBeNull()
        ->and(session('inertia.flash_data'))->toBeNull();

    $content->refresh();
    expect($content->body)->toContain('revisi diam-diam');
});

it('autosave skips no-op updates when body is unchanged', function () {
    Carbon::setTestNow('2026-01-01 12:00:00');
    $author = userWithRole('author');
    $content = Content::factory()->draft()->create(['author_id' => $author->id, 'body' => '<p>sama</p>']);
    $touched = $content->fresh()->updated_at;

    Carbon::setTestNow('2026-01-01 12:00:05');

    $this->actingAs($author)
        ->patch('/contents/'.$content->id.'/autosave', ['body' => '<p>sama</p>'])
        ->assertNoContent();

    expect($content->fresh()->updated_at->equalTo($touched))->toBeTrue();
    Carbon::setTestNow();
});

it('autosave rejects forbidden users', function () {
    $author = userWithRole('author');
    $other = userWithRole('author');
    $content = Content::factory()->draft()->create(['author_id' => $other->id]);

    $this->actingAs($author)
        ->patch('/contents/'.$content->id.'/autosave', ['body' => '<p>coba</p>'])
        ->assertForbidden();
});
