<?php

use App\Models\ActivityLog;
use App\Models\Role;
use Inertia\Testing\AssertableInertia as Assert;

it('lets an admin view the roles page with grouped permissions and stats', function () {
    actingAsRole('admin');

    $this->get('/roles')->assertOk()->assertInertia(fn (Assert $page) => $page
        ->component('Roles/Index')
        ->has('roles', 5)
        ->has('permissions', 15)
        ->has('permissionGroups', 5)
        ->where('permissionGroups.0', 'Akses')
        ->where('permissionGroups.4', 'Akses & Audit')
        ->where('permissions.0.label', 'Menyetujui konten')
        ->where('permissions.0.group', 'Konten')
        ->has('stats')
        ->where('stats.totalRoles', 5)
        ->where('stats.totalPermissions', 15)
    );
});

it('marks the super_admin role as protected and flags critical permissions', function () {
    actingAsRole('admin');

    $this->get('/roles')->assertInertia(fn (Assert $page) => $page
        ->where('roles.0.protected', false)
        ->where('roles.3.protected', true)
        ->where('roles.3.name', 'super_admin')
        ->where('permissions.6.name', 'login')
        ->where('permissions.6.critical', false)
        ->where('permissions.10.name', 'manage_user')
        ->where('permissions.10.critical', true)
    );
});

it('forbids an author from accessing the roles page', function () {
    actingAsRole('author');

    $this->get('/roles')->assertForbidden();
});

it('lets a super admin create a role with permissions', function () {
    actingAsRole('super_admin');

    $this->post('/roles', [
        'name' => 'Reporter',
        'permissions' => ['login', 'create_content', 'edit_own_content'],
    ])->assertRedirect()->assertSessionHas('inertia.flash_data.success');

    $role = Role::where('name', 'reporter')->first();
    expect($role)->not->toBeNull();
    expect($role->hasPermissionTo('create_content'))->toBeTrue();
    expect($role->hasPermissionTo('publish_content'))->toBeFalse();

    expect(ActivityLog::where('action', 'role.created')->where('entity_id', $role->id)->exists())->toBeTrue();
});

it('requires a unique role name', function () {
    actingAsRole('super_admin');

    $this->post('/roles', [
        'name' => 'editor',
        'permissions' => ['login'],
    ])->assertSessionHasErrors('name');
});

it('rejects unknown permissions when creating a role', function () {
    actingAsRole('super_admin');

    $this->post('/roles', [
        'name' => 'Reporter',
        'permissions' => ['login', 'tidak-ada'],
    ])->assertSessionHasErrors('permissions.1');
});

it('lets a super admin update a role name and sync its permissions', function () {
    actingAsRole('super_admin');

    $role = Role::create(['name' => 'intern']);
    $role->syncPermissions(['login', 'create_content', 'edit_own_content']);

    $this->patch('/roles/'.$role->id, [
        'name' => 'Intern Senior',
        'permissions' => ['login', 'upload_media'],
    ])->assertRedirect();

    $role->refresh();
    expect($role->name)->toBe('intern senior');
    expect($role->hasPermissionTo('create_content'))->toBeFalse();
    expect($role->hasPermissionTo('upload_media'))->toBeTrue();
});

it('forbids a non-super-admin from editing the super_admin role', function () {
    actingAsRole('admin');

    $superAdmin = Role::where('name', 'super_admin')->first();

    $this->patch('/roles/'.$superAdmin->id, [
        'name' => 'super_admin',
        'permissions' => ['login'],
    ])->assertForbidden();
});

it('protects the super_admin role from editing even by a super admin', function () {
    actingAsRole('super_admin');

    $superAdmin = Role::where('name', 'super_admin')->first();

    $this->patch('/roles/'.$superAdmin->id, [
        'name' => 'super_admin',
        'permissions' => ['login'],
    ])->assertForbidden();

    expect($superAdmin->fresh()->hasPermissionTo('manage_user'))->toBeTrue();
});

it('forbids an admin without change_role permission from creating a role', function () {
    actingAsRole('admin');

    $this->post('/roles', [
        'name' => 'Reporter',
        'permissions' => ['login'],
    ])->assertForbidden();
});

it('forbids deleting a role that is still in use', function () {
    userWithRole('author');
    actingAsRole('super_admin');

    $authorRole = Role::where('name', 'author')->first();
    expect($authorRole->users()->count())->toBeGreaterThan(0);

    $this->delete('/roles/'.$authorRole->id)->assertForbidden();
    expect(Role::find($authorRole->id))->not->toBeNull();
});

it('forbids deleting the super_admin role', function () {
    actingAsRole('super_admin');

    $superAdmin = Role::where('name', 'super_admin')->first();

    $this->delete('/roles/'.$superAdmin->id)->assertForbidden();
    expect(Role::find($superAdmin->id))->not->toBeNull();
});

it('lets a super admin delete an unused role and logs the deletion', function () {
    actingAsRole('super_admin');

    $role = Role::create(['name' => 'ghost']);

    $this->delete('/roles/'.$role->id)->assertRedirect()->assertSessionHas('inertia.flash_data.success');

    expect(Role::find($role->id))->toBeNull();
    expect(ActivityLog::where('action', 'role.deleted')->exists())->toBeTrue();
});

it('keeps login as the default permission when creating a minimal role', function () {
    actingAsRole('super_admin');

    $this->post('/roles', [
        'name' => 'pembaca',
        'permissions' => ['login'],
    ])->assertRedirect();

    $role = Role::where('name', 'pembaca')->first();
    expect($role->hasPermissionTo('login'))->toBeTrue();
});
