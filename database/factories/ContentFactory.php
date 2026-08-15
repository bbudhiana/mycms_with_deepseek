<?php

namespace Database\Factories;

use App\Enums\ContentStatus;
use App\Models\Category;
use App\Models\Content;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Content>
 */
class ContentFactory extends Factory
{
    protected $model = Content::class;

    public function definition(): array
    {
        return [
            'title' => fake()->sentence(6),
            'sub_title' => fake()->sentence(4),
            'slug' => fake()->unique()->slug(6),
            'excerpt' => fake()->paragraph(),
            'body' => fake()->paragraphs(4, true),
            'featured_video' => null,
            'breaking_news_flag' => false,
            'editor_pick_flag' => false,
            'image_caption' => fake()->sentence(),
            'image_credit' => fake()->name(),
            'category_id' => Category::factory(),
            'status' => ContentStatus::Draft,
            'author_id' => User::factory(),
            'reviewed_at' => null,
            'published_at' => null,
        ];
    }

    public function as(ContentStatus $status): static
    {
        return $this->state(fn () => ['status' => $status]);
    }

    public function draft(): static
    {
        return $this->as(ContentStatus::Draft);
    }

    public function review(): static
    {
        return $this->as(ContentStatus::Review);
    }

    public function approved(): static
    {
        return $this->state(fn () => [
            'status' => ContentStatus::Approved,
            'reviewer_id' => User::factory(),
            'reviewed_at' => now(),
        ]);
    }

    public function published(): static
    {
        return $this->state(fn () => [
            'status' => ContentStatus::Published,
            'reviewer_id' => User::factory(),
            'reviewed_at' => now(),
            'published_at' => now(),
        ]);
    }
}
