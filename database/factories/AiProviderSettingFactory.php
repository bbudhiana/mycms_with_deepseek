<?php

namespace Database\Factories;

use App\Models\AiProviderSetting;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<AiProviderSetting>
 */
class AiProviderSettingFactory extends Factory
{
    protected $model = AiProviderSetting::class;

    public function definition(): array
    {
        return [
            'base_url' => 'https://api.openai.com/v1',
            'api_key' => null,
            'model' => 'gpt-4o-mini',
            'provider' => 'openai-compatible',
            'temperature' => 0.7,
            'max_tokens' => 8192,
            'image_endpoint_url' => null,
            'image_enabled' => false,
            'image_provider' => 'custom',
            'image_api_key' => null,
        ];
    }
}
