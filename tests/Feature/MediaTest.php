<?php

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
