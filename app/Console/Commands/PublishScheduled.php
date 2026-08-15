<?php

namespace App\Console\Commands;

use App\Models\ScheduledPublish;
use App\Services\ContentPublishService;
use Illuminate\Console\Command;

class PublishScheduled extends Command
{
    protected $signature = 'publish:scheduled';

    protected $description = 'Publish all scheduled publishes that are due.';

    public function handle(ContentPublishService $publishService): int
    {
        $due = ScheduledPublish::query()
            ->with('content')
            ->where('status', 'pending')
            ->where('scheduled_at', '<=', now())
            ->get();

        $this->info("Found {$due->count()} due scheduled publish(es).");

        foreach ($due as $schedule) {
            $result = $publishService->processScheduledPublish($schedule);

            $this->line("  [{$schedule->content_id}] {$result->status->value}".($result->error_message ? " - {$result->error_message}" : ''));
        }

        return self::SUCCESS;
    }
}
