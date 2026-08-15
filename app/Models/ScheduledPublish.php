<?php

namespace App\Models;

use App\Enums\ScheduledPublishStatus;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

/**
 * @property int $id
 * @property int $content_id
 * @property Carbon $scheduled_at
 * @property ScheduledPublishStatus $status
 * @property Carbon|null $processed_at
 * @property string|null $error_message
 */
class ScheduledPublish extends Model
{
    use HasFactory;

    protected $fillable = ['content_id', 'scheduled_at', 'status', 'processed_at', 'error_message'];

    protected function casts(): array
    {
        return [
            'scheduled_at' => 'datetime',
            'processed_at' => 'datetime',
            'status' => ScheduledPublishStatus::class,
        ];
    }

    public function content(): BelongsTo
    {
        return $this->belongsTo(Content::class);
    }
}
