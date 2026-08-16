<?php

namespace App\Http\Resources;

use App\Models\Media;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Media
 */
class MediaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'filename' => $this->filename,
            'original_name' => $this->original_name,
            'path' => $this->path,
            'url' => $this->url,
            'thumbnail_url' => $this->thumbnail_url,
            'mime_type' => $this->mime_type,
            'size' => $this->size,
            'width' => $this->width,
            'height' => $this->height,
            'alt_text' => $this->alt_text,
            'is_image' => $this->isImage(),
            'uploaded_by' => $this->uploaded_by,
            'uploaded_at' => $this->created_at?->toISOString(),
        ];
    }
}
