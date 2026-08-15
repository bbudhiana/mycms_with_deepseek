<?php

namespace App\Policies;

use App\Enums\ContentStatus;
use App\Models\Content;
use App\Models\User;

class ContentPolicy
{
    public function viewAny(User $user): bool
    {
        return true;
    }

    public function view(User $user, Content $content): bool
    {
        if ($content->author_id === $user->id) {
            return true;
        }

        return $user->hasAnyPermission([
            'edit_any_content',
            'approve_content',
            'publish_content',
            'view_audit_log',
        ]);
    }

    public function create(User $user): bool
    {
        return $user->hasPermissionTo('create_content');
    }

    public function edit(User $user, Content $content): bool
    {
        if ($content->status !== ContentStatus::Draft) {
            return false;
        }

        if ($user->hasPermissionTo('edit_any_content')) {
            return true;
        }

        return $content->author_id === $user->id && $user->hasPermissionTo('edit_own_content');
    }

    public function delete(User $user, Content $content): bool
    {
        if ($content->status === ContentStatus::Published || $content->status === ContentStatus::Approved) {
            return false;
        }

        return $user->hasPermissionTo('delete_content');
    }

    public function submit(User $user, Content $content): bool
    {
        return $content->status === ContentStatus::Draft
            && $content->author_id === $user->id
            && $user->hasPermissionTo('edit_own_content');
    }

    public function approve(User $user, Content $content): bool
    {
        if ($content->author_id === $user->id || $content->status !== ContentStatus::Review) {
            return false;
        }

        return $user->hasPermissionTo('approve_content');
    }

    public function publish(User $user, Content $content): bool
    {
        return $content->status === ContentStatus::Approved
            && $user->hasPermissionTo('publish_content');
    }

    public function unpublish(User $user, Content $content): bool
    {
        return $content->status === ContentStatus::Published
            && $user->hasPermissionTo('publish_content');
    }

    public function archive(User $user, Content $content): bool
    {
        return $content->status === ContentStatus::Published
            && $user->hasPermissionTo('publish_content');
    }
}
