<?php

use App\Models\AiProviderSetting;

it('renders the AI settings page for super admin', function () {
    actingAsRole('super_admin');

    $this->get(route('ai.settings'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page->component('Ai/Settings'));
});

it('forbids non-super-admin from accessing AI settings', function () {
    actingAsRole('admin');

    $this->get(route('ai.settings'))->assertForbidden();
});

it('stores settings and encrypts the api key', function () {
    actingAsRole('super_admin');

    $this->put(route('ai.settings.update'), [
        'base_url' => 'https://api.example.com/v1',
        'api_key' => 'sk-secret-value',
        'model' => 'gpt-4o',
        'provider' => 'openai-compatible',
        'temperature' => 0.8,
        'max_tokens' => 4096,
        'image_enabled' => true,
        'image_endpoint_url' => 'https://images.example.com/search',
    ])->assertRedirect();

    $settings = AiProviderSetting::first();
    expect($settings)->not->toBeNull()
        ->and($settings->model)->toBe('gpt-4o')
        ->and($settings->temperature)->toBe(0.8)
        ->and($settings->max_tokens)->toBe(4096);

    $raw = DB::table('ai_provider_settings')->value('api_key');
    expect($raw)->not->toContain('sk-secret-value')
        ->and($settings->api_key)->toBe('sk-secret-value');
});

it('keeps the existing api key when submitted as masked placeholder', function () {
    actingAsRole('super_admin');

    AiProviderSetting::factory()->create(['api_key' => 'sk-existing']);

    $this->put(route('ai.settings.update'), [
        'base_url' => 'https://api.example.com/v1',
        'api_key' => '••••••••',
        'model' => 'gpt-4o-mini',
        'provider' => 'openai-compatible',
        'temperature' => 0.7,
        'max_tokens' => 8192,
        'image_endpoint_url' => null,
    ])->assertRedirect();

    expect(AiProviderSetting::first()->api_key)->toBe('sk-existing');
});

it('requires the image endpoint url when image is enabled', function () {
    actingAsRole('super_admin');

    $this->put(route('ai.settings.update'), [
        'base_url' => 'https://api.example.com/v1',
        'model' => 'gpt-4o-mini',
        'provider' => 'openai-compatible',
        'temperature' => 0.7,
        'max_tokens' => 8192,
        'image_enabled' => true,
        'image_endpoint_url' => '',
    ])->assertSessionHasErrors(['image_endpoint_url']);
});

it('requires the pexels api key when the pexels provider is selected', function () {
    actingAsRole('super_admin');

    $this->put(route('ai.settings.update'), [
        'base_url' => 'https://api.example.com/v1',
        'model' => 'gpt-4o-mini',
        'provider' => 'openai-compatible',
        'temperature' => 0.7,
        'max_tokens' => 8192,
        'image_enabled' => true,
        'image_provider' => 'pexels',
        'image_api_key' => '',
        'image_endpoint_url' => '',
    ])->assertSessionHasErrors(['image_api_key']);
});

it('stores the pexels api key encrypted', function () {
    actingAsRole('super_admin');

    $this->put(route('ai.settings.update'), [
        'base_url' => 'https://api.example.com/v1',
        'model' => 'gpt-4o-mini',
        'provider' => 'openai-compatible',
        'temperature' => 0.7,
        'max_tokens' => 8192,
        'image_enabled' => true,
        'image_provider' => 'pexels',
        'image_api_key' => 'pexels-top-secret',
        'image_endpoint_url' => '',
    ])->assertRedirect();

    $settings = AiProviderSetting::first();
    expect($settings->image_api_key)->toBe('pexels-top-secret');

    $raw = DB::table('ai_provider_settings')->value('image_api_key');
    expect($raw)->not->toContain('pexels-top-secret');
});

it('validates required settings fields', function () {
    actingAsRole('super_admin');

    $this->put(route('ai.settings.update'), ['base_url' => 'not-a-url'])
        ->assertSessionHasErrors(['base_url', 'model', 'provider', 'temperature', 'max_tokens']);
});
