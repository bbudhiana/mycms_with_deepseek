<?php

namespace App\Services;

use App\Models\AiProviderSetting;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use RuntimeException;

class AiProviderService
{
    public function settings(): ?AiProviderSetting
    {
        return AiProviderSetting::current();
    }

    /**
     * Send a chat completion request to any OpenAI-compatible endpoint.
     *
     * @param  array<int, array<string, string>>  $messages
     * @return string The assistant message content.
     *
     * @throws RuntimeException When no settings exist, the endpoint fails, or the model returns an error.
     */
    public function complete(array $messages): string
    {
        $settings = $this->settings();

        if (! $settings) {
            throw new RuntimeException('Pengaturan AI belum dikonfigurasi.');
        }

        $baseUrl = rtrim($settings->base_url, '/');

        try {
            // Connect timeout terpisah dari total timeout agar DNS/TCP hang
            // tidak melebihi PHP max_execution_time sebelum cURL sempat
            // membatalkan requestnya sendiri.
            /** @var Response $response */
            $response = Http::connectTimeout(10)
                ->timeout(120)
                ->withToken($settings->api_key)
                ->acceptJson()
                ->post($baseUrl.'/chat/completions', [
                    'model' => $settings->model,
                    'messages' => $messages,
                    'temperature' => $settings->temperature,
                    'max_tokens' => $settings->max_tokens,
                    'response_format' => ['type' => 'json_object'],
                ]);
        } catch (ConnectionException $e) {
            throw new RuntimeException('Tidak dapat terhubung ke AI provider: '.$e->getMessage());
        }

        if ($response->failed()) {
            $detail = $response->json('error.message') ?? $response->body();
            throw new RuntimeException('AI provider error ('.$response->status().'): '.$detail);
        }

        $content = $response->json('choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('AI provider mengembalikan konten kosong.');
        }

        return $content;
    }
}
