<?php

namespace App\Http\Resources;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin User
 */
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'job_title' => $this->job_title,
            'bio' => $this->bio,
            'is_active' => $this->is_active,
            'profile_photo_url' => $this->profile_photo_path ? asset('storage/'.$this->profile_photo_path) : null,
            'email_verified_at' => $this->email_verified_at?->toISOString(),
            'roles' => $this->when($this->relationLoaded('roles'), $this->getRoleNames()),
        ];
    }
}
