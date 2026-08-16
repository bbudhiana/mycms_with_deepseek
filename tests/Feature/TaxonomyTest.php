<?php

use App\Enums\ContentStatus;
use App\Models\Category;
use App\Models\Content;
use App\Models\Tag;
use Inertia\Testing\AssertableInertia as Assert;

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

    $tags = Tag::get();
    expect($tags)->toHaveCount(2)
        ->and($tags->pluck('slug')->unique())->toHaveCount(2)
        ->and($tags->pluck('slug'))->toContain('teknologi');
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

it('builds a nested taxonomy tree with published counts and stats', function () {
    actingAsRole('admin');

    $parent = Category::factory()->create(['name' => 'Berita', 'slug' => 'berita']);
    $child = Category::factory()->create(['name' => 'Politik', 'slug' => 'politik', 'parent_id' => $parent->id]);
    Content::factory()->create(['category_id' => $child->id, 'status' => ContentStatus::Published]);
    Content::factory()->create(['category_id' => $child->id, 'status' => ContentStatus::Draft]);

    $this->get('/categories')->assertInertia(fn (Assert $page) => $page
        ->component('Categories/Index')
        ->has('tree', 1)
        ->where('tree.0.id', $parent->id)
        ->where('tree.0.path', ['Berita'])
        ->has('tree.0.children', 1)
        ->where('tree.0.children.0.contents_count', 2)
        ->where('tree.0.children.0.published_count', 1)
        ->where('tree.0.children.0.depth', 1)
        ->where('tree.0.children.0.slug_path', ['berita', 'politik'])
        ->where('categories', null)
        ->where('stats.total', 2)
        ->where('stats.roots', 1)
        ->where('stats.subcategories', 1)
        ->where('stats.unused', 1)
    );
});

it('searches categories as a flat list with breadcrumb path', function () {
    actingAsRole('admin');

    $parent = Category::factory()->create(['name' => 'Berita']);
    $child = Category::factory()->create(['name' => 'Politik', 'parent_id' => $parent->id]);

    $this->get('/categories?search=Politik')->assertInertia(fn (Assert $page) => $page
        ->component('Categories/Index')
        ->where('tree', null)
        ->has('categories', 1)
        ->where('categories.0.id', $child->id)
        ->where('categories.0.path', ['Berita', 'Politik'])
        ->where('filters.search', 'Politik')
    );
});

it('sorts search results by name', function () {
    actingAsRole('admin');

    Category::factory()->create(['name' => 'Budaya']);
    Category::factory()->create(['name' => 'Bisnis']);

    $this->get('/categories?search=B')->assertInertia(fn (Assert $page) => $page
        ->has('categories', 2)
        ->where('categories.0.name', 'Bisnis')
        ->where('categories.1.name', 'Budaya')
    );
});

it('indents parent options by depth', function () {
    actingAsRole('admin');

    $root = Category::factory()->create(['name' => 'Berita']);
    $child = Category::factory()->create(['name' => 'Politik', 'parent_id' => $root->id]);

    $this->get('/categories')->assertInertia(fn (Assert $page) => $page
        ->has('parentOptions', 2)
        ->where('parentOptions.0.depth', 0)
        ->where('parentOptions.1.depth', 1)
    );
});

it('reports published counts, last used, and stats in the tags index', function () {
    actingAsRole('editor');

    $tag = Tag::factory()->create(['name' => 'Pemilu']);
    $publishedAt = now()->subDays(3)->startOfSecond();
    Content::factory()->published()->create(['published_at' => $publishedAt])->tags()->attach($tag);
    Content::factory()->draft()->create()->tags()->attach($tag);
    Tag::factory()->create(['name' => 'Yatim']);

    $this->get('/tags')->assertInertia(fn (Assert $page) => $page
        ->component('Tags/Index')
        ->has('tags.data', 2)
        ->where('tags.data.0.name', 'Pemilu')
        ->where('tags.data.0.contents_count', 2)
        ->where('tags.data.0.published_count', 1)
        ->where('tags.data.0.contents_max_published_at', $publishedAt->toISOString())
        ->where('stats.total', 2)
        ->where('stats.used', 1)
        ->where('stats.unused', 1)
        ->where('stats.hot', 1)
    );
});

it('sorts tags by usage count', function () {
    actingAsRole('editor');

    $busy = Tag::factory()->create(['name' => 'Bisnis']);
    $quiet = Tag::factory()->create(['name' => 'Budaya']);
    Content::factory()->count(3)->create()->each(fn ($c) => $c->tags()->attach($busy));
    Content::factory()->count(1)->create()->each(fn ($c) => $c->tags()->attach($quiet));

    $this->get('/tags?sort=count')->assertInertia(fn (Assert $page) => $page
        ->where('filters.sort', 'count')
        ->where('tags.data.0.id', $busy->id)
        ->where('tags.data.1.id', $quiet->id)
    );
});

it('filters tags by usage', function () {
    actingAsRole('editor');

    $used = Tag::factory()->create(['name' => 'Politik']);
    Content::factory()->create()->tags()->attach($used);
    $unused = Tag::factory()->create(['name' => 'Kosong']);

    $this->get('/tags?used=unused')->assertInertia(fn (Assert $page) => $page
        ->where('filters.used', 'unused')
        ->has('tags.data', 1)
        ->where('tags.data.0.id', $unused->id)
    );

    $this->get('/tags?used=used')->assertInertia(fn (Assert $page) => $page
        ->where('tags.data.0.id', $used->id)
    );
});

it('creates multiple tags from comma-separated names', function () {
    actingAsRole('editor');

    $this->post('/tags', ['name' => 'Ekonomi, Keuangan, Pasar'])->assertRedirect();

    expect(Tag::pluck('name')->all())->toBe(['Ekonomi', 'Keuangan', 'Pasar']);
});

it('filters contents by tag', function () {
    actingAsRole('editor');

    $tag = Tag::factory()->create(['name' => 'Pemilu']);
    $matched = Content::factory()->create(['title' => 'Kampanye']);
    $matched->tags()->attach($tag);
    $other = Content::factory()->create(['title' => 'Olahraga']);

    $this->get('/contents?tag='.$tag->id)->assertInertia(fn (Assert $page) => $page
        ->component('Contents/Index')
        ->has('contents.data', 1)
        ->where('contents.data.0.id', $matched->id)
        ->where('filters.tag', (string) $tag->id)
    );

    expect($other->id)->not->toBeNull();
});
