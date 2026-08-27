<?php

namespace Database\Factories;

use App\Enums\AiScheduleStatus;
use App\Enums\AiScheduleType;
use App\Enums\AiTone;
use App\Models\AiSchedule;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AiSchedule>
 */
class AiScheduleFactory extends Factory
{
    protected $model = AiSchedule::class;

    public function definition(): array
    {
        return [
            'author_id' => null,
            'name' => fake()->words(3, true),
            'is_active' => true,
            'type' => AiScheduleType::Daily,
            'tone' => AiTone::Editorial,
            'topic_direction' => fake()->sentence(),
            'category_id' => null,
            'tags' => [],
            'language' => 'id',
            'publish_time' => '08:00',
            'day_of_week' => null,
            'content_count' => 1,
            'auto_publish' => false,
            'status' => AiScheduleStatus::Idle,
            'last_run_at' => null,
            'last_error' => null,
        ];
    }
}
