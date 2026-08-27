<?php

namespace App\Http\Controllers;

use App\Http\Requests\AiSettingsRequest;
use App\Models\AiProviderSetting;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class AiSettingsController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $settings = AiProviderSetting::current();

        return Inertia::render('Ai/Settings', [
            'settings' => $settings ? [
                'base_url' => $settings->base_url,
                'api_key' => $settings->api_key !== null ? '••••••••' : null,
                'model' => $settings->model,
                'provider' => $settings->provider,
                'temperature' => (float) $settings->temperature,
                'max_tokens' => $settings->max_tokens,
                'image_endpoint_url' => $settings->image_endpoint_url,
                'image_enabled' => (bool) $settings->image_enabled,
                'image_provider' => $settings->image_provider,
                'image_api_key' => $settings->image_api_key !== null ? '••••••••' : null,
                'has_image_api_key' => $settings->image_api_key !== null,
                'has_api_key' => $settings->api_key !== null,
            ] : null,
        ]);
    }

    public function update(AiSettingsRequest $request)
    {
        $data = $request->validated();

        if (($data['api_key'] ?? null) === null || $data['api_key'] === '••••••••') {
            unset($data['api_key']);
        }

        if (($data['image_api_key'] ?? null) === null || $data['image_api_key'] === '••••••••') {
            unset($data['image_api_key']);
        }

        if (($data['image_provider'] ?? 'custom') !== 'pexels') {
            $data['image_api_key'] = null;
        }

        if (($data['image_enabled'] ?? false) === false) {
            $data['image_provider'] = 'custom';
        }

        $settings = AiProviderSetting::current() ?? new AiProviderSetting;
        $settings->fill($data)->save();

        $this->activityLog->log('ai.settings.updated', $settings, 'Memperbarui pengaturan AI.');

        return Redirect::back()->with('success', 'Pengaturan AI berhasil disimpan.');
    }
}
