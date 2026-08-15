<?php

use App\Models\Category;
use App\Models\Content;
use App\Models\Tag;

it('lets an admin create a category with children', function () {
    actingAsRole('admin');

    $parent = Category::factory()->create();

    $this->post('/categories', [
        'name' => 'Ekonomi',
        'parent_id' => $parent->id,
    ])->assertRedirect();

    expect(Category::where('name', 'Ekonomi')->where('parent_id', $parent->id)->exists())->toBeTrue();
});

it('prevents a category from being its own parent', function () {
    actingAsRole('admin');

    $cat = Category::factory()->create();

    $this->patch('/categories/'.$cat->id, [
        'name' => $cat->name,
        'parent_id' => $cat->id,
    ])->assertSessionHasErrors('parent_id');
});

it('prevents deleting a category that has children', function () {
    $admin = actingAsRole('admin');
    $parent = Category::factory()->create();
    Category::factory()->create(['parent_id' => $parent->id]);

    $this->delete('/categories/'.$parent->id)
        ->assertRedirect();

    expect(Category::find($parent->id))->not->toBeNull();
});

it('prevents deleting a category used by content', function () {
    actingAsRole('admin');

    $category = Category::factory()->create();
    Content::factory()->create(['category_id' => $category->id]);

    $this->delete('/categories/'.$category->id)
        ->assertRedirect();

    expect(Category::find($category->id))->not->toBeNull();
});

it('lets an admin delete an unused leaf category', function () {
    actingAsRole('admin');

    $category = Category::factory()->create();

    $this->delete('/categories/'.$category->id)
        ->assertRedirect();

    expect(Category::find($category->id))->toBeNull();
});

it('auto-generates a unique slug for tags', function () {
    actingAsRole('editor');

    $this->post('/tags', ['name' => 'Teknologi']);
    $this->post('/tags', ['name' => 'Teknologi']);

    $slugs = Tag::pluck('slug');
    expect($slugs)->toContain('teknologi');
    expect($slugs->unique())->toHaveCount($slugs->count());
});

it('deletes tags', function () {
    actingAsRole('editor');

    $tag = Tag::factory()->create();

    $this->delete('/tags/'.$tag->id)->assertRedirect();

    expect(Tag::find($tag->id))->toBeNull();
});

it('blocks a viewer from managing taxonomy', function () {
    actingAsRole('viewer');

    $this->post('/categories', ['name' => 'Nope'])->assertForbidden();
    $this->post('/tags', ['name' => 'Nope'])->assertForbidden();
});
