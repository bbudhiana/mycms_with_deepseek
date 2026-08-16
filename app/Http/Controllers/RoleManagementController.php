<?php

namespace App\Http\Controllers;

use App\Http\Requests\RoleRequest;
use App\Models\Role;
use App\Services\ActivityLogService;
use App\Support\PermissionCatalog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Inertia\Inertia;
use Spatie\Permission\Models\Permission;

class RoleManagementController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::query()
            ->with('permissions:id,name')
            ->withCount('users')
            ->orderBy('name')
            ->get()
            ->map(function (Role $role) {
                $data = $role->toArray();
                $data['protected'] = $role->name === 'super_admin';

                return $data;
            });

        $permissions = Permission::query()->orderBy('name')->get(['id', 'name'])->map(fn (Permission $p) => [
            'id' => $p->id,
            'name' => $p->name,
            'label' => PermissionCatalog::label($p->name),
            'group' => PermissionCatalog::group($p->name),
            'critical' => PermissionCatalog::isCritical($p->name),
        ]);

        $busiestRole = Role::query()->withCount('users')->get()->sortByDesc('users_count')->first();
        $rarestPermission = Permission::query()->withCount('roles')->get()->sortBy('roles_count')->first();

        return Inertia::render('Roles/Index', [
            'roles' => $roles,
            'permissions' => $permissions,
            'permissionGroups' => PermissionCatalog::groups(),
            'stats' => [
                'totalRoles' => $roles->count(),
                'totalPermissions' => $permissions->count(),
                'busiestRole' => $busiestRole ? ['name' => $busiestRole->name, 'users_count' => $busiestRole->users_count] : null,
                'rarestPermission' => $rarestPermission ? [
                    'name' => $rarestPermission->name,
                    'label' => PermissionCatalog::label($rarestPermission->name),
                    'roles_count' => $rarestPermission->roles_count,
                ] : null,
            ],
            'can' => [
                'changeRole' => $request->user()->hasPermissionTo('change_role'),
                'manageUser' => $request->user()->hasPermissionTo('manage_user'),
            ],
        ]);
    }

    public function store(RoleRequest $request)
    {
        $this->authorize('create', Role::class);

        $data = $request->validated();
        $role = new Role(['name' => Str::lower(trim($data['name']))]);
        $role->save();
        $role->syncPermissions($data['permissions']);

        $this->activityLog->log('role.created', $role, "Membuat role '{$role->name}'.");

        return Redirect::back()->with('success', 'Role berhasil dibuat.');
    }

    public function update(RoleRequest $request, Role $role)
    {
        abort_if($role->name === 'super_admin', 403, 'Peran super_admin tidak dapat diubah.');

        $this->authorize('update', $role);

        $data = $request->validated();
        $role->update(['name' => Str::lower(trim($data['name']))]);
        $role->syncPermissions($data['permissions']);

        $this->activityLog->log('role.updated', $role, "Memperbarui role '{$role->name}'.");

        return Redirect::back()->with('success', 'Role berhasil diperbarui.');
    }

    public function destroy(Request $request, Role $role)
    {
        abort_if($role->name === 'super_admin', 403, 'Peran super_admin tidak dapat dihapus.');
        abort_if($role->users()->count() > 0, 403, 'Peran yang masih dipakai tidak dapat dihapus.');

        $this->authorize('delete', $role);

        $name = $role->name;
        $role->delete();

        $this->activityLog->log('role.deleted', null, "Menghapus role '{$name}'.");

        return Redirect::back()->with('success', 'Role berhasil dihapus.');
    }
}
