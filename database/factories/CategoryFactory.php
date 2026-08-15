<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Category>
 */
class CategoryFactory extends Factory
{
    protected $model = Category::class;

    public function definition(): array
    {
        return [
            'name' => ucfirst(fake()->word()),
            'slug' => fake()->unique()->slug(2),
            'description' => fake()->sentence(),
            'parent_id' => null,
        ];
    }
}
