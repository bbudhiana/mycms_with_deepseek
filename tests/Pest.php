<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

pest()->extend(TestCase::class)
    ->use(RefreshDatabase::class)
    ->in('Feature', 'Unit');

beforeEach(function () {
    // Ensure the RBAC matrix exists for every test that touches authorization.
    if ($this instanceof Illuminate\Foundation\Testing\TestCase) {
        $this->seed(RolePermissionSeeder::class);
    }
})->in('Feature');

/*
|--------------------------------------------------------------------------
| Helpers
|--------------------------------------------------------------------------
*/

/**
 * Create an (verified, active) user assigned to a single role.
 */
function userWithRole(string $role, array $attributes = []): User
{
    test()->seed(RolePermissionSeeder::class);

    $user = User::factory()->create(array_merge([
        'email_verified_at' => now(),
        'is_active' => true,
    ], $attributes));

    $user->assignRole($role);

    return $user;
}

/**
 * Create an authenticated (verified, active) user assigned to a single role.
 */
function actingAsRole(string $role, array $attributes = [])
{
    $user = userWithRole($role, $attributes);

    return test()->actingAs($user);
}
