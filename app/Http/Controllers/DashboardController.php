<?php

namespace App\Http\Controllers;

use App\Enums\ContentStatus;
use App\Models\Content;
use App\Models\ScheduledPublish;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __invoke(Request $request, ActivityLogService $activityLog)
    {
        $user = $request->user();
        $isEditor = $user->hasAnyRole(['super_admin', 'admin', 'editor']);
        $ownedOnly = fn ($q) => $q->when(! $isEditor, fn ($q) => $q->where('author_id', $user->id));

        $metrics = [
            'published_today' => Content::query()
                ->whereDate('published_at', today())
                ->tap($ownedOnly)
                ->count(),
            'published_yesterday' => Content::query()
                ->whereDate('published_at', today()->subDay())
                ->tap($ownedOnly)
                ->count(),
            'pending_review' => Content::query()
                ->where('status', ContentStatus::Review)
                ->tap($ownedOnly)
                ->count(),
            'scheduled_next_24h' => ScheduledPublish::query()
                ->where('status', 'pending')
                ->whereBetween('scheduled_at', [now(), now()->addHours(24)])
                ->count(),
            'drafts_updated_week' => Content::query()
                ->where('status', ContentStatus::Draft)
                ->where('updated_at', '>=', now()->subWeek())
                ->tap($ownedOnly)
                ->count(),
            'drafts_updated_prior_week' => Content::query()
                ->where('status', ContentStatus::Draft)
                ->whereBetween('updated_at', [now()->subWeeks(2), now()->subWeek()])
                ->tap($ownedOnly)
                ->count(),
        ];

        $funnel = [
            'draft' => Content::query()->where('status', ContentStatus::Draft)->tap($ownedOnly)->count(),
            'review' => Content::query()->where('status', ContentStatus::Review)->tap($ownedOnly)->count(),
            'approved' => Content::query()->where('status', ContentStatus::Approved)->tap($ownedOnly)->count(),
            'published' => Content::query()->where('status', ContentStatus::Published)->tap($ownedOnly)->count(),
            'archived' => Content::query()->where('status', ContentStatus::Archived)->tap($ownedOnly)->count(),
        ];

        $upcoming = ScheduledPublish::query()
            ->where('status', 'pending')
            ->where('scheduled_at', '>=', now())
            ->with('content:id,title,status')
            ->orderBy('scheduled_at')
            ->limit(5)
            ->get(['id', 'content_id', 'scheduled_at', 'status']);

        $recentContents = Content::query()
            ->with('author:id,name')
            ->with('category:id,name')
            ->tap($ownedOnly)
            ->orderByDesc('updated_at')
            ->limit(10)
            ->get();

        $recentActivity = $isEditor
            ? $activityLog->recent(10)
            : $activityLog->recent(10, $user->id);

        return Inertia::render('Dashboard', [
            'metrics' => $metrics,
            'funnel' => $funnel,
            'upcoming' => $upcoming,
            'isEditor' => $isEditor,
            'recentContents' => $recentContents,
            'recentActivity' => $recentActivity,
            'can' => [
                'manageUser' => $user->hasPermissionTo('manage_user'),
                'createContent' => $user->hasPermissionTo('create_content'),
                'approveContent' => $user->hasPermissionTo('approve_content'),
                'publishContent' => $user->hasPermissionTo('publish_content'),
            ],
        ]);
    }
}
