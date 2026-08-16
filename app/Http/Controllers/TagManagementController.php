<?php

namespace App\Http\Controllers;

use App\Enums\ContentStatus;
use App\Http\Requests\TagRequest;
use App\Models\Tag;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Inertia\Inertia;

class TagManagementController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $sort = $request->input('sort', 'name');
        if (! in_array($sort, ['name', 'count', 'created'], true)) {
            $sort = 'name';
        }
        $used = $request->input('used', 'all');
        if (! in_array($used, ['all', 'used', 'unused'], true)) {
            $used = 'all';
        }

        $tags = Tag::query()
            ->withCount(['contents', 'contents as published_count' => fn ($q) => $q->where('status', ContentStatus::Published)])
            ->withMax('contents', 'published_at')
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->when($used === 'used', fn ($q) => $q->has('contents'))
            ->when($used === 'unused', fn ($q) => $q->doesntHave('contents'))
            ->when($sort === 'count', fn ($q) => $q->orderByDesc('contents_count'))
            ->when($sort === 'created', fn ($q) => $q->orderByDesc('created_at'))
            ->when($sort === 'name', fn ($q) => $q->orderBy('name'))
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Tags/Index', [
            'tags' => $tags,
            'stats' => [
                'total' => Tag::count(),
                'used' => Tag::has('contents')->count(),
                'unused' => Tag::doesntHave('contents')->count(),
                'hot' => Tag::whereHas('contents', fn ($q) => $q
                    ->where('status', ContentStatus::Published)
                    ->where('published_at', '>=', now()->subDays(30)))->count(),
            ],
            'filters' => $request->only(['search', 'sort', 'used']),
            'can' => ['manage' => $request->user()->hasPermissionTo('manage_tag')],
        ]);
    }

    public function store(TagRequest $request)
    {
        $this->authorize('create', Tag::class);

        $data = $request->validated();
        $names = collect(explode(',', $data['name']))
            ->map(fn (string $name) => trim($name))
            ->filter()
            ->values();

        $created = [];
        foreach ($names as $name) {
            $slug = count($names) === 1 && ! empty($data['slug'])
                ? Str::slug($data['slug'])
                : $this->uniqueSlug($name);

            $created[] = Tag::create(['name' => $name, 'slug' => $slug]);
        }

        $label = count($created) === 1
            ? "Tag '{$created[0]->name}' dibuat."
            : count($created).' tag dibuat.';

        $this->activityLog->log('tag.created', $created[0] ?? null, $label);

        return Redirect::back()->with('success', $label);
    }

    public function update(TagRequest $request, Tag $tag)
    {
        $this->authorize('update', $tag);

        $data = $request->validated();
        $slug = ! empty($data['slug'])
            ? Str::slug($data['slug'])
            : $this->uniqueSlug($data['name'], $tag->id);

        $tag->update(['name' => $data['name'], 'slug' => $slug]);

        $this->activityLog->log('tag.updated', $tag, "Memperbarui tag '{$tag->name}'.");

        return Redirect::back()->with('success', 'Tag diperbarui.');
    }

    public function destroy(Request $request, Tag $tag)
    {
        $this->authorize('delete', $tag);

        $name = $tag->name;
        $tag->delete();

        $this->activityLog->log('tag.deleted', null, "Menghapus tag '{$name}'.");

        return Redirect::back()->with('success', 'Tag dihapus.');
    }

    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $suffix = 2;

        while (Tag::where('slug', $slug)
            ->when($ignoreId, fn ($q) => $q->where('id', '!=', $ignoreId))
            ->exists()) {
            $slug = $base.'-'.$suffix;
            $suffix++;
        }

        return $slug;
    }
}
