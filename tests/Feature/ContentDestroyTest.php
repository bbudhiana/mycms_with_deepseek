<?php

use App\Models\Content;

it('redirects the delete request back to the contents index', function () {
    $this->actingAs(userWithRole('super_admin'));

    $content = Content::factory()->create(['title' => 'Akan Dihapus']);

    $response = $this->delete('/contents/'.$content->id);

    $response
        ->assertRedirect('/contents')
        ->assertSessionHas('inertia.flash_data.success', 'Konten berhasil dihapus.');

    expect(Content::find($content->id))->toBeNull();
});

it('removes the deleted content from the follow-up index response', function () {
    $this->actingAs(userWithRole('super_admin'));

    $keep = Content::factory()->create(['title' => 'Tetap Ada']);
    $drop = Content::factory()->create(['title' => 'Akan Hilang']);

    $this->delete('/contents/'.$drop->id)->assertRedirect('/contents');

    $this->assertDatabaseHas('contents', ['id' => $keep->id]);
    $this->assertDatabaseMissing('contents', ['id' => $drop->id]);

    $props = $this->get('/contents')
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Contents/Index'))
        ->inertiaProps();

    expect(collect($props['contents']['data'])->pluck('id'))->not->toContain($drop->id)
        ->and(collect($props['contents']['data'])->pluck('id'))->toContain($keep->id);
});

it('forbids deleting published content from a non-privileged user', function () {
    $author = userWithRole('author');
    $this->actingAs($author);

    $published = Content::factory()->create([
        'author_id' => $author->id,
        'status' => 'published',
    ]);

    $this->delete('/contents/'.$published->id)->assertForbidden();
    $this->assertDatabaseHas('contents', ['id' => $published->id]);
});
