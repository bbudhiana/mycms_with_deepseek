<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    /**
     * All available permissions in the CMS.
     *
     * @var array<int, string>
     */
    private array $permissions = [
        'login',
        'manage_user',
        'change_role',
        'create_content',
        'edit_any_content',
        'edit_own_content',
        'delete_content',
        'approve_content',
        'publish_content',
        'manage_category',
        'manage_tag',
        'manage_media',
        'upload_media',
        'view_analytics',
        'view_audit_log',
    ];

    /**
     * Role => permissions matrix (version-controlled source of truth).
     *
     * @var array<string, array<int, string>>
     */
    private array $roles = [
        'super_admin' => [
            'login',
            'manage_user',
            'change_role',
            'create_content',
            'edit_any_content',
            'edit_own_content',
            'delete_content',
            'approve_content',
            'publish_content',
            'manage_category',
            'manage_tag',
            'manage_media',
            'upload_media',
            'view_analytics',
            'view_audit_log',
        ],
        'admin' => [
            'login',
            'manage_user',
            'create_content',
            'edit_any_content',
            'edit_own_content',
            'delete_content',
            'publish_content',
            'manage_category',
            'manage_tag',
            'manage_media',
            'upload_media',
            'view_analytics',
            'view_audit_log',
        ],
        'editor' => [
            'login',
            'create_content',
            'edit_any_content',
            'edit_own_content',
            'approve_content',
            'publish_content',
            'manage_category',
            'manage_tag',
            'manage_media',
            'upload_media',
            'view_analytics',
            'view_audit_log',
        ],
        'author' => [
            'login',
            'create_content',
            'edit_own_content',
            'upload_media',
        ],
        'viewer' => [
            'login',
        ],
    ];

    public function run(): void
    {
        foreach ($this->permissions as $permission) {
            Permission::findOrCreate($permission);
        }

        foreach ($this->roles as $role => $permissions) {
            $role = Role::firstOrCreate(['name' => $role]);
            $role->syncPermissions($permissions);
        }
    }
}
