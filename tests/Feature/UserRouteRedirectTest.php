<?php

use App\Models\User;

it('redirects the user store to the web users index, not the api endpoint', function () {
    actingAsRole('admin');

    $response = $this->post('/users', [
        'name' => 'Baru',
        'email' => 'baru@example.com',
        'password' => 'password',
        'password_confirmation' => 'password',
        'roles' => ['author'],
    ]);

    $response->assertRedirect('/users');
    $response->assertSessionHas('inertia.flash_data.success', 'User berhasil dibuat.');
    expect(User::where('email', 'baru@example.com')->exists())->toBeTrue();
});

it('redirects the user update back to the edit page with a success flash', function () {
    $super = actingAsRole('super_admin');
    $target = userWithRole('author');

    $response = $this->patch('/users/'.$target->id, [
        'name' => $target->name,
        'email' => $target->email,
        'roles' => ['editor'],
    ]);

    $response->assertRedirect();
    $response->assertSessionHas('inertia.flash_data.success', 'User diperbarui.');
});

it('redirects the user destroy to the web users index, not the api endpoint', function () {
    actingAsRole('admin');
    $target = userWithRole('author');

    $response = $this->delete('/users/'.$target->id);

    $response->assertRedirect('/users');
    $response->assertSessionHas('inertia.flash_data.success', 'User dihapus.');
    expect(User::find($target->id))->toBeNull();
});

it('keeps the web routes for users distinct from the api routes', function () {
    $named = collect(app('router')->getRoutes())
        ->filter(fn ($r) => str_starts_with($r->getName() ?? '', 'api.users.'));

    expect($named)->not->toBeEmpty();
    expect($named->pluck('uri')->all())->each->toStartWith('api/');
});
