<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            ['name' => 'Super Admin', 'email' => 'superadmin@mynews.test', 'role' => 'super_admin', 'password' => 'password'],
            ['name' => 'Admin', 'email' => 'admin@mynews.test', 'role' => 'admin', 'password' => 'password'],
            ['name' => 'Andi F Nora', 'email' => 'editor@mynews.test', 'role' => 'editor', 'password' => 'password'],
            ['name' => 'Dian Castro', 'email' => 'author@mynews.test', 'role' => 'author', 'password' => 'password'],
            ['name' => 'Viewer', 'email' => 'viewer@mynews.test', 'role' => 'viewer', 'password' => 'password'],
        ];

        foreach ($users as $data) {
            $role = $data['role'];
            unset($data['role']);

            $user = User::firstOrCreate(
                ['email' => $data['email']],
                array_merge($data, [
                    'email_verified_at' => now(),
                    'job_title' => ucfirst(str_replace('_', ' ', $role)),
                    'bio' => "Demo {$role} account.",
                    'is_active' => true,
                ])
            );

            $user->syncRoles([$role]);
        }
    }
}
