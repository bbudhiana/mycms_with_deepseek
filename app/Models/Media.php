<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

/**
 * @property int $id
 * @property string $filename
 * @property string $original_name
 * @property string $path
 * @property string|null $mime_type
 * @property int $size
 * @property int|null $width
 * @property int|null $height
 * @property string|null $alt_text
 * @property int|null $uploaded_by
 */
class Media extends Model
{
    use HasFactory;

    protected $fillable = [
        'filename',
        'original_name',
        'path',
        'mime_type',
        'size',
        'width',
        'height',
        'alt_text',
        'uploaded_by',
    ];

    protected $appends = ['url', 'thumbnail_url'];

    /**
     * Max edge length (px) for the on-disk thumbnail used in grids and pickers.
     */
    private const THUMBNAIL_MAX_DIMENSION = 640;

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function usedByFeaturedContents(): HasMany
    {
        return $this->hasMany(Content::class, 'featured_image_id');
    }

    public function usedByThumbnailContents(): HasMany
    {
        return $this->hasMany(Content::class, 'thumbnail_id');
    }

    /**
     * Read and persist image dimensions for legacy rows that predate the
     * width/height columns. Idempotent and safe for files that no longer exist.
     */
    public function fillDimensions(): self
    {
        if ($this->width !== null && $this->height !== null) {
            return $this;
        }

        if (! $this->isImage()) {
            return $this;
        }

        [$width, $height] = $this->readDimensions();

        if ($width !== null && $height !== null) {
            $this->width = $width;
            $this->height = $height;
            $this->saveQuietly();
        }

        return $this;
    }

    /**
     * @return array{0: int|null, 1: int|null}
     */
    private function readDimensions(): array
    {
        try {
            $disk = Storage::disk('public');

            if ($this->mime_type === 'image/svg+xml') {
                return $this->parseSvgDimensions($disk->get($this->path));
            }

            $info = @getimagesize($disk->path($this->path));

            if ($info === false) {
                return [null, null];
            }

            return [(int) $info[0], (int) $info[1]];
        } catch (\Throwable) {
            return [null, null];
        }
    }

    /**
     * @return array{0: int|null, 1: int|null}
     */
    private function parseSvgDimensions(?string $svg): array
    {
        if ($svg === null) {
            return [null, null];
        }

        $width = null;
        $height = null;

        if (preg_match('/<svg[^>]*\bwidth="([\d.]+)(?:px)?"/', $svg, $match)) {
            $width = (float) $match[1];
        }

        if (preg_match('/<svg[^>]*\bheight="([\d.]+)(?:px)?"/', $svg, $match)) {
            $height = (float) $match[1];
        }

        if ($width === null || $height === null) {
            if (preg_match('/<svg[^>]*\bviewBox="\s*[\d.]+\s+[\d.]+\s+([\d.]+)\s+([\d.]+)/', $svg, $match)) {
                $width = $width ?? (float) $match[1];
                $height = $height ?? (float) $match[2];
            }
        }

        if ($width === null || $height === null) {
            return [null, null];
        }

        return [(int) round($width), (int) round($height)];
    }

    /**
     * Generate an on-disk thumbnail for raster images when one does not exist.
     * Vector (SVG) and non-image files are skipped: the grid falls back to the
     * original URL for SVG and to an icon for documents.
     */
    public function ensureThumbnail(): self
    {
        if (! $this->isImage() || $this->mime_type === 'image/svg+xml') {
            return $this;
        }

        $disk = Storage::disk('public');
        $thumbnailPath = $this->thumbnailPath();

        if ($disk->exists($thumbnailPath)) {
            return $this;
        }

        try {
            $data = $this->generateThumbnailData();

            if ($data !== null) {
                $disk->put($thumbnailPath, $data);
            }
        } catch (\Throwable) {
            // Leave without a thumbnail; consumers fall back to the original URL.
        }

        return $this;
    }

    public function thumbnailPath(): string
    {
        return 'media/thumbs/'.Str::after($this->path, 'media/');
    }

    public function getThumbnailUrlAttribute(): ?string
    {
        if (! $this->isImage() || $this->mime_type === 'image/svg+xml') {
            return null;
        }

        if (! Storage::disk('public')->exists($this->thumbnailPath())) {
            return null;
        }

        return asset('storage/'.$this->thumbnailPath());
    }

    private function generateThumbnailData(): ?string
    {
        $disk = Storage::disk('public');
        $info = @getimagesize($disk->path($this->path));

        if ($info === false) {
            return null;
        }

        [$sourceWidth, $sourceHeight] = $info;
        $mime = $info['mime'];

        $creator = match ($mime) {
            'image/jpeg' => 'imagecreatefromjpeg',
            'image/png' => 'imagecreatefrompng',
            'image/webp' => 'imagecreatefromwebp',
            'image/gif' => 'imagecreatefromgif',
            default => null,
        };

        if ($creator === null || ! function_exists($creator)) {
            return null;
        }

        $source = @$creator($disk->path($this->path));

        if ($source === false) {
            return null;
        }

        $scale = min(1, self::THUMBNAIL_MAX_DIMENSION / max($sourceWidth, $sourceHeight));
        $targetWidth = max(1, (int) round($sourceWidth * $scale));
        $targetHeight = max(1, (int) round($sourceHeight * $scale));

        $target = imagecreatetruecolor($targetWidth, $targetHeight);

        if ($target === false) {
            imagedestroy($source);

            return null;
        }

        imagealphablending($target, false);
        imagesavealpha($target, true);
        imagecopyresampled($target, $source, 0, 0, 0, 0, $targetWidth, $targetHeight, $sourceWidth, $sourceHeight);

        ob_start();

        match ($mime) {
            'image/jpeg' => imagejpeg($target, null, 82),
            'image/png' => imagepng($target, null, 8),
            'image/webp' => imagewebp($target, null, 82),
            default => imagegif($target),
        };

        $data = ob_get_clean();

        imagedestroy($source);
        imagedestroy($target);

        return $data === false ? null : $data;
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/'.$this->path);
    }

    public function deleteFromDisk(): bool
    {
        try {
            $disk = Storage::disk('public');
            $deleted = $disk->delete($this->path);

            if ($this->isImage() && $this->mime_type !== 'image/svg+xml') {
                $disk->delete($this->thumbnailPath());
            }

            return $deleted;
        } catch (\Throwable) {
            return false;
        }
    }

    public function isImage(): bool
    {
        return $this->mime_type !== null && str_starts_with($this->mime_type, 'image/');
    }

    public function scopeSearch($query, ?string $search)
    {
        return $query->when($search, fn ($q) => $q->where('original_name', 'like', "%{$search}%"));
    }
}
