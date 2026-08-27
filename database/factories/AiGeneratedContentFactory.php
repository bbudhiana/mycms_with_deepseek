<?php

namespace Database\Factories;

use App\Enums\AiGeneratedContentStatus;
use App\Models\AiGeneratedContent;
use App\Models\AiSchedule;
use App\Models\Content;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AiGeneratedContent>
 */
class AiGeneratedContentFactory extends Factory
{
    protected $model = AiGeneratedContent::class;

    public function definition(): array
    {
        return [
            'content_id' => Content::factory(),
            'ai_schedule_id' => AiSchedule::factory(),
            'status' => AiGeneratedContentStatus::Draft,
            'error_message' => null,
            'generated_at' => now(),
        ];
    }
}
