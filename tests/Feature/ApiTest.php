<?php

use App\Models\Category;
use App\Models\Content;
use App\Models\User;
use Laravel\Sanctum\Sanctum;

it('requires authentication for the API', function () {
    $this->getJson('/api/users')->assertUnauthorized();
});

it('lets an admin list users without leaking sensitive fields', function () {
    Sanctum::actingAs(userWithRole('admin'), ['*']);

    User::factory()->create(['password' => 'secret-secret']);

    $this->getJson('/api/users')
        ->assertOk()
        ->assertJsonMissingPath('data.0.password')
        ->assertJsonMissingPath('data.0.two_factor_secret')
        ->assertJsonMissingPath('data.0.two_factor_recovery_codes')
        ->assertJsonMissingPath('data.0.remember_token');
});

it('blocks a viewer from the users API', function () {
    Sanctum::actingAs(userWithRole('viewer'), ['*']);

    $this->getJson('/api/users')->assertForbidden();
});

it('returns the category tree', function () {
    Sanctum::actingAs(userWithRole('admin'), ['*']);

    $parent = Category::factory()->create(['name' => 'Induk']);
    Category::factory()->create(['name' => 'Anak', 'parent_id' => $parent->id]);

    $this->getJson('/api/categories/tree')
        ->assertOk()
        ->assertJsonCount(2, 'data')
        ->assertJsonFragment(['name' => 'Induk'])
        ->assertJsonFragment(['name' => 'Anak']);
});

it('lets an author submit their own content via the API', function () {
    $author = userWithRole('author');
    Sanctum::actingAs($author, ['*']);

    $content = Content::factory()->draft()->create(['author_id' => $author->id]);

    $this->postJson('/api/contents/'.$content->id.'/submit')
        ->assertOk();

    expect($content->fresh()->status->value)->toBe('review');
});

it('blocks an author from publishing via the API', function () {
    $author = userWithRole('author');
    Sanctum::actingAs($author, ['*']);

    $content = Content::factory()->approved()->create();

    $this->postJson('/api/contents/'.$content->id.'/publish')
        ->assertForbidden();

    expect($content->fresh()->status->value)->toBe('approved');
});

it('lets an editor approve content via the API', function () {
    $author = userWithRole('author');
    $editor = userWithRole('editor');
    Sanctum::actingAs($editor, ['*']);

    $content = Content::factory()->review()->create(['author_id' => $author->id]);

    $this->postJson('/api/contents/'.$content->id.'/approve')->assertOk();

    expect($content->fresh()->status->value)->toBe('approved');
});
