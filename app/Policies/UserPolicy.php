<?php

namespace App\Policies;

use App\Models\User;

class UserPolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasPermissionTo('manage_user');
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('manage_user');
    }

    public function update(User $user, User $model): bool
    {
        return $user->hasPermissionTo('manage_user');
    }

    public function changeRole(User $user, User $model): bool
    {
        return $user->hasPermissionTo('change_role');
    }

    public function activate(User $user, User $model): bool
    {
        return $user->hasPermissionTo('manage_user');
    }

    public function deactivate(User $user, User $model): bool
    {
        if ($model->id === $user->id) {
            return false;
        }

        return $user->hasPermissionTo('manage_user');
    }

    public function delete(User $user, User $model): bool
    {
        if ($model->id === $user->id) {
            return false;
        }

        return $user->hasPermissionTo('manage_user');
    }
}
