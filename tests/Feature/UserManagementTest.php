<?php

use App\Models\User;

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
