<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\Content;
use App\Models\Media;
use App\Models\Role;
use App\Models\Tag;
use App\Models\User;
use App\Observers\ContentObserver;
use App\Observers\TagObserver;
use App\Policies\CategoryPolicy;
use App\Policies\ContentPolicy;
use App\Policies\MediaPolicy;
use App\Policies\RolePolicy;
use App\Policies\TagPolicy;
use App\Policies\UserPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;
use Inertia\Inertia;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Inertia::setRootView('app');

        Gate::before(function ($user, $ability) {
            if ($user instanceof User && $user->hasRole('super_admin')) {
                return true;
            }

            return null;
        });

        $this->registerPolicies();
        $this->registerObservers();
    }

    private function registerPolicies(): void
    {
        Gate::policy(Content::class, ContentPolicy::class);
        Gate::policy(User::class, UserPolicy::class);
        Gate::policy(Media::class, MediaPolicy::class);
        Gate::policy(Category::class, CategoryPolicy::class);
        Gate::policy(Tag::class, TagPolicy::class);
        Gate::policy(Role::class, RolePolicy::class);
    }

    private function registerObservers(): void
    {
        Tag::observe(TagObserver::class);
        Content::observe(ContentObserver::class);
    }
}
