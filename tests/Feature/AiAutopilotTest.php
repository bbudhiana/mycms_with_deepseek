<?php

use App\Models\AiProviderSetting;
use App\Models\AiSchedule;
use App\Models\Category;
use App\Models\Content;
use App\Models\User;
use Illuminate\Support\Facades\Http;

function fakeChatCompletion(string $jsonBody): void
{
    Http::fake([
        '*/chat/completions' => Http::response([
            'choices' => [['message' => ['content' => $jsonBody]]],
        ], 200),
    ]);
}

function articleJson(
    string $title = 'Artikel Autopilot',
    array $overrides = [],
): string {
    return json_encode(array_merge([
        'title' => $title,
        'sub_title' => 'Sub judul pengiring artikel.',
        'excerpt' => 'Ringkasan singkat.',
        'body' => '<h2>Pendahuluan</h2><p>Ini isi artikel.</p>',
        'breaking_news_flag' => false,
        'editor_pick_flag' => false,
    ], $overrides), JSON_UNESCAPED_UNICODE);
}

beforeEach(function () {
    $this->user = userWithRole('super_admin');
    $this->actingAs($this->user);

    $this->settings = AiProviderSetting::factory()->create([
        'base_url' => 'https://ai.example.com/v1',
        'api_key' => 'sk-test',
    ]);

    $this->schedule = AiSchedule::factory()->create([
        'is_active' => true,
        'publish_time' => now()->format('H:i'),
        'content_count' => 1,
        'auto_publish' => false,
    ]);
});

it('uses the schedule author as content owner during scheduled run', function () {
    $author = userWithRole('author');
    $this->schedule->update(['author_id' => $author->id]);
    fakeChatCompletion(articleJson());

    $this->artisan('ai:autopilot')->assertSuccessful();

    expect(Content::first()->author_id)->toBe($author->id);
});

it('falls back to super_admin when schedule has no author_id', function () {
    expect($this->schedule->author_id)->toBeNull();
    fakeChatCompletion(articleJson());

    $this->artisan('ai:autopilot')->assertSuccessful();

    expect(Content::first()->author_id)->toBe(User::role('super_admin')->value('id'));
});

it('runNow ignores the triggering user and uses the schedule author', function () {
    $author = userWithRole('author');
    $this->schedule->update(['author_id' => $author->id]);
    $this->schedule->update(['publish_time' => now()->addHour()->format('H:i')]);
    fakeChatCompletion(articleJson());

    $this->post(route('ai.schedules.run', $this->schedule))->assertRedirect();

    expect(Content::first()->author_id)->toBe($author->id);
});

it('sets category to Teknologi by default when direction has no Kategori', function () {
    $this->schedule->update(['topic_direction' => 'Tulis artikel tentang tren AI 2026.']);
    fakeChatCompletion(articleJson());

    $this->artisan('ai:autopilot')->assertSuccessful();

    $content = Content::first();
    expect(Category::find($content->category_id)->name)->toBe('Teknologi');
});

it('uses the category mentioned in Arah Topik', function () {
    $this->schedule->update(['topic_direction' => "Liputan peristiwa politik.\nKategori : 'Nasional'"]);
    fakeChatCompletion(articleJson());

    $this->artisan('ai:autopilot')->assertSuccessful();

    $content = Content::first();
    expect(Category::find($content->category_id)->name)->toBe('Nasional');
});

it('sets tag to Edukasi by default when direction has no Tag', function () {
    $this->schedule->update(['topic_direction' => 'Liputan umum tentang AI.']);
    fakeChatCompletion(articleJson());

    $this->artisan('ai:autopilot')->assertSuccessful();

    $content = Content::first();
    expect($content->tags()->pluck('name')->all())->toBe(['Edukasi']);
});

it('uses the tag mentioned in Arah Topik', function () {
    $this->schedule->update(['topic_direction' => "Resensi film terbaru.\nTag: 'Hiburan'"]);
    fakeChatCompletion(articleJson());

    $this->artisan('ai:autopilot')->assertSuccessful();

    $content = Content::first();
    expect($content->tags()->pluck('name')->all())->toBe(['Hiburan']);
});

it('sets sub_title from AI response and rejects identical-to-title value', function () {
    fakeChatCompletion(articleJson('Judul Utama', [
        'sub_title' => 'Sub judul pengiring artikel.',
    ]));
    $this->artisan('ai:autopilot')->assertSuccessful();

    expect(Content::first()->sub_title)->toBe('Sub judul pengiring artikel.');

    // AI mengembalikan sub_title yang sama dengan title — harus diganti.
    fakeChatCompletion(articleJson('Judul Sama', ['sub_title' => 'Judul Sama']));
    $this->artisan('ai:autopilot')->assertSuccessful();

    $latest = Content::latest('id')->first();
    expect($latest->sub_title)->not->toBe('Judul Sama');
});

it('reads breaking_news_flag and editor_pick_flag from AI', function () {
    fakeChatCompletion(articleJson('Breaking AI', [
        'breaking_news_flag' => true,
        'editor_pick_flag' => true,
    ]));
    $this->artisan('ai:autopilot')->assertSuccessful();

    $content = Content::first();
    expect($content->breaking_news_flag)->toBeTrue();
    expect($content->editor_pick_flag)->toBeTrue();
});

it('uses first sentence of excerpt as image caption and matches featured/thumbnail to same media', function () {
    $this->settings->update(['image_enabled' => true, 'image_provider' => 'custom', 'image_endpoint_url' => 'https://img.example.com/search']);

    Http::fake([
        '*/chat/completions' => Http::response([
            'choices' => [['message' => [
                'content' => articleJson('Caption Test', [
                    'excerpt' => 'Kalimat pembuka untuk caption. Kalimat kedua diabaikan.',
                ]),
            ]]],
        ], 200),
        'img.example.com/search*' => Http::response([
            'results' => [['url' => 'https://img.example.com/photo.jpg']],
        ], 200),
        'img.example.com/photo.jpg' => Http::response('jpeg-bytes', 200, [
            'Content-Type' => 'image/jpeg',
        ]),
    ]);

    $this->artisan('ai:autopilot')->assertSuccessful();

    $content = Content::first();
    expect($content->image_caption)->toBe('Kalimat pembuka untuk caption.');
    expect($content->image_credit)->toBe('Custom Image Source');
    expect($content->featured_image_id)->not->toBeNull();
    expect($content->thumbnail_id)->toBe($content->featured_image_id);
});

it('uses Pexels as image credit when image provider is pexels', function () {
    $this->settings->update(['image_enabled' => true, 'image_provider' => 'pexels', 'image_api_key' => 'px-key']);

    Http::fake([
        '*/chat/completions' => Http::response([
            'choices' => [['message' => ['content' => articleJson('Pexels Test')]]],
        ], 200),
        'api.pexels.com/*' => Http::response([
            'photos' => [['src' => ['large2x' => 'https://images.pexels.com/photo.jpg']]],
        ], 200),
        'images.pexels.com/*' => Http::response('jpeg-bytes', 200, ['Content-Type' => 'image/jpeg']),
    ]);

    $this->artisan('ai:autopilot')->assertSuccessful();

    expect(Content::first()->image_credit)->toBe('Pexels');
});
