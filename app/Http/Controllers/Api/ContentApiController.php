<?php

namespace App\Http\Controllers\Api;

use App\Enums\ContentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\ContentRequest;
use App\Http\Resources\ContentApprovalResource;
use App\Http\Resources\ContentResource;
use App\Models\Content;
use App\Models\ScheduledPublish;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContentApiController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $this->authorize('viewAny', Content::class);

        $user = $request->user();
        $isEditor = $user->hasAnyRole(['super_admin', 'admin', 'editor']);

        $contents = Content::query()
            ->with('author:id,name', 'category:id,name', 'tags:id,name')
            ->select(['id', 'title', 'sub_title', 'slug', 'excerpt', 'status', 'category_id', 'author_id', 'breaking_news_flag', 'editor_pick_flag', 'published_at', 'updated_at'])
            ->when(! $isEditor, fn ($q) => $q->where('author_id', $user->id))
            ->when($request->filled('search'), fn ($q) => $q->where('title', 'like', '%'.$request->string('search').'%'))
            ->when($request->filled('status') && $request->input('status') !== 'all', fn ($q) => $q->where('status', $request->string('status')))
            ->orderByDesc('updated_at')
            ->paginate($request->integer('per_page', 15));

        return ContentResource::collection($contents);
    }

    public function pendingReview(Request $request)
    {
        abort_unless($request->user()->hasPermissionTo('approve_content'), 403);

        $contents = Content::query()
            ->with('author:id,name', 'category:id,name')
            ->where('status', ContentStatus::Review)
            ->orderBy('updated_at')
            ->get();

        return ContentResource::collection($contents);
    }

    public function scheduled(Request $request)
    {
        abort_unless($request->user()->hasPermissionTo('publish_content'), 403);

        $schedules = ScheduledPublish::query()
            ->with('content:id,title,slug,status')
            ->where('status', 'pending')
            ->where('scheduled_at', '>=', now())
            ->orderBy('scheduled_at')
            ->get();

        $payload = [];

        foreach ($schedules as $schedule) {
            $payload[] = [
                'id' => $schedule->id,
                'content_id' => $schedule->content_id,
                'title' => $schedule->content?->title,
                'status' => $schedule->status->value,
                'scheduled_at' => $schedule->scheduled_at->toISOString(),
            ];
        }

        return JsonResource::collection($payload);
    }

    public function store(ContentRequest $request)
    {
        $this->authorize('create', Content::class);

        $data = $request->validatedSanitized();
        $tags = $data['tags'] ?? [];
        unset($data['tags']);

        $content = Content::create([...$data, 'author_id' => $request->user()->id, 'status' => ContentStatus::Draft]);

        if (! empty($tags)) {
            $content->tags()->sync($tags);
        }

        $this->activityLog->log('content.created', $content, "Membuat konten '{$content->title}'.");

        return (new ContentResource($content->load('tags')))->response()->setStatusCode(201);
    }

    public function show(Content $content): ContentResource
    {
        $this->authorize('view', $content);

        return new ContentResource(
            $content->load('featuredImage', 'thumbnail', 'category', 'tags', 'approvals.reviewer:id,name')
        );
    }

    public function approvalHistory(Content $content)
    {
        $this->authorize('view', $content);

        $content->loadMissing('approvals.reviewer:id,name');

        return ContentApprovalResource::collection($content->approvals);
    }

    public function update(ContentRequest $request, Content $content): ContentResource
    {
        $this->authorize('edit', $content);

        $data = $request->validatedSanitized();
        $tags = $data['tags'] ?? [];
        unset($data['tags']);

        $content->update($data);

        if ($tags) {
            $content->tags()->sync($tags);
        }

        $this->activityLog->log('content.updated', $content, "Memperbarui konten '{$content->title}'.");

        return new ContentResource($content->load('tags'));
    }

    public function destroy(Request $request, Content $content): JsonResponse
    {
        $this->authorize('delete', $content);

        $title = $content->title;
        $content->delete();

        $this->activityLog->log('content.deleted', null, "Menghapus konten '{$title}'.");

        return response()->json(['message' => 'Content deleted.']);
    }
}
