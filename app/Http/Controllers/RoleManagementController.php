<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleManagementController extends Controller
{
    public function __invoke(Request $request)
    {
        $this->authorize('viewAny', \App\Models\Role::class);

        $roles = Role::query()
            ->with('permissions:id,name')
            ->withCount('users')
            ->orderBy('name')
            ->get();

        $permissionList = Permission::query()->orderBy('name')->get(['id', 'name']);

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'permissions' => $permissionList,
            'can' => [
                'changeRole' => $request->user()->hasPermissionTo('change_role'),
                'manageUser' => $request->user()->hasPermissionTo('manage_user'),
            ],
        ]);
    }
}
