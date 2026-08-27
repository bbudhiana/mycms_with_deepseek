<?php

use App\Models\AiProviderSetting;
use App\Models\AiSchedule;
use App\Models\Category;
use App\Models\Content;
use App\Models\Tag;
use App\Models\User;
use Illuminate\Http\Client\Factory;
use Illuminate\Support\Facades\Http;

function fakeChatCompletion(string $jsonBody): void
{
    Http::fake([
        '*chat/completions*' => Http::response([
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

    $factory = app(Factory::class);
    $property = (new ReflectionClass($factory))->getProperty('stubCallbacks');
    $property->setValue($factory, collect());

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

it('uses the schedule category when set', function () {
    $category = Category::factory()->create(['name' => 'Nasional']);
    $this->schedule->update(['category_id' => $category->id]);
    fakeChatCompletion(articleJson());

    $this->artisan('ai:autopilot')->assertSuccessful();

    expect(Content::first()->category_id)->toBe($category->id);
});

it('leaves category_id null when the schedule has no category', function () {
    fakeChatCompletion(articleJson());

    $this->artisan('ai:autopilot')->assertSuccessful();

    expect(Content::first()->category_id)->toBeNull();
});

it('syncs schedule tags to generated content', function () {
    $tags = Tag::factory()->count(2)->create();
    $this->schedule->update(['tags' => $tags->pluck('id')->all()]);
    fakeChatCompletion(articleJson());

    $this->artisan('ai:autopilot')->assertSuccessful();

    expect(Content::first()->tags()->pluck('id')->sort()->values()->all())
        ->toBe($tags->pluck('id')->sort()->values()->all());
});

it('leaves content tags empty when schedule has no tags', function () {
    fakeChatCompletion(articleJson());

    $this->artisan('ai:autopilot')->assertSuccessful();

    expect(Content::first()->tags()->count())->toBe(0);
});

it('does not interpret Kategori/Tag markers inside Arah Topik anymore', function () {
    $this->schedule->update(['topic_direction' => "Liputan peristiwa politik.\nKategori : 'Nasional'\nTag: 'Hiburan'"]);
    fakeChatCompletion(articleJson());

    $this->artisan('ai:autopilot')->assertSuccessful();

    // Tidak ada fallback Kategori/Teknologi atau Tag/Edukasi — kategori & tag
    // murni mengikuti kolom schedule.category_id dan schedule.tags.
    $content = Content::first();
    expect($content->category_id)->toBeNull();
    expect($content->tags()->count())->toBe(0);
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

it('prepends (Ilustrasi) to image caption and matches featured/thumbnail to same media', function () {
    $this->settings->update(['image_enabled' => true, 'image_provider' => 'custom', 'image_endpoint_url' => 'https://img.example.com/search']);

    Http::fake([
        '*ai.example.com/*' => Http::response([
            'choices' => [['message' => [
                'content' => articleJson('Caption Test', [
                    'excerpt' => 'Kalimat pembuka untuk caption. Kalimat kedua diabaikan.',
                ]),
            ]]],
        ], 200),
        '*img.example.com/search*' => Http::response([
            'results' => [['url' => 'https://img.example.com/photo.jpg']],
        ], 200),
        '*img.example.com/photo.jpg' => Http::response('jpeg-bytes', 200, [
            'Content-Type' => 'image/jpeg',
        ]),
    ]);

    $this->artisan('ai:autopilot')->assertSuccessful();

    $content = Content::first();
    expect($content->image_caption)->toBe('(Ilustrasi) Kalimat pembuka untuk caption.');
    expect($content->image_credit)->toBe('Custom Image Source');
    expect($content->featured_image_id)->not->toBeNull();
    expect($content->thumbnail_id)->toBe($content->featured_image_id);
});

it('maps image_provider unsplash to image_credit "Unsplash"', function () {
    $this->settings->update(['image_enabled' => true, 'image_provider' => 'unsplash', 'image_api_key' => 'unsplash-key']);

    Http::fake([
        '*ai.example.com/*' => Http::response([
            'choices' => [['message' => ['content' => articleJson('Unsplash Credit')]]],
        ], 200),
        '*api.unsplash.com/search/photos*' => Http::response([
            'total' => 5,
            'results' => [[
                'id' => 'abc123def',
                'urls' => [
                    'regular' => 'https://images.unsplash.com/photo-1416339306562-f3d12fefd36f?w=1080',
                ],
            ]],
        ], 200),
        '*api.unsplash.com/photos/abc123def/download*' => Http::response([
            'url' => 'https://images.unsplash.com/photo-1416339306562-f3d12fefd36f',
        ], 200),
        '*images.unsplash.com/photo-1416339306562-f3d12fefd36f*' => Http::response('jpeg-bytes', 200, [
            'Content-Type' => 'image/jpeg',
        ]),
    ]);

    $this->artisan('ai:autopilot')->assertSuccessful();

    Http::assertSent(function ($request) {
        // Accept-Version + User-Agent wajib supaya Unsplash tidak 403/426.
        return str_starts_with($request->url(), 'https://api.unsplash.com/search/photos')
            && $request->hasHeader('Accept-Version', 'v1')
            && str_starts_with($request->header('Authorization')[0] ?? '', 'Client-ID ')
            && $request->hasHeader('User-Agent')
            && $request->hasHeader('Via');
    });

    $content = Content::first();
    expect($content->image_credit)->toBe('Unsplash');
    expect($content->featured_image_id)->not->toBeNull();
    expect($content->thumbnail_id)->toBe($content->featured_image_id);
});

it('surfaces the unsplash error on the schedule when the key is invalid', function () {
    $this->settings->update(['image_enabled' => true, 'image_provider' => 'unsplash', 'image_api_key' => 'bad-key']);

    Http::fake([
        '*ai.example.com/*' => Http::response([
            'choices' => [['message' => ['content' => articleJson('Unsplash Error')]]],
        ], 200),
        '*api.unsplash.com/*' => Http::response([
            'errors' => ['OAuth error: The access token is invalid'],
        ], 401),
    ]);

    $this->artisan('ai:autopilot')->assertSuccessful();

    $content = Content::first();
    expect($content)->not->toBeNull();
    expect($content->image_credit)->toBeNull();
    expect($content->featured_image_id)->toBeNull();
    expect($this->schedule->fresh()->last_error)->toContain('Unsplash error (401)')
        ->toContain('access token is invalid');
});
