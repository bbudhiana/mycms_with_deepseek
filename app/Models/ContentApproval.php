<?php

namespace App\Models;

use App\Enums\ContentApprovalAction;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $content_id
 * @property int|null $reviewer_id
 * @property ContentApprovalAction $action
 * @property string|null $notes
 */
class ContentApproval extends Model
{
    protected $fillable = ['content_id', 'reviewer_id', 'action', 'notes'];

    protected function casts(): array
    {
        return [
            'action' => ContentApprovalAction::class,
        ];
    }

    public function content(): BelongsTo
    {
        return $this->belongsTo(Content::class);
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }
}
