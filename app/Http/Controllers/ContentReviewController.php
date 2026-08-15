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
            ->with(['author:id,name', 'category:id,name'])
            ->select(['id', 'title', 'slug', 'status', 'category_id', 'author_id', 'updated_at', 'excerpt'])
            ->orderBy('updated_at')
            ->paginate(15)
            ->withQueryString();

        $recentlyDecided = $request->user()->hasAnyRole(['super_admin', 'admin', 'editor'])
            ? Content::query()
                ->whereIn('status', [ContentStatus::Approved, ContentStatus::Draft])
                ->whereNotNull('reviewed_at')
                ->with('reviewer:id,name')
                ->orderByDesc('reviewed_at')
                ->limit(10)
                ->get()
            : collect();

        return Inertia::render('Review/Index', [
            'queue' => $queue,
            'recentlyDecided' => $recentlyDecided,
        ]);
    }
}
