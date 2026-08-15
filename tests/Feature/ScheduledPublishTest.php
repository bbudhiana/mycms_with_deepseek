<?php

use App\Enums\ContentStatus;
use App\Enums\ScheduledPublishStatus;
use App\Models\Content;
use App\Models\ScheduledPublish;

it('publishes due scheduled content through the command', function () {
    $content = Content::factory()->approved()->create();

    $schedule = ScheduledPublish::factory()->create([
        'content_id' => $content->id,
        'scheduled_at' => now()->subMinute(),
        'status' => ScheduledPublishStatus::Pending,
    ]);

    $this->artisan('publish:scheduled')->assertSuccessful();

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Published);

    $schedule->refresh();
    expect($schedule->status)->toBe(ScheduledPublishStatus::Processed);
    expect($schedule->processed_at)->not->toBeNull();
});

it('marks a schedule failed when content is no longer approved', function () {
    $content = Content::factory()->draft()->create();

    $schedule = ScheduledPublish::factory()->create([
        'content_id' => $content->id,
        'scheduled_at' => now()->subMinute(),
        'status' => ScheduledPublishStatus::Pending,
    ]);

    $this->artisan('publish:scheduled')->assertSuccessful();

    $schedule->refresh();
    expect($schedule->status)->toBe(ScheduledPublishStatus::Failed);
    expect($schedule->error_message)->not->toBeNull();

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Draft);
});

it('skips schedules that are not due yet', function () {
    $content = Content::factory()->approved()->create();

    $future = ScheduledPublish::factory()->create([
        'content_id' => $content->id,
        'scheduled_at' => now()->addHour(),
        'status' => ScheduledPublishStatus::Pending,
    ]);

    $this->artisan('publish:scheduled')->assertSuccessful();

    expect($future->fresh()->status)->toBe(ScheduledPublishStatus::Pending);
    expect($content->fresh()->status)->toBe(ContentStatus::Approved);
});
