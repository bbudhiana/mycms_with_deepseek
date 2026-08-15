<?php

namespace App\Observers;

use App\Models\Content;
use Illuminate\Support\Str;

class ContentObserver
{
    public function saving(Content $content): void
    {
        if ($content->isDirty('title') || empty($content->slug)) {
            $slug = Str::slug($content->title);
            $content->slug = $this->uniqueSlug($slug, $content);
        }
    }

    private function uniqueSlug(string $slug, Content $content): string
    {
        $base = $slug;
        $suffix = 2;

        while (
            Content::query()
                ->where('slug', $slug)
                ->when($content->exists, fn ($q) => $q->whereKeyNot($content->getKey()))
                ->exists()
        ) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
