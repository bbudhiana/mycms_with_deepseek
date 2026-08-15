<?php

namespace Database\Factories;

use App\Models\Media;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Media>
 */
class MediaFactory extends Factory
{
    protected $model = Media::class;

    public function definition(): array
    {
        return [
            'filename' => fake()->unique()->uuid().'.jpg',
            'original_name' => fake()->word().'.jpg',
            'path' => 'media/'.now()->format('Y/m').'/'.fake()->uuid().'.jpg',
            'mime_type' => 'image/jpeg',
            'size' => fake()->numberBetween(1000, 5000000),
            'alt_text' => fake()->sentence(),
            'uploaded_by' => User::factory(),
        ];
    }
}
