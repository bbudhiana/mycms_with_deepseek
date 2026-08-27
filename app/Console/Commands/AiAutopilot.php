<?php

namespace App\Console\Commands;

use App\Enums\AiScheduleType;
use App\Models\AiSchedule;
use App\Services\AiAutopilotService;
use Illuminate\Console\Command;

class AiAutopilot extends Command
{
    protected $signature = 'ai:autopilot';

    protected $description = 'Run all due, active AI content schedules.';

    public function handle(AiAutopilotService $autopilot): int
    {
        $now = now();
        $due = AiSchedule::query()
            ->where('is_active', true)
            ->where('status', '!=', 'running')
            ->get()
            ->filter(function (AiSchedule $schedule) use ($now) {
                [$hour, $minute] = explode(':', $schedule->publish_time);

                if ($schedule->type === AiScheduleType::Weekly && $now->dayOfWeekIso !== $schedule->day_of_week) {
                    return false;
                }

                return (int) $hour === $now->hour && (int) $minute === $now->minute;
            });

        $this->info("Found {$due->count()} due AI schedule(s).");

        foreach ($due as $schedule) {
            $this->line("  Running '{$schedule->name}'...");
            $autopilot->run($schedule);
            $this->line("    -> {$schedule->fresh()->status->value}".($schedule->fresh()->last_error ? " ({$schedule->fresh()->last_error})" : ''));
        }

        return self::SUCCESS;
    }
}
