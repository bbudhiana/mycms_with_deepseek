<?php

use App\Enums\AiGeneratedContentStatus;
use App\Models\AiGeneratedContent;
use App\Models\AiSchedule;
use App\Models\Content;

it('renders the history page with stats for super admin', function () {
    actingAsRole('super_admin');

    $content = Content::factory()->create(['title' => 'Draft Autopilot']);
    $schedule = AiSchedule::factory()->create(['name' => 'Berita Pagi']);

    AiGeneratedContent::factory()->create([
        'content_id' => $content->id,
        'ai_schedule_id' => $schedule->id,
        'status' => AiGeneratedContentStatus::Draft,
        'generated_at' => now()->subHour(),
    ]);

    AiGeneratedContent::factory()->create([
        'status' => AiGeneratedContentStatus::Failed,
        'error_message' => 'Provider error',
        'generated_at' => now()->subHours(2),
    ]);

    $this->get(route('ai.history'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Ai/History')
            ->where('stats.total', 2)
            ->where('stats.perStatus.draft', 1)
            ->where('stats.perStatus.failed', 1)
            ->where('history.data.0.content.title', 'Draft Autopilot'));
});

it('forbids non-super-admin from viewing history', function () {
    actingAsRole('author');

    $this->get(route('ai.history'))->assertForbidden();
});

it('filters history by status', function () {
    actingAsRole('super_admin');

    AiGeneratedContent::factory()->create(['status' => AiGeneratedContentStatus::Draft]);
    AiGeneratedContent::factory()->create(['status' => AiGeneratedContentStatus::Published]);

    $this->get(route('ai.history', ['status' => 'published']))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->where('history.total', 1)
            ->where('history.data.0.status', 'published'));
});
