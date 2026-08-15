<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\MediaRequest;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class MediaApiController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $manageAll = $user->hasPermissionTo('manage_media');

        $media = Media::query()
            ->with('uploader:id,name')
            ->when($request->filled('search'), fn ($q) => $q->where('original_name', 'like', '%'.$request->string('search').'%'))
            ->when(! $manageAll, fn ($q) => $q->where('uploaded_by', $user->id))
            ->orderByDesc('created_at')
            ->paginate($request->integer('per_page', 24));

        return MediaResource::collection($media);
    }

    public function store(MediaRequest $request)
    {
        $this->authorize('upload', Media::class);

        $file = $request->file('file');
        $basePath = 'media/'.now()->format('Y/m');
        $filename = Str::uuid().'.'.$file->getClientOriginalExtension();
        $path = $file->storeAs($basePath, $filename, 'public');

        $media = Media::create([
            'filename' => $filename,
            'original_name' => $file->getClientOriginalName(),
            'path' => $path,
            'mime_type' => $file->getMimeType(),
            'size' => $file->getSize(),
            'alt_text' => $request->input('alt_text'),
            'uploaded_by' => $request->user()->id,
        ]);

        $this->activityLog->log('media.uploaded', $media, "Mengunggah media '{$media->original_name}'.");

        return (new MediaResource($media))->response()->setStatusCode(201);
    }

    public function show(Media $media): MediaResource
    {
        $this->authorize('viewAny', Media::class);

        return new MediaResource($media);
    }

    public function updateAltText(MediaRequest $request, Media $media): MediaResource
    {
        $this->authorize('update', $media);

        $mediar = $request->validated();
        $media->update(['alt_text' => $mediar['alt_text'] ?? null]);

        $this->activityLog->log('media.updated', $media, "Memperbarui alt text media '{$media->original_name}'.");

        return new MediaResource($media->fresh());
    }

    public function destroy(Request $request, Media $media): JsonResponse
    {
        $this->authorize('delete', $media);

        $name = $media->original_name;
        $media->deleteFromDisk();
        $media->delete();

        $this->activityLog->log('media.deleted', null, "Menghapus media '{$name}'.");

        return response()->json(['message' => 'Media deleted.']);
    }
}
