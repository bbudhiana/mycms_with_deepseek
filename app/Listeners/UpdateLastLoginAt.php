<?php

namespace App\Listeners;

use App\Models\User;
use Illuminate\Auth\Events\Login;
use Illuminate\Support\Facades\Date;

class UpdateLastLoginAt
{
    public function handle(Login $event): void
    {
        if (! $event->user instanceof User) {
            return;
        }

        $user = $event->user;

        if ($user->last_login_at?->equalTo(Date::now())) {
            return;
        }

        $user->update(['last_login_at' => Date::now()]);
    }
}
