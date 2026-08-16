<?php

use App\Models\Content;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

it('lets an admin create a user with a role', function () {
    actingAsRole('admin');

    $this->post('/users', [
        'name' => 'Baru',
        'email' => 'baru@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'roles' => ['author'],
    ])->assertRedirect();

    $user = User::where('email', 'baru@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->hasRole('author'))->toBeTrue();
});

it('requires a unique email', function () {
    actingAsRole('admin');

    $existing = User::factory()->create(['email' => 'duplicate@example.com']);

    $this->post('/users', [
        'name' => 'X',
        'email' => 'duplicate@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'roles' => ['author'],
    ])->assertSessionHasErrors('email');
});

it('requires the password to be confirmed and at least 8 chars', function () {
    actingAsRole('admin');

    $this->post('/users', [
        'name' => 'X',
        'email' => 'x@example.com',
        'password' => 'short',
        'password_confirmation' => 'short',
        'roles' => ['author'],
    ])->assertSessionHasErrors('password');
});

it('prevents a user from deleting their own account', function () {
    $admin = userWithRole('admin');

    $this->actingAs($admin)
        ->delete('/users/'.$admin->id)
        ->assertForbidden();

    expect(User::find($admin->id))->not->toBeNull();
});

it('lets a super admin change a role', function () {
    $super = actingAsRole('super_admin');
    $target = userWithRole('author');

    $this->patch('/users/'.$target->id, [
        'name' => $target->name,
        'email' => $target->email,
        'roles' => ['editor'],
    ])->assertRedirect();

    expect($target->fresh()->hasRole('editor'))->toBeTrue();
});

it('blocks an admin without change_role permission from changing roles', function () {
    $admin = actingAsRole('admin');
    $target = userWithRole('author');

    $this->patch('/users/'.$target->id, [
        'name' => $target->name,
        'email' => $target->email,
        'roles' => ['admin'],
    ])->assertForbidden();

    expect($target->fresh()->hasRole('author'))->toBeTrue();
});

it('blocks a viewer from managing users', function () {
    actingAsRole('viewer');

    $this->get('/users')->assertForbidden();
});

it('exposes team health stats', function () {
    $admin = userWithRole('admin');
    userWithRole('author', ['is_active' => false]);
    userWithRole('author', ['email_verified_at' => null]);

    $this->actingAs($admin)->get('/users')->assertInertia(fn (Assert $page) => $page
        ->component('Users/Index')
        ->where('stats.total', 3)
        ->where('stats.active', 2)
        ->where('stats.inactive', 1)
        ->where('stats.unverified', 1)
    );
});

it('reports published counts and last contribution for a user', function () {
    $admin = userWithRole('admin');
    $target = userWithRole('author');
    $updatedAt = now()->subDays(2)->startOfSecond();
    $published = Content::factory()->published()->create(['author_id' => $target->id]);
    $published->timestamps = false;
    $published->forceFill(['updated_at' => $updatedAt])->save();
    $draft = Content::factory()->draft()->create(['author_id' => $target->id]);
    $draft->timestamps = false;
    $draft->forceFill(['updated_at' => now()->subDays(5)->startOfSecond()])->save();

    $this->actingAs($admin)->get('/users?search='.$target->email)->assertInertia(fn (Assert $page) => $page
        ->has('users.data', 1)
        ->where('users.data.0.id', $target->id)
        ->where('users.data.0.contents_count', 2)
        ->where('users.data.0.published_author_count', 1)
        ->where('users.data.0.reviews_count', 0)
        ->where('users.data.0.contents_max_updated_at', $updatedAt->toISOString())
    );
});

it('sorts users by contribution count', function () {
    $admin = userWithRole('admin');
    $busy = userWithRole('author');
    $quiet = userWithRole('author');
    Content::factory()->count(3)->create(['author_id' => $busy->id]);
    Content::factory()->count(1)->create(['author_id' => $quiet->id]);

    $this->actingAs($admin)->get('/users?sort=contributions')->assertInertia(fn (Assert $page) => $page
        ->where('filters.sort', 'contributions')
        ->where('users.data.0.id', $busy->id)
    );
});

it('filters users by unverified email', function () {
    $admin = userWithRole('admin');
    userWithRole('author');
    $unverified = userWithRole('author', ['email_verified_at' => null]);

    $this->actingAs($admin)->get('/users?verified=no')->assertInertia(fn (Assert $page) => $page
        ->where('filters.verified', 'no')
        ->has('users.data', 1)
        ->where('users.data.0.id', $unverified->id)
    );
});

it('filters users by inactive status', function () {
    $admin = userWithRole('admin');
    $inactive = userWithRole('author', ['is_active' => false]);
    userWithRole('author');

    $this->actingAs($admin)->get('/users?status=inactive')->assertInertia(fn (Assert $page) => $page
        ->where('filters.status', 'inactive')
        ->has('users.data', 1)
        ->where('users.data.0.id', $inactive->id)
    );
});
