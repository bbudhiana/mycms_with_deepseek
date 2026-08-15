<?php

namespace App\Http\Middleware;

use App\Models\Category;
use App\Models\Tag;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function share(Request $request): array
    {
        $user = $request->user();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'job_title' => $user->job_title,
                    'bio' => $user->bio,
                    'is_active' => $user->is_active,
                    'profile_photo_url' => $user->profile_photo_path
                        ? asset('storage/'.$user->profile_photo_path)
                        : null,
                    'roles' => $user->getRoleNames(),
                    'permissions' => $user->getAllPermissions()->pluck('name'),
                ] : null,
            ],
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'info' => fn () => $request->session()->get('info'),
            ],
            'cms' => $this->sharedCmsData($request),
        ];
    }

    private function sharedCmsData(Request $request): ?array
    {
        if (! $request->user()) {
            return null;
        }

        return [
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'slug', 'parent_id']),
            'tags' => Tag::query()->orderBy('name')->get(['id', 'name', 'slug']),
        ];
    }
}
