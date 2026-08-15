<?php

namespace App\Policies;

use App\Models\Media;
use App\Models\User;

class MediaPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(['manage_media', 'upload_media', 'create_content']);
    }

    public function upload(User $user): bool
    {
        return $user->hasPermissionTo('upload_media');
    }

    public function update(User $user, Media $media): bool
    {
        if ($user->hasPermissionTo('manage_media')) {
            return true;
        }

        return $media->uploaded_by === $user->id && $user->hasPermissionTo('upload_media');
    }

    public function delete(User $user, Media $media): bool
    {
        if ($user->hasPermissionTo('manage_media')) {
            return true;
        }

        return $media->uploaded_by === $user->id && $user->hasPermissionTo('upload_media');
    }
}
