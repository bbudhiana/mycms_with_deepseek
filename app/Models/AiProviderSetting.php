<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * @property int $id
 * @property string $base_url
 * @property string|null $api_key
 * @property string $model
 * @property string $provider
 * @property float $temperature
 * @property int $max_tokens
 * @property string|null $image_endpoint_url
 * @property bool $image_enabled
 * @property string $image_provider
 * @property string|null $image_api_key
 */
class AiProviderSetting extends Model
{
    use HasFactory;

    protected $fillable = [
        'base_url',
        'api_key',
        'model',
        'provider',
        'temperature',
        'max_tokens',
        'image_enabled',
        'image_provider',
        'image_api_key',
        'image_endpoint_url',
    ];

    protected function casts(): array
    {
        return [
            'api_key' => 'encrypted',
            'image_api_key' => 'encrypted',
            'temperature' => 'float',
            'max_tokens' => 'integer',
            'image_enabled' => 'boolean',
        ];
    }

    public static function current(): ?self
    {
        return static::query()->latest('id')->first();
    }
}
