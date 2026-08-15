<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\TagRequest;
use App\Http\Resources\TagResource;
use App\Models\Tag;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class TagApiController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $tags = Tag::query()
            ->withCount('contents')
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return TagResource::collection($tags);
    }

    public function search(Request $request)
    {
        abort_unless($request->filled('q'), 422, 'Parameter q wajib diisi.');

        $tags = Tag::query()
            ->where('name', 'like', '%'.$request->string('q').'%')
            ->limit(25)
            ->get();

        return TagResource::collection($tags);
    }

    public function store(TagRequest $request)
    {
        $this->authorize('create', Tag::class);

        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $tag = Tag::create($data);

        $this->activityLog->log('tag.created', $tag, "Membuat tag '{$tag->name}'.");

        return (new TagResource($tag))->response()->setStatusCode(201);
    }

    public function show(Tag $tag): TagResource
    {
        return new TagResource($tag->loadCount('contents'));
    }

    public function update(TagRequest $request, Tag $tag): TagResource
    {
        $this->authorize('update', $tag);

        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? $tag->slug;

        $tag->update($data);

        $this->activityLog->log('tag.updated', $tag, "Memperbarui tag '{$tag->name}'.");

        return new TagResource($tag->fresh());
    }

    public function destroy(Request $request, Tag $tag): JsonResponse
    {
        $this->authorize('delete', $tag);

        $name = $tag->name;
        $tag->delete();

        $this->activityLog->log('tag.deleted', null, "Menghapus tag '{$name}'.");

        return response()->json(['message' => 'Tag deleted.']);
    }
}
