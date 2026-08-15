<?php

namespace App\Models;

use App\Enums\ContentStatus;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property string $title
 * @property string|null $sub_title
 * @property string $slug
 * @property string|null $excerpt
 * @property string $body
 * @property string|null $featured_video
 * @property bool $breaking_news_flag
 * @property bool $editor_pick_flag
 * @property int|null $featured_image_id
 * @property int|null $thumbnail_id
 * @property int|null $category_id
 * @property ContentStatus $status
 * @property int|null $author_id
 * @property int|null $reviewer_id
 */
class Content extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'sub_title',
        'slug',
        'excerpt',
        'body',
        'featured_video',
        'breaking_news_flag',
        'editor_pick_flag',
        'featured_image_id',
        'image_caption',
        'image_credit',
        'thumbnail_id',
        'category_id',
        'status',
        'author_id',
        'reviewer_id',
        'reviewed_at',
        'published_at',
    ];

    protected function casts(): array
    {
        return [
            'status' => ContentStatus::class,
            'breaking_news_flag' => 'boolean',
            'editor_pick_flag' => 'boolean',
            'reviewed_at' => 'datetime',
            'published_at' => 'datetime',
        ];
    }

    public function author(): BelongsTo
    {
        return $this->belongsTo(User::class, 'author_id');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewer_id');
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(Tag::class, 'content_tags');
    }

    public function featuredImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'featured_image_id');
    }

    public function thumbnail(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'thumbnail_id');
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(ContentApproval::class)->latest();
    }

    public function scheduledPublishes(): HasMany
    {
        return $this->hasMany(ScheduledPublish::class)->latest();
    }

    public function pendingSchedule(): HasMany
    {
        return $this->scheduledPublishes()->where('status', 'pending');
    }

    public function statusLabel(): Attribute
    {
        return Attribute::get(fn (): string => $this->status->label());
    }
}
