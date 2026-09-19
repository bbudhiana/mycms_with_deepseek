<?php

namespace App\Observers;

use App\Models\User;
use Illuminate\Support\Str;

class UserObserver
{
    public function saving(User $user): void
    {
        if ($user->isDirty('name') || empty($user->slug)) {
            $user->slug = $this->uniqueSlug(Str::slug($user->name), $user);
        }
    }

    private function uniqueSlug(string $slug, User $user): string
    {
        $base = $slug;
        $suffix = 2;

        while (
            User::query()
                ->where('slug', $slug)
                ->when($user->exists, fn ($q) => $q->whereKeyNot($user->getKey()))
                ->exists()
        ) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
