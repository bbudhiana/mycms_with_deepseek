<?php

namespace App\Http\Controllers;

use App\Enums\ContentStatus;
use App\Models\Content;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContentReviewController extends Controller
{
    public function __invoke(Request $request)
    {
        abort_unless($request->user()->hasPermissionTo('approve_content'), 403);

        $queue = Content::query()
            ->where('status', ContentStatus::Review)
            ->with(['author:id,name', 'category:id,name', 'thumbnail:id,path', 'featuredImage:id,path'])
            ->select(['id', 'title', 'slug', 'status', 'category_id', 'author_id', 'updated_at', 'published_at', 'excerpt', 'body'])
            ->orderBy('updated_at')
            ->paginate(15)
            ->withQueryString();

        foreach ($queue->items() as $content) {
            $content->setAttribute('waiting_hours', (int) max(0, $content->updated_at->diffInHours(now())));
        }

        $recentlyDecided = $this->recentlyDecided($request);

        return Inertia::render('Review/Index', [
            'queue' => $queue,
            'recentlyDecided' => $recentlyDecided,
        ]);
    }

    private function recentlyDecided(Request $request): array
    {
        if (! $request->user()->hasAnyRole(['super_admin', 'admin', 'editor'])) {
            return [];
        }

        return Content::query()
            ->whereIn('status', [ContentStatus::Approved, ContentStatus::Draft])
            ->whereNotNull('reviewed_at')
            ->with(['reviewer:id,name', 'approvals.reviewer:id,name'])
            ->orderByDesc('reviewed_at')
            ->limit(10)
            ->get()
            ->map(function (Content $content) {
                return [
                    'id' => $content->id,
                    'title' => $content->title,
                    'status' => $content->status->value,
                    'reviewed_at' => $content->reviewed_at?->toIso8601String(),
                    'reviewer' => $content->reviewer,
                    'latest_approval' => $content->approvals->first(),
                ];
            })
            ->values()
            ->all();
    }
}
