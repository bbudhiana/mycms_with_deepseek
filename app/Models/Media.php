<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

/**
 * @property int $id
 * @property string $filename
 * @property string $original_name
 * @property string $path
 * @property string|null $mime_type
 * @property int $size
 * @property string|null $alt_text
 * @property int|null $uploaded_by
 */
class Media extends Model
{
    use HasFactory;

    protected $fillable = [
        'filename',
        'original_name',
        'path',
        'mime_type',
        'size',
        'alt_text',
        'uploaded_by',
    ];

    protected $appends = ['url'];

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }

    public function getUrlAttribute(): string
    {
        return asset('storage/'.$this->path);
    }

    public function deleteFromDisk(): bool
    {
        try {
            return Storage::disk('public')->delete($this->path);
        } catch (\Throwable) {
            return false;
        }
    }

    public function isImage(): bool
    {
        return $this->mime_type !== null && str_starts_with($this->mime_type, 'image/');
    }

    public function scopeSearch($query, ?string $search)
    {
        return $query->when($search, fn ($q) => $q->where('original_name', 'like', "%{$search}%"));
    }
}
