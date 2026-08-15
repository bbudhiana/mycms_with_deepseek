<?php

use App\Enums\ContentStatus;
use App\Enums\ScheduledPublishStatus;
use App\Models\Content;
use App\Models\ScheduledPublish;

it('publishes approved content immediately', function () {
    $editor = userWithRole('editor');
    $content = Content::factory()->approved()->create();

    $this->actingAs($editor)
        ->post('/contents/'.$content->id.'/publish')
        ->assertRedirect();

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Published);
    expect($content->published_at)->not->toBeNull();
});

it('rejects publishing content that is not approved', function () {
    $editor = userWithRole('editor');
    $content = Content::factory()->draft()->create();

    $this->actingAs($editor)
        ->post('/contents/'.$content->id.'/publish')
        ->assertForbidden();

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Draft);
});

it('schedules publication for approved content', function () {
    $editor = userWithRole('editor');
    $content = Content::factory()->approved()->create();

    $this->actingAs($editor)
        ->post('/contents/'.$content->id.'/schedule', [
            'scheduled_at' => now()->addHours(3)->toDateTimeLocalString(),
        ])->assertRedirect();

    expect(ScheduledPublish::where('content_id', $content->id)
        ->where('status', ScheduledPublishStatus::Pending)
        ->exists())->toBeTrue();
});

it('cancels a pending schedule', function () {
    $editor = userWithRole('editor');
    $content = Content::factory()->approved()->create();

    ScheduledPublish::create([
        'content_id' => $content->id,
        'scheduled_at' => now()->addHours(3),
        'status' => ScheduledPublishStatus::Pending,
    ]);

    $this->actingAs($editor)
        ->post('/contents/'.$content->id.'/cancel-schedule')
        ->assertRedirect();

    expect(ScheduledPublish::where('content_id', $content->id)
        ->where('status', ScheduledPublishStatus::Cancelled)
        ->exists())->toBeTrue();
});

it('unpublishes published content back to draft', function () {
    $editor = userWithRole('editor');
    $content = Content::factory()->published()->create();

    $this->actingAs($editor)
        ->post('/contents/'.$content->id.'/unpublish')
        ->assertRedirect();

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Draft);
});

it('archives published content', function () {
    $editor = userWithRole('editor');
    $content = Content::factory()->published()->create();

    $this->actingAs($editor)
        ->post('/contents/'.$content->id.'/archive')
        ->assertRedirect();

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Archived);
});

it('blocks an author from publishing', function () {
    $author = userWithRole('author');
    $content = Content::factory()->approved()->create();

    $this->actingAs($author)
        ->post('/contents/'.$content->id.'/publish')
        ->assertForbidden();

    $content->refresh();
    expect($content->status)->toBe(ContentStatus::Approved);
});
