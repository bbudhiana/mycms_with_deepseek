<?php

use App\Enums\ContentApprovalAction;
use App\Enums\ContentStatus;
use App\Models\Content;

it('lets an author submit their own draft to review', function () {
    $author = userWithRole('author');
    $content = Content::factory()->draft()->create(['author_id' => $author->id]);

    $this->actingAs($author)
        ->post('/contents/'.$content->id.'/submit')
        ->assertRedirect();

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Review);
    expect($content->approvals()->where('action', ContentApprovalAction::Submitted)->exists())->toBeTrue();
});

it('blocks an author from submitting someone else\u{27}s content', function () {
    $author = userWithRole('author');
    $other = userWithRole('author');
    $content = Content::factory()->draft()->create(['author_id' => $other->id]);

    $this->actingAs($author)
        ->post('/contents/'.$content->id.'/submit')
        ->assertForbidden();
});

it('lets an editor approve a submitted content', function () {
    $author = userWithRole('author');
    $editor = userWithRole('editor');
    $content = Content::factory()->review()->create(['author_id' => $author->id]);

    $this->actingAs($editor)
        ->post('/contents/'.$content->id.'/approve')
        ->assertRedirect();

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Approved);
    expect($content->reviewer_id)->toBe($editor->id);
    expect($content->reviewed_at)->not->toBeNull();
});

it('enforces separation of duty - a reviewer cannot approve their own content', function () {
    $editor = userWithRole('editor');
    $content = Content::factory()->review()->create(['author_id' => $editor->id]);

    $this->actingAs($editor)
        ->post('/contents/'.$content->id.'/approve');

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Review);
});

it('lets an editor reject a content and return it to draft', function () {
    $author = userWithRole('author');
    $editor = userWithRole('editor');
    $content = Content::factory()->review()->create(['author_id' => $author->id]);

    $this->actingAs($editor)
        ->post('/contents/'.$content->id.'/reject', ['notes' => 'Perlu perbaikan.'])
        ->assertRedirect();

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Draft);
    expect($content->approvals()->where('action', ContentApprovalAction::Rejected)->where('notes', 'Perlu perbaikan.')->exists())->toBeTrue();
});

it('requires notes when requesting changes', function () {
    $author = userWithRole('author');
    $editor = userWithRole('editor');
    $content = Content::factory()->review()->create(['author_id' => $author->id]);

    $this->actingAs($editor)
        ->post('/contents/'.$content->id.'/request-changes', [])
        ->assertSessionHasErrors('notes');

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Review);
});

it('blocks an author without approval permission from the review queue', function () {
    actingAsRole('author');

    $this->get('/review')->assertForbidden();
});

it('shows the review queue to an editor', function () {
    actingAsRole('editor');

    Content::factory()->review()->create();

    $this->get('/review')->assertOk();
});
