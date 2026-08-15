<?php

namespace App\Services;

use App\Enums\ContentApprovalAction;
use App\Enums\ContentStatus;
use App\Enums\ScheduledPublishStatus;
use App\Models\Content;
use App\Models\ScheduledPublish;
use App\Models\User;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
use RuntimeException;

class ContentPublishService
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function publishNow(Content $content, User $user): Content
    {
        return DB::transaction(function () use ($content, $user) {
            $this->assert($content, ContentStatus::Approved, 'Only approved content can be published.');

            $content->update([
                'status' => ContentStatus::Published,
                'reviewer_id' => $content->reviewer_id ?? $user->id,
                'reviewed_at' => $content->reviewed_at ?? now(),
                'published_at' => now(),
            ]);

            $this->recordApproval($content, $user, ContentApprovalAction::Published);
            $this->activityLog->log('content.published', $content, "Mempublikasikan '{$content->title}'.");

            return $content->fresh();
        });
    }

    public function schedule(Content $content, User $user, Carbon $scheduledAt): ScheduledPublish
    {
        return DB::transaction(function () use ($content, $scheduledAt) {
            $this->assert($content, ContentStatus::Approved, 'Only approved content can be scheduled.');
            if ($content->pendingSchedule()->exists()) {
                throw new RuntimeException('This content already has a pending schedule.');
            }

            /** @var ScheduledPublish $schedule */
            $schedule = $content->scheduledPublishes()->create([
                'scheduled_at' => $scheduledAt,
                'status' => ScheduledPublishStatus::Pending,
            ]);

            $this->activityLog->log('content.scheduled', $content, "Menjadwalkan '{$content->title}' untuk ".$scheduledAt->toDateTimeString().'.');

            return $schedule;
        });
    }

    public function cancelSchedule(Content $content, User $user): void
    {
        DB::transaction(function () use ($content) {
            $pending = $content->pendingSchedule()->where('scheduled_at', '>', now())->get();

            if ($pending->isEmpty()) {
                throw new RuntimeException('No pending scheduled publish to cancel.');
            }

            foreach ($pending as $schedule) {
                $schedule->update(['status' => ScheduledPublishStatus::Cancelled]);
            }

            $this->activityLog->log('content.schedule_cancelled', $content, "Membatalkan jadwal publikasi '{$content->title}'.");
        });
    }

    public function unpublish(Content $content, User $user): Content
    {
        return DB::transaction(function () use ($content, $user) {
            $this->assert($content, ContentStatus::Published, 'Only published content can be unpublished.');

            $content->update([
                'status' => ContentStatus::Draft,
                'published_at' => null,
            ]);

            $this->recordApproval($content, $user, ContentApprovalAction::Unpublished);
            $this->activityLog->log('content.unpublished', $content, "Menarik publikasi '{$content->title}'.");

            return $content->fresh();
        });
    }

    public function archive(Content $content, User $user): Content
    {
        return DB::transaction(function () use ($content, $user) {
            $this->assert($content, ContentStatus::Published, 'Only published content can be archived.');

            $content->update(['status' => ContentStatus::Archived]);

            $this->recordApproval($content, $user, ContentApprovalAction::Archived);
            $this->activityLog->log('content.archived', $content, "Mengarsipkan '{$content->title}'.");

            return $content->fresh();
        });
    }

    public function processScheduledPublish(ScheduledPublish $schedule): ScheduledPublish
    {
        $content = $schedule->content;

        if (! $content) {
            return $this->failSchedule($schedule, 'Content record no longer exists.');
        }

        if ($content->status !== ContentStatus::Approved) {
            return $this->failSchedule($schedule, 'Content is no longer approved (status: '.$content->status->value.').');
        }

        $content->update([
            'status' => ContentStatus::Published,
            'published_at' => $content->published_at ?? now(),
        ]);

        $schedule->update([
            'status' => ScheduledPublishStatus::Processed,
            'processed_at' => now(),
            'error_message' => null,
        ]);

        ActivityLogService::logStatic('content.scheduled_published', $content, "Konten terjadwal '{$content->title}' berhasil dipublikasikan.");

        return $schedule->fresh();
    }

    private function failSchedule(ScheduledPublish $schedule, string $reason): ScheduledPublish
    {
        $schedule->update([
            'status' => ScheduledPublishStatus::Failed,
            'processed_at' => now(),
            'error_message' => $reason,
        ]);

        return $schedule->fresh();
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
}
