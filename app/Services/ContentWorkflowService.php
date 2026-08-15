<?php

namespace App\Services;

use App\Enums\ContentApprovalAction;
use App\Enums\ContentStatus;
use App\Models\Content;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ContentWorkflowService
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function submit(Content $content, User $user): Content
    {
        return DB::transaction(function () use ($content, $user) {
            $this->assert($content, ContentStatus::Draft, 'Only draft content can be submitted for review.');
            $this->assertOwned($content, $user);

            $content->update(['status' => ContentStatus::Review]);

            $this->recordApproval($content, $user, ContentApprovalAction::Submitted);
            $this->activityLog->log('content.submitted', $content, "Mengirim '{$content->title}' untuk review.");

            return $content->fresh();
        });
    }

    public function approve(Content $content, User $user): Content
    {
        return DB::transaction(function () use ($content, $user) {
            $this->assert($content, ContentStatus::Review, 'Only content in review can be approved.');
            $this->assertNotOwned($content, $user);

            $content->update([
                'status' => ContentStatus::Approved,
                'reviewer_id' => $user->id,
                'reviewed_at' => now(),
            ]);

            $this->recordApproval($content, $user, ContentApprovalAction::Approved, 'Disetujui untuk publikasi.');
            $this->activityLog->log('content.approved', $content, "Menyetujui '{$content->title}'.");

            return $content->fresh();
        });
    }

    public function reject(Content $content, User $user, ?string $notes = null): Content
    {
        return DB::transaction(function () use ($content, $user, $notes) {
            $this->assert($content, ContentStatus::Review, 'Only content in review can be rejected.');
            $this->assertNotOwned($content, $user);

            $content->update([
                'status' => ContentStatus::Draft,
                'reviewer_id' => null,
                'reviewed_at' => null,
            ]);

            $this->recordApproval($content, $user, ContentApprovalAction::Rejected, $notes);
            $this->activityLog->log('content.rejected', $content, "Menolak '{$content->title}'.".($notes ? " Catatan: {$notes}" : ''));

            return $content->fresh();
        });
    }

    public function requestChanges(Content $content, User $user, string $notes): Content
    {
        return DB::transaction(function () use ($content, $user, $notes) {
            $this->assert($content, ContentStatus::Review, 'Only content in review can be sent back for changes.');
            $this->assertNotOwned($content, $user);

            $content->update([
                'status' => ContentStatus::Draft,
                'reviewer_id' => null,
                'reviewed_at' => null,
            ]);

            $this->recordApproval($content, $user, ContentApprovalAction::RequestChanges, $notes);
            $this->activityLog->log('content.request_changes', $content, "Meminta revisi pada '{$content->title}'. Catatan: {$notes}");

            return $content->fresh();
        });
    }

    private function recordApproval(Content $content, User $user, ContentApprovalAction $action, ?string $notes = null): void
    {
        $content->approvals()->create([
            'reviewer_id' => $user->id,
            'action' => $action,
            'notes' => $notes,
        ]);
    }

    private function assert(Content $content, ContentStatus $expected, string $message): void
    {
        if ($content->status !== $expected) {
            throw new RuntimeException($message);
        }
    }

    private function assertOwned(Content $content, User $user): void
    {
        if ($content->author_id !== $user->id) {
            throw new RuntimeException('You can only submit your own content.');
        }
    }

    private function assertNotOwned(Content $content, User $user): void
    {
        if ($content->author_id === $user->id) {
            throw new RuntimeException('A reviewer cannot approve their own content.');
        }
    }
}
