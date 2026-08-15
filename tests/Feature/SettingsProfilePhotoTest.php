<?php

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

it('lets a user upload a profile photo', function () {
    Storage::fake('public');

    $user = userWithRole('editor');
    $this->actingAs($user);

    $this->post('/settings/profile-photo', [
        'photo' => UploadedFile::fake()->image('avatar.jpg'),
    ])->assertRedirect();

    $user->refresh();
    expect($user->profile_photo_path)->not->toBeNull();
    Storage::disk('public')->assertExists($user->profile_photo_path);
});

it('rejects an invalid profile photo', function () {
    $user = userWithRole('editor');
    $this->actingAs($user);

    $this->post('/settings/profile-photo', [
        'photo' => UploadedFile::fake()->create('notes.txt', 100),
    ])->assertSessionHasErrors('photo');

    expect($user->fresh()->profile_photo_path)->toBeNull();
});

it('lets a user remove their profile photo', function () {
    Storage::fake('public');

    $user = userWithRole('editor');
    $user->update(['profile_photo_path' => 'profile-photos/avatar.jpg']);
    Storage::disk('public')->put('profile-photos/avatar.jpg', 'data');
    $this->actingAs($user);

    $this->delete('/settings/profile-photo')->assertRedirect();

    expect($user->fresh()->profile_photo_path)->toBeNull();
    Storage::disk('public')->assertMissing('profile-photos/avatar.jpg');
});
