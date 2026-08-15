<?php

namespace Database\Factories;

use App\Enums\ScheduledPublishStatus;
use App\Models\Content;
use App\Models\ScheduledPublish;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<ScheduledPublish>
 */
class ScheduledPublishFactory extends Factory
{
    protected $model = ScheduledPublish::class;

    public function definition(): array
    {
        return [
            'content_id' => Content::factory(),
            'scheduled_at' => now()->addHour(),
            'status' => ScheduledPublishStatus::Pending,
            'processed_at' => null,
            'error_message' => null,
        ];
    }
}
