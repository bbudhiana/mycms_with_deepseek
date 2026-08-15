<?php

use App\Models\User;

it('redirects guests away from the dashboard', function () {
    $this->get('/dashboard')
        ->assertRedirect('/login');
});

it('allows guests to view the welcome page', function () {
    $this->get('/')
        ->assertStatus(200);
});

it('lets a verified, active user reach the dashboard', function () {
    actingAsRole('author');

    $this->get('/dashboard')->assertOk();
});

it('blocks an unverified user from internal pages', function () {
    $user = User::factory()->create([
        'email_verified_at' => null,
        'is_active' => true,
    ]);

    $this->actingAs($user)
        ->get('/dashboard')
        ->assertRedirect(route('verification.notice'));
});

it('blocks an inactive user via policy-sensitive authorisation', function () {
    $active = actingAsRole('admin');

    $inactive = User::factory()->create(['email_verified_at' => now(), 'is_active' => false]);

    $active->post('/users/'.$inactive->id.'/toggle-active', ['activate' => true])
        ->assertRedirect();

    $inactive->refresh();
    expect($inactive->is_active)->toBeTrue();
});
