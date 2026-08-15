<?php

namespace App\Http\Resources;

use App\Models\ContentApproval;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin ContentApproval
 */
class ContentApprovalResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'content_id' => $this->content_id,
            'action' => $this->action->value,
            'action_label' => $this->action->label(),
            'notes' => $this->notes,
            'reviewer' => $this->whenLoaded('reviewer', fn () => [
                'id' => $this->reviewer->id,
                'name' => $this->reviewer->name,
            ]),
            'created_at' => $this->created_at?->toISOString(),
        ];
    }
}
