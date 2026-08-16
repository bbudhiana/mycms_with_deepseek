<?php

namespace App\Policies;

use App\Models\Role;
use App\Models\User;

class RolePolicy
{
    public function viewAny(User $user): bool
    {
        return $user->hasAnyPermission(['manage_user', 'change_role']);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('change_role');
    }

    public function update(User $user, Role $role): bool
    {
        if ($role->name === 'super_admin') {
            return $user->hasRole('super_admin');
        }

        return $user->hasPermissionTo('change_role');
    }

    public function delete(User $user, Role $role): bool
    {
        if ($role->name === 'super_admin' || $role->users()->count() > 0) {
            return false;
        }

        return $user->hasPermissionTo('change_role');
    }
}
