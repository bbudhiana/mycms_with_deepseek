<?php

namespace App\Http\Resources;

use App\Models\Content;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin Content
 */
class ContentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'sub_title' => $this->sub_title,
            'slug' => $this->slug,
            'excerpt' => $this->excerpt,
            'body' => $this->when($request->routeIs('*show*') || $request->has('include_body'), $this->body),
            'featured_video' => $this->featured_video,
            'breaking_news_flag' => $this->breaking_news_flag,
            'editor_pick_flag' => $this->editor_pick_flag,
            'image_caption' => $this->image_caption,
            'image_credit' => $this->image_credit,
            'status' => $this->status->value,
            'status_label' => $this->status->label(),
            'author_id' => $this->author_id,
            'reviewer_id' => $this->reviewer_id,
            'reviewed_at' => $this->reviewed_at?->toISOString(),
            'published_at' => $this->published_at?->toISOString(),
            'featured_image' => $this->whenLoaded('featuredImage', fn () => new MediaResource($this->featuredImage)),
            'thumbnail' => $this->whenLoaded('thumbnail', fn () => new MediaResource($this->thumbnail)),
            'category' => $this->whenLoaded('category', fn () => new CategoryResource($this->category)),
            'tags' => TagResource::collection($this->whenLoaded('tags')),
            'author' => $this->whenLoaded('author', fn () => new UserResource($this->author)),
        ];
    }
}
