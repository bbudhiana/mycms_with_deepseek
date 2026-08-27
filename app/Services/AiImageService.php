<?php

namespace App\Services;

use App\Models\Media;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use RuntimeException;

class AiImageService
{
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
                ->get('https://api.pexels.com/v1/search', ['query' => $query, 'per_page' => 1, 'locale' => 'id-ID']);
        } catch (ConnectionException) {
            throw new RuntimeException('Tidak dapat terhubung ke Pexels API.');
        }

        if ($response->failed()) {
            $error = $response->json('error') ?? $response->body();
            throw new RuntimeException('Pexels error ('.$response->status().'): '.$error);
        }

        $url = $response->json('photos.0.src.large2x')
            ?? $response->json('photos.0.src.original')
            ?? $response->json('photos.0.src.medium');

        return is_string($url) ? $url : null;
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
