<?php

use App\Models\Content;
use Illuminate\Auth\Events\Login;
use Inertia\Testing\AssertableInertia as Assert;

it('tracks the last login time when a user signs in', function () {
    $user = userWithRole('editor');

    event(new Login('web', $user, false));

    expect($user->fresh()->last_login_at)->not->toBeNull();
});

it('exposes last login in the users list and keeps last contribution', function () {
    $admin = userWithRole('admin');
    $lastLogin = now()->subHours(3)->startOfSecond();

    $user = userWithRole('author', ['last_login_at' => $lastLogin]);
    Content::factory()->published()->create(['author_id' => $user->id]);

    $this->actingAs($admin)->get('/users?search='.$user->email)->assertInertia(fn (Assert $page) => $page
        ->where('users.data.0.id', $user->id)
        ->where('users.data.0.last_login_at', $lastLogin->toISOString())
        ->has('users.data.0.contents_max_updated_at')
    );
});

it('sorts users by most recent login', function () {
    $admin = userWithRole('admin');
    $recent = userWithRole('author', ['last_login_at' => now()->subHour()]);
    $old = userWithRole('author', ['last_login_at' => now()->subDays(10)]);

    $this->actingAs($admin)->get('/users?sort=login')->assertInertia(fn (Assert $page) => $page
        ->where('filters.sort', 'login')
        ->where('users.data.0.id', $recent->id)
    );
});
