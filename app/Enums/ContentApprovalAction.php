<?php

namespace App\Enums;

enum ContentApprovalAction: string
{
    case Submitted = 'submitted';
    case Approved = 'approved';
    case Rejected = 'rejected';
    case RequestChanges = 'request_changes';
    case Published = 'published';
    case Unpublished = 'unpublished';
    case Archived = 'archived';
    case Resubmitted = 'resubmitted';

    public function label(): string
    {
        return match ($this) {
            self::Submitted => 'Submitted',
            self::Approved => 'Approved',
            self::Rejected => 'Rejected',
            self::RequestChanges => 'Changes Requested',
            self::Published => 'Published',
            self::Unpublished => 'Unpublished',
            self::Archived => 'Archived',
            self::Resubmitted => 'Resubmitted',
        };
    }
}
