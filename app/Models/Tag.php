<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

/**
 * @property int $id
 * @property string $name
 * @property string $slug
 */
class Tag extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'slug'];

    public $timestamps = true;

    protected function casts(): array
    {
        return [
            'contents_max_published_at' => 'datetime',
        ];
    }

    public function contents(): BelongsToMany
    {
        return $this->belongsToMany(Content::class, 'content_tags');
    }

    public function scopeSearch($query, ?string $search)
    {
        return $query->when($search, fn ($q) => $q->where('name', 'like', "%{$search}%"));
    }
}
