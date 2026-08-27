<?php

namespace App\Models;

use App\Enums\AiScheduleStatus;
use App\Enums\AiScheduleType;
use App\Enums\AiTone;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int|null $author_id
 * @property string $name
 * @property bool $is_active
 * @property AiScheduleType $type
 * @property AiTone $tone
 * @property string $topic_direction
 * @property string $language
 * @property string $publish_time
 * @property int|null $day_of_week
 * @property int $content_count
 * @property bool $auto_publish
 * @property AiScheduleStatus $status
 * @property Carbon|null $last_run_at
 * @property string|null $last_error
 */
class AiSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'author_id',
        'name',
        'is_active',
        'type',
        'tone',
        'topic_direction',
        'language',
        'publish_time',
        'day_of_week',
        'content_count',
        'auto_publish',
        'status',
        'last_run_at',
        'last_error',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'auto_publish' => 'boolean',
            'type' => AiScheduleType::class,
            'tone' => AiTone::class,
            'status' => AiScheduleStatus::class,
            'last_run_at' => 'datetime',
        ];
    }

    public function generatedContents(): HasMany
    {
        return $this->hasMany(AiGeneratedContent::class);
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }
}
