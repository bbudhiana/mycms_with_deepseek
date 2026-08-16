<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function profile(Request $request)
    {
        return Inertia::render('Settings/Profile', [
            'user' => $request->user()->load('addresses', 'roles:id,name'),
        ]);
    }

    public function security(Request $request)
    {
        return Inertia::render('Settings/Security', [
            'twoFactorEnabled' => (bool) $request->user()->two_factor_secret,
            'hasPasskeys' => $request->user()->passkeys()->exists(),
        ]);
    }

    public function appearance(Request $request)
    {
        return Inertia::render('Settings/Appearance');
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'job_title' => ['nullable', 'string', 'max:255'],
            'bio' => ['nullable', 'string', 'max:65535'],
        ]);

        $emailChanged = $validated['email'] !== $user->email;

        $user->forceFill($validated);

        if ($emailChanged && $user instanceof MustVerifyEmail) {
            $user->email_verified_at = null;
            $user->save();

            $user->sendEmailVerificationNotification();
        } else {
            $user->save();
        }

        $this->activityLog->log('profile.updated', $user, "Memperbarui profil '{$user->name}'.");

        return Redirect::back()->with('success', 'Profil berhasil diperbarui.');
    }

    public function updateProfilePhoto(Request $request)
    {
        $request->validate([
            'photo' => ['required', 'image', 'max:1024'],
        ], [], ['photo' => 'foto profil']);

        $user = $request->user();

        $this->deleteExistingPhoto($user);

        $path = $request->file('photo')->store('profile-photos', 'public');

        $user->update(['profile_photo_path' => $path]);

        $this->activityLog->log('profile.photo_updated', $user, "Memperbarui foto profil '{$user->name}'.");

        return Redirect::back()->with('success', 'Foto profil berhasil diperbarui.');
    }

    public function destroyProfilePhoto(Request $request)
    {
        $user = $request->user();

        $this->deleteExistingPhoto($user);
        $user->update(['profile_photo_path' => null]);

        $this->activityLog->log('profile.photo_removed', $user, "Menghapus foto profil '{$user->name}'.");

        return Redirect::back()->with('success', 'Foto profil dihapus.');
    }

    private function deleteExistingPhoto(User $user): void
    {
        if ($user->profile_photo_path) {
            Storage::disk('public')->delete($user->profile_photo_path);
        }
    }
}
