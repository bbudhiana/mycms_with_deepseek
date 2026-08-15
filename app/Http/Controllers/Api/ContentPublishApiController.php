<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Content;
use App\Services\ContentPublishService;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Carbon;

class ContentPublishApiController extends Controller
{
    public function __construct(private readonly ContentPublishService $publish) {}

    public function publish(Request $request, Content $content): JsonResource
    {
        $this->authorize('publish', $content);

        $result = $this->publish->publishNow($content, $request->user());

        return new JsonResource(['message' => 'Content published.', 'content_id' => $result->id]);
    }

    public function schedule(Request $request, Content $content): JsonResource
    {
        $this->authorize('publish', $content);

        $validated = $request->validate(['scheduled_at' => ['required', 'date', 'after:now']]);

        $result = $this->publish->schedule($content, $request->user(), Carbon::parse($validated['scheduled_at']));

        return new JsonResource(['message' => 'Publication scheduled.', 'schedule_id' => $result->id]);
    }

    public function unpublish(Request $request, Content $content): JsonResource
    {
        $this->authorize('unpublish', $content);

        $result = $this->publish->unpublish($content, $request->user());

        return new JsonResource(['message' => 'Content unpublished.', 'content_id' => $result->id]);
    }

    public function archive(Request $request, Content $content): JsonResource
    {
        $this->authorize('archive', $content);

        $result = $this->publish->archive($content, $request->user());

        return new JsonResource(['message' => 'Content archived.', 'content_id' => $result->id]);
    }
}
