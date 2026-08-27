<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class AiImageService
{
    /**
     * Tell Unsplash (and anyone debugging outbound calls) which app is making
     * the request. Demo apps without `Via` get 403'd; production apps without
     * a real `User-Agent` are throttled or blocked. Keep both.
     */
    private const UNSPLASH_USER_AGENT = 'MyNews-CMS/1.0';

    /**
     * Ask the configured image provider for a suitable photo for the topic,
     * download it, and store it in the Media library. Returns null when image
     * fetching is disabled or no usable image is found.
     *
     * @throws RuntimeException When the provider fails or responds with unusable data.
     */
    public function fetchFeaturedImage(string $query, ?int $uploadedBy): ?Media
    {
        $settings = app(AiProviderService::class)->settings();

        if (! $settings || ! $settings->image_enabled) {
            return null;
        }

        if ($settings->image_provider === 'pexels') {
            $url = $this->pexelsSearch($query);
        } elseif ($settings->image_provider === 'unsplash') {
            $url = $this->unsplashSearch($query);
            if ($url !== null) {
                $this->trackUnsplashDownload($url);
            }
        } else {
            $url = $this->customSearch($query);
        }

        if ($url === null) {
            return null;
        }

        return $this->downloadAndStore($url, $query, $uploadedBy);
    }

    private function pexelsSearch(string $query): ?string
    {
        $settings = app(AiProviderService::class)->settings();

        if (! $settings || blank($settings->image_api_key)) {
            throw new RuntimeException('API key Pexels belum dikonfigurasi.');
        }

        try {
            /** @var Response $response */
            $response = Http::connectTimeout(10)
                ->timeout(30)
                ->withHeaders(['Authorization' => $settings->image_api_key])
                ->acceptJson()
                ->get('https://api.pexels.com/v1/search', ['query' => $query, 'per_page' => 6, 'locale' => 'id-ID']);
        } catch (ConnectionException) {
            throw new RuntimeException('Tidak dapat terhubung ke Pexels API.');
        }

        if ($response->failed()) {
            $error = $response->json('error') ?? $response->body();
            throw new RuntimeException('Pexels error ('.$response->status().'): '.$error);
        }

        $randomNumber = Arr::random([0, 1, 2, 3, 4, 5]);

        $url = $response->json('photos.'.$randomNumber.'.src.large2x')
            ?? $response->json('photos.'.$randomNumber.'.src.original')
            ?? $response->json('photos.'.$randomNumber.'.src.medium');

        return is_string($url) ? $url : null;
    }

    private function unsplashSearch(string $query): ?string
    {
        $settings = app(AiProviderService::class)->settings();

        if (! $settings || blank($settings->image_api_key)) {
            throw new RuntimeException('Access key Unsplash belum dikonfigurasi.');
        }

        try {
            /** @var Response $response */
            $response = Http::connectTimeout(10)
                ->timeout(30)
                ->withHeaders($this->unsplashHeaders($settings->image_api_key))
                ->acceptJson()
                ->get('https://api.unsplash.com/search/photos', ['query' => $query, 'per_page' => 10, 'lang' => 'id']);
        } catch (ConnectionException) {
            throw new RuntimeException('Tidak dapat terhubung ke Unsplash API.');
        }

        if ($response->failed()) {
            $error = $response->json('errors.0') ?? $response->body();
            throw new RuntimeException('Unsplash error ('.$response->status().'): '.$error);
        }

        $results = $response->json('results');
        if (! is_array($results) || $results === []) {
            return null;
        }

        $pickIndex = Arr::random(range(0, count($results) - 1));
        $photo = $results[$pickIndex];

        return $photo['urls']['regular']
            ?? $photo['urls']['small']
            ?? $photo['urls']['full']
            ?? null;
    }

    /**
     * Headers Unsplash wajib/kuat:
     * - `Accept-Version: v1` → tanpa ini Unsplash balas 426 atau tolak request
     * - `Authorization: Client-ID <key>` → autentikasi public-action
     * - `User-Agent` / `Via` → wajib untuk lolos rate-limit & anti-bot (tanpa ini 403)
     *
     * @return array<string, string>
     */
    private function unsplashHeaders(string $accessKey): array
    {
        return [
            'Authorization' => 'Client-ID '.$accessKey,
            'Accept-Version' => 'v1',
            'User-Agent' => self::UNSPLASH_USER_AGENT,
            'Via' => self::UNSPLASH_USER_AGENT,
        ];
    }

    /**
     * Trigger Unsplash's download-tracking endpoint. Required by their API
     * guidelines: applications that download a photo must fire a GET to
     * /photos/{id}/download so Unsplash can count it. Best-effort — image
     * download should not fail if tracking fails.
     */
    private function trackUnsplashDownload(?string $imageUrl): void
    {
        if ($imageUrl === null || $imageUrl === '') {
            return;
        }

        if (! preg_match('#unsplash\.com/photo-([A-Za-z0-9_-]+)#', $imageUrl, $matches)) {
            return;
        }

        $settings = app(AiProviderService::class)->settings();
        if (! $settings || blank($settings->image_api_key)) {
            return;
        }

        try {
            Http::connectTimeout(5)
                ->timeout(15)
                ->withHeaders($this->unsplashHeaders($settings->image_api_key))
                ->get('https://api.unsplash.com/photos/'.$matches[1].'/download');
        } catch (\Throwable) {
            // Tracking is best-effort; never block the main flow.
        }
    }

    private function customSearch(string $query): ?string
    {
        $settings = app(AiProviderService::class)->settings();

        if (! $settings || blank($settings->image_endpoint_url)) {
            return null;
        }

        try {
            /** @var Response $response */
            $response = Http::connectTimeout(10)
                ->timeout(60)
                ->acceptJson()
                ->get($settings->image_endpoint_url, ['query' => $query]);
        } catch (ConnectionException) {
            throw new RuntimeException('Tidak dapat terhubung ke endpoint image.');
        }

        if ($response->failed()) {
            throw new RuntimeException('Image endpoint error ('.$response->status().'): '.$response->body());
        }

        $url = $response->json('results.0.url')
            ?? $response->json('results.0.src.large2x')
            ?? $response->json('results.0.src.medium')
            ?? $response->json('results.0.src.original')
            ?? $response->json('url')
            ?? ($response->json('results')[0] ?? null);

        if (is_array($url)) {
            $url = $url['url'] ?? ($url['src']['large2x'] ?? null);
        }

        if (! is_string($url) || ! filter_var($url, FILTER_VALIDATE_URL)) {
            throw new RuntimeException('Image endpoint tidak mengembalikan URL gambar yang valid.');
        }

        return $url;
    }

    private function downloadAndStore(string $url, string $query, ?int $uploadedBy): Media
    {
        try {
            $image = Http::connectTimeout(10)->timeout(60)->get($url);
        } catch (ConnectionException) {
            throw new RuntimeException('Gagal mengunduh gambar dari: '.$url);
        }

        if ($image->failed() || blank($image->body())) {
            throw new RuntimeException('Gagal mengunduh gambar dari: '.$url);
        }

        $extension = $this->guessExtension($url, $image->header('Content-Type'));

        if ($extension === null) {
            throw new RuntimeException('Jenis file gambar tidak dikenali.');
        }

        $filename = Str::uuid().'.'.$extension;
        $path = 'media/'.now()->format('Y/m').'/'.$filename;

        Storage::disk('public')->put($path, $image->body());

        $media = Media::create([
            'filename' => $filename,
            'original_name' => Str::afterLast($url, '/'),
            'path' => $path,
            'mime_type' => $image->header('Content-Type') ?: 'image/'.$extension,
            'size' => strlen($image->body()),
            'alt_text' => Str::limit($query, 255),
            'uploaded_by' => $uploadedBy,
        ]);

        $media->fillDimensions();
        $media->ensureThumbnail();

        return $media;
    }

    private function guessExtension(string $url, ?string $contentType): ?string
    {
        if ($contentType !== null) {
            return match (Str::before($contentType, ';')) {
                'image/jpeg', 'image/jpg' => 'jpg',
                'image/png' => 'png',
                'image/webp' => 'webp',
                'image/gif' => 'gif',
                default => null,
            };
        }

        $ext = Str::afterLast(parse_url($url, PHP_URL_PATH) ?? '', '.');

        return in_array($ext, ['jpg', 'jpeg', 'png', 'webp', 'gif'], true) ? strtolower($ext) : null;
    }
}
