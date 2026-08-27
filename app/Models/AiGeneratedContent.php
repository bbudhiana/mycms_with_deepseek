<?php

namespace App\Models;

use App\Enums\AiGeneratedContentStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $content_id
 * @property int $ai_schedule_id
 * @property AiGeneratedContentStatus $status
 * @property string|null $error_message
 * @property Carbon|null $generated_at
 */
class AiGeneratedContent extends Model
{
    use HasFactory;

    protected $fillable = [
        'content_id',
        'ai_schedule_id',
        'status',
        'error_message',
        'generated_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => AiGeneratedContentStatus::class,
            'generated_at' => 'datetime',
        ];
    }

    public function content(): BelongsTo
    {
        return $this->belongsTo(Content::class);
    }

    public function schedule(): BelongsTo
    {
        return $this->belongsTo(AiSchedule::class, 'ai_schedule_id');
    }
}
