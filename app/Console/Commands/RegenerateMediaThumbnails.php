<?php

namespace App\Console\Commands;

use App\Models\Media;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Storage;

#[Signature('media:regenerate-thumbnails')]
#[Description('Generate on-disk thumbnails for raster image media (idempotent).')]
class RegenerateMediaThumbnails extends Command
{
    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $query = Media::query()
            ->where('mime_type', 'like', 'image/%')
            ->where('mime_type', '!=', 'image/svg+xml');

        $total = (clone $query)->count();
        $already = 0;
        $generated = 0;
        $skipped = 0;

        $this->info("Memproses {$total} file gambar…");

        $query->chunkById(100, function ($mediaItems) use (&$already, &$generated, &$skipped) {
            foreach ($mediaItems as $media) {
                if ($this->hasThumbnail($media)) {
                    $already++;

                    continue;
                }

                $media->ensureThumbnail();

                if ($this->hasThumbnail($media)) {
                    $generated++;
                } else {
                    $skipped++;
                }
            }
        });

        $this->info("Selesai: {$generated} thumbnail dibuat, {$already} sudah ada, {$skipped} dilewati.");

        return self::SUCCESS;
    }

    /**
     * @phpstan-impure
     */
    private function hasThumbnail(Media $media): bool
    {
        return Storage::disk('public')->exists($media->thumbnailPath());
    }
}
