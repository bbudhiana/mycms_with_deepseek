<?php

use App\Enums\AiScheduleStatus;
use App\Enums\AiScheduleType;
use App\Models\AiSchedule;

it('lists schedules for super admin', function () {
    actingAsRole('super_admin');

    AiSchedule::factory()->create(['name' => 'Berita Pagi']);

    $this->get(route('ai.schedules'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('Ai/Schedules')
            ->where('schedules.0.name', 'Berita Pagi'));
});

it('forbids non-super-admin from managing schedules', function () {
    actingAsRole('editor');

    $this->get(route('ai.schedules'))->assertForbidden();
    $this->post(route('ai.schedules.store'), [])->assertForbidden();
});

it('creates a daily schedule', function () {
    actingAsRole('super_admin');

    $this->post(route('ai.schedules.store'), [
        'name' => 'Otomasi Teknologi',
        'is_active' => true,
        'type' => 'daily',
        'tone' => 'teknis',
        'topic_direction' => 'Tulis tentang tren teknologi terbaru di Indonesia',
        'language' => 'id',
        'publish_time' => '09:30',
        'content_count' => 2,
        'auto_publish' => true,
    ])->assertRedirect();

    $schedule = AiSchedule::first();
    expect($schedule)->not->toBeNull()
        ->and($schedule->type)->toBe(AiScheduleType::Daily)
        ->and($schedule->content_count)->toBe(2)
        ->and($schedule->auto_publish)->toBeTrue()
        ->and($schedule->status)->toBe(AiScheduleStatus::Idle)
        ->and($schedule->day_of_week)->toBeNull();
});

it('stores the selected author on a schedule', function () {
    actingAsRole('super_admin');

    $author = userWithRole('author');

    $this->post(route('ai.schedules.store'), [
        'name' => 'Jadwal Dengan Author',
        'author_id' => $author->id,
        'is_active' => true,
        'type' => 'daily',
        'tone' => 'editorial',
        'topic_direction' => 'Topik',
        'language' => 'id',
        'publish_time' => '08:00',
        'content_count' => 1,
        'auto_publish' => false,
    ])->assertRedirect();

    expect(AiSchedule::first()->author_id)->toBe($author->id);
});

it('creates a weekly schedule with a day of week', function () {
    actingAsRole('super_admin');

    $this->post(route('ai.schedules.store'), [
        'name' => 'Laporan Mingguan',
        'is_active' => true,
        'type' => 'weekly',
        'day_of_week' => 5,
        'tone' => 'editorial',
        'topic_direction' => 'Rangkuman ekonomi pekan ini',
        'language' => 'id',
        'publish_time' => '07:00',
        'content_count' => 1,
        'auto_publish' => false,
    ])->assertRedirect();

    expect(AiSchedule::first()->day_of_week)->toBe(5);
});

it('validates schedule fields', function () {
    actingAsRole('super_admin');

    $this->post(route('ai.schedules.store'), [
        'name' => '',
        'type' => 'weekly',
        'tone' => 'invalid',
        'publish_time' => 'not-a-time',
        'content_count' => 0,
    ])->assertSessionHasErrors(['name', 'day_of_week', 'tone', 'publish_time', 'content_count']);
});

it('updates a schedule', function () {
    actingAsRole('super_admin');

    $schedule = AiSchedule::factory()->create(['name' => 'Lama', 'content_count' => 1]);

    $this->patch(route('ai.schedules.update', $schedule), [
        'name' => 'Baru',
        'is_active' => false,
        'type' => 'daily',
        'tone' => 'santai',
        'topic_direction' => 'Arah baru',
        'language' => 'en',
        'publish_time' => '10:00',
        'content_count' => 3,
        'auto_publish' => false,
    ])->assertRedirect();

    $schedule->refresh();
    expect($schedule->name)->toBe('Baru')
        ->and($schedule->is_active)->toBeFalse()
        ->and($schedule->language)->toBe('en');
});

it('deletes a schedule', function () {
    actingAsRole('super_admin');

    $schedule = AiSchedule::factory()->create();

    $this->delete(route('ai.schedules.destroy', $schedule))->assertRedirect();

    expect(AiSchedule::count())->toBe(0);
});
