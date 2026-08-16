<?php

use App\Models\ActivityLog;
use Illuminate\Auth\Notifications\VerifyEmail;
use Illuminate\Support\Facades\Notification;
use Inertia\Testing\AssertableInertia as Assert;

it('lets a user update their profile with job title and bio', function () {
    $user = userWithRole('editor');
    $this->actingAs($user);

    $this->patch('/settings/profile', [
        'name' => 'Angga Pratama',
        'email' => $user->email,
        'job_title' => 'Redaktur Pelaksana',
        'bio' => 'Menulis tentang teknologi dan media.',
    ])->assertSessionHasNoErrors()
        ->assertRedirect();

    $user->refresh();
    expect($user->name)->toBe('Angga Pratama')
        ->and($user->job_title)->toBe('Redaktur Pelaksana')
        ->and($user->bio)->toBe('Menulis tentang teknologi dan media.')
        ->and($user->email_verified_at)->not->toBeNull();
});

it('rejects an email already used by another user', function () {
    $other = userWithRole('editor');
    $user = userWithRole('editor');
    $this->actingAs($user);

    $this->patch('/settings/profile', [
        'name' => $user->name,
        'email' => $other->email,
        'job_title' => null,
        'bio' => null,
    ])->assertSessionHasErrors('email');
});

it('invalidates email verification and sends a notification when the email changes', function () {
    Notification::fake();

    $user = userWithRole('editor');
    $this->actingAs($user);

    $this->patch('/settings/profile', [
        'name' => $user->name,
        'email' => 'baru@example.com',
        'job_title' => null,
        'bio' => null,
    ])->assertSessionHasNoErrors()
        ->assertRedirect();

    $user->refresh();
    expect($user->email)->toBe('baru@example.com')
        ->and($user->email_verified_at)->toBeNull();

    Notification::assertSentTo($user, VerifyEmail::class);
});

it('logs a profile.updated activity entry', function () {
    $user = userWithRole('editor');
    $this->actingAs($user);

    $this->patch('/settings/profile', [
        'name' => 'Nama Baru',
        'email' => $user->email,
        'job_title' => 'Jurnalis',
        'bio' => null,
    ]);

    expect(ActivityLog::where('action', 'profile.updated')->where('entity_id', $user->id)->exists())->toBeTrue();
});

it('renders the settings profile page with account context', function () {
    $user = userWithRole('editor', ['job_title' => 'Editor', 'bio' => 'Bio singkat.'])->fresh();
    $this->actingAs($user);

    $this->get('/settings/profile')
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('Settings/Profile')
            ->has('user.roles', 1)
            ->where('user.job_title', 'Editor')
            ->where('user.bio', 'Bio singkat.')
            ->has('user.created_at')
            ->has('user.last_login_at')
        );
});

it('no longer exposes the dead addresses settings route', function () {
    $user = userWithRole('editor');
    $this->actingAs($user);

    $this->get('/settings/addresses')->assertNotFound();
});
