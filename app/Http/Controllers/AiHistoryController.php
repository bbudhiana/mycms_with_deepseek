<?php

namespace App\Http\Controllers;

use App\Enums\AiGeneratedContentStatus;
use App\Models\AiGeneratedContent;
use Illuminate\Http\Request;
use Inertia\Inertia;

class AiHistoryController extends Controller
{
    public function index(Request $request)
    {
        $sort = in_array($request->input('sort'), ['generated_at', 'content_title'], true)
            ? $request->input('sort')
            : 'generated_at';

        $history = AiGeneratedContent::query()
            ->with(['content:id,title,status,featured_image_id', 'content.featuredImage:id,path', 'schedule:id,name'])
            ->when($request->filled('status') && $request->input('status') !== 'all', fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('search'), fn ($q) => $q->whereHas('content', fn ($cq) => $cq->where('title', 'like', '%'.$request->string('search').'%')))
            ->when($sort === 'content_title', fn ($q) => $q->orderBy(
                Content::select('title')->whereColumn('contents.id', 'ai_generated_contents.content_id')
            ))
            ->orderBy('generated_at', 'desc')
            ->paginate(15)
            ->withQueryString();

        $statuses = collect(AiGeneratedContentStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]);

        return Inertia::render('Ai/History', [
            'history' => $history,
            'filters' => $request->only(['status', 'search', 'sort']),
            'statuses' => $statuses,
            'stats' => [
                'total' => AiGeneratedContent::count(),
                'last' => AiGeneratedContent::query()->max('generated_at'),
                'perStatus' => collect(AiGeneratedContentStatus::cases())->mapWithKeys(fn ($s) => [
                    $s->value => AiGeneratedContent::where('status', $s)->count(),
                ]),
            ],
        ]);
    }
}
