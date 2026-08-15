<?php

namespace App\Http\Controllers;

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
        $tags = Tag::query()
            ->withCount('contents')
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Tags/Index', [
            'tags' => $tags,
            'filters' => $request->only(['search']),
            'can' => ['manage' => $request->user()->hasPermissionTo('manage_tag')],
        ]);
    }

    public function store(TagRequest $request)
    {
        $this->authorize('create', Tag::class);

        $data = $request->validated();
        $data['slug'] = ! empty($data['slug']) ? Str::slug($data['slug']) : null;

        $tag = Tag::create([...$data, 'slug' => $data['slug'] ?? Str::slug($data['name'])]);

        $this->activityLog->log('tag.created', $tag, "Membuat tag '{$tag->name}'.");

        return Redirect::back()->with('success', 'Tag dibuat.');
    }

    public function update(TagRequest $request, Tag $tag)
    {
        $this->authorize('update', $tag);

        $data = $request->validated();
        $data['slug'] = ! empty($data['slug']) ? Str::slug($data['slug']) : null;

        $tag->update([...$data, 'slug' => $data['slug'] ?? Str::slug($data['name'])]);

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
}
