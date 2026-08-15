<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Services\ContentWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentWorkflowApiController extends Controller
{
    public function __construct(private readonly ContentWorkflowService $workflow) {}

    public function submit(Request $request, Content $content): JsonResource
    {
        $this->authorize('submit', $content);

        $result = $this->workflow->submit($content, $request->user());

        return new JsonResource(['message' => 'Content submitted for review.', 'content_id' => $result->id]);
    }

    public function approve(Request $request, Content $content): JsonResource
    {
        $this->authorize('approve', $content);

        $result = $this->workflow->approve($content, $request->user());

        return new JsonResource(['message' => 'Content approved.', 'content_id' => $result->id]);
    }

    public function reject(Request $request, Content $content): JsonResource
    {
        $this->authorize('approve', $content);

        $validated = $request->validate(['notes' => ['nullable', 'string', 'max:5000']]);

        $result = $this->workflow->reject($content, $request->user(), $validated['notes'] ?? null);

        return new JsonResource(['message' => 'Content rejected.', 'content_id' => $result->id]);
    }

    public function requestChanges(Request $request, Content $content): JsonResource
    {
        $this->authorize('approve', $content);

        $validated = $request->validate(['notes' => ['required', 'string', 'max:5000']]);

        $result = $this->workflow->requestChanges($content, $request->user(), $validated['notes']);

        return new JsonResource(['message' => 'Changes requested.', 'content_id' => $result->id]);
    }
}
