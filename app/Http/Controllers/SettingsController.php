<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class SettingsController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function profile(Request $request)
    {
        return Inertia::render('Settings/Profile', [
            'user' => $request->user()->load('addresses'),
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

    public function addresses(Request $request)
    {
        return Inertia::render('Settings/Addresses', [
            'user' => $request->user()->load('addresses'),
        ]);
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
