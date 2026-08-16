<?php

use App\Models\Content;
use App\Models\Media;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Inertia\Testing\AssertableInertia as Assert;

it('exposes the image url in the media index props', function () {
    actingAsRole('editor');

    $media = Media::factory()->create();

    $this->get('/media')->assertInertia(fn (Assert $page) => $page
        ->component('Media/Index')
        ->has('media.data', 1, fn (Assert $item) => $item
            ->where('id', $media->id)
            ->where('url', $media->url)
            ->etc()
        )
    );
});

it('stores the alt text when uploading media', function () {
    Storage::fake('public');
    actingAsRole('editor');

    $this->post('/media', [
        'file' => UploadedFile::fake()->image('hero.jpg'),
        'alt_text' => 'Foto utama artikel',
    ])->assertRedirect();

    $media = Media::first();

    expect($media)->not->toBeNull()
        ->and($media->alt_text)->toBe('Foto utama artikel')
        ->and($media->original_name)->toBe('hero.jpg');
});

it('accepts an upload without alt text', function () {
    Storage::fake('public');
    actingAsRole('editor');

    $this->post('/media', [
        'file' => UploadedFile::fake()->image('hero.jpg'),
    ])->assertRedirect();

    expect(Media::first()->alt_text)->toBeNull();
});

it('persists image dimensions on upload', function () {
    Storage::fake('public');
    actingAsRole('editor');

    $this->post('/media', [
        'file' => UploadedFile::fake()->image('hero.jpg', 1200, 800),
    ])->assertRedirect();

    $media = Media::first();

    expect($media)->not->toBeNull()
        ->and($media->width)->toBe(1200)
        ->and($media->height)->toBe(800);
});

it('generates an on-disk thumbnail when uploading an image', function () {
    Storage::fake('public');
    actingAsRole('editor');

    $this->post('/media', [
        'file' => UploadedFile::fake()->image('hero.jpg', 1200, 800),
    ])->assertRedirect();

    $media = Media::first();

    expect($media)->not->toBeNull();
    Storage::disk('public')->assertExists($media->thumbnailPath());
    expect($media->thumbnail_url)->toContain('media/thumbs/');
});

it('exposes the thumbnail url in the media index props', function () {
    Storage::fake('public');
    actingAsRole('editor');

    $this->post('/media', [
        'file' => UploadedFile::fake()->image('hero.jpg', 1200, 800),
    ])->assertRedirect();

    $media = Media::first();

    $this->get('/media')->assertInertia(fn (Assert $page) => $page
        ->component('Media/Index')
        ->has('media.data', 1, fn (Assert $item) => $item
            ->where('id', $media->id)
            ->where('thumbnail_url', $media->thumbnail_url)
            ->etc()
        )
    );
});

it('runs the thumbnail regeneration command idempotently', function () {
    Storage::fake('public');
    actingAsRole('editor');

    $this->post('/media', [
        'file' => UploadedFile::fake()->image('hero.jpg', 1200, 800),
    ])->assertRedirect();

    $media = Media::first();
    Storage::disk('public')->delete($media->thumbnailPath());

    $this->artisan('media:regenerate-thumbnails')->assertSuccessful();

    Storage::disk('public')->assertExists($media->thumbnailPath());
});

it('reports usage in the media index props', function () {
    actingAsRole('editor');

    $media = Media::factory()->create();
    Content::factory()->published()->create(['featured_image_id' => $media->id]);

    $this->get('/media')->assertInertia(fn (Assert $page) => $page
        ->component('Media/Index')
        ->has('media.data', 1, fn (Assert $item) => $item
            ->where('id', $media->id)
            ->where('featured_usage_count', 1)
            ->where('thumbnail_usage_count', 0)
            ->where('used_in_contents', fn ($contents) => count($contents) === 1)
            ->etc()
        )
    );
});

it('filters media without alt text', function () {
    actingAsRole('editor');

    Media::factory()->create(['alt_text' => 'Deskripsi lengkap']);
    $missing = Media::factory()->create(['alt_text' => null]);

    $this->get('/media?alt=missing')->assertInertia(fn (Assert $page) => $page
        ->component('Media/Index')
        ->has('media.data', 1, fn (Assert $item) => $item->where('id', $missing->id)->etc())
        ->where('filters.alt', 'missing')
    );
});

it('filters media by usage state', function () {
    actingAsRole('editor');

    $used = Media::factory()->create();
    $unused = Media::factory()->create();
    Content::factory()->published()->create(['thumbnail_id' => $used->id]);

    $this->get('/media?used=1')->assertInertia(fn (Assert $page) => $page
        ->component('Media/Index')
        ->has('media.data', 1, fn (Assert $item) => $item->where('id', $used->id)->etc())
    );

    $this->get('/media?used=0')->assertInertia(fn (Assert $page) => $page
        ->component('Media/Index')
        ->has('media.data', 1, fn (Assert $item) => $item->where('id', $unused->id)->etc())
    );
});

it('sorts media by size descending', function () {
    actingAsRole('editor');

    $small = Media::factory()->create(['size' => 1000]);
    $large = Media::factory()->create(['size' => 9000000]);

    $this->get('/media?sort=largest')->assertInertia(fn (Assert $page) => $page
        ->component('Media/Index')
        ->has('media.data', 2)
        ->where('media.data.0.id', $large->id)
        ->where('media.data.1.id', $small->id)
    );
});

it('exposes library health stats', function () {
    actingAsRole('editor');

    Media::factory()->create(['alt_text' => null, 'size' => 2048]);

    $this->get('/media')->assertInertia(fn (Assert $page) => $page
        ->component('Media/Index')
        ->where('stats.total', 1)
        ->where('stats.storage', 2048)
        ->where('stats.missing_alt', 1)
        ->where('stats.unused', 1)
    );
});
