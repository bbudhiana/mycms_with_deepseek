<?php

namespace App\Http\Controllers;

use App\Http\Requests\MediaRequest;
use App\Models\Content;
use App\Models\Media;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Inertia\Inertia;

class MediaLibraryController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $manageAll = $user->hasPermissionTo('manage_media');

        $media = Media::query()
            ->with('uploader:id,name')
            ->withCount(['usedByFeaturedContents as featured_usage_count', 'usedByThumbnailContents as thumbnail_usage_count'])
            ->when($request->filled('search'), fn ($q) => $q->where('original_name', 'like', '%'.$request->string('search').'%'))
            ->when($request->filled('type') && $request->input('type') !== 'all', function ($q) use ($request) {
                $type = $request->string('type')->toString();
                $q->where('mime_type', 'like', $type === 'image' ? 'image/%' : ($type === 'doc' ? 'application/%' : 'image/svg+xml'));
            })
            ->when(! $manageAll, fn ($q) => $q->where('uploaded_by', $user->id))
            ->when($request->boolean('mine') && $manageAll, fn ($q) => $q->where('uploaded_by', $user->id))
            ->when($request->input('alt') === 'missing', fn ($q) => $q->whereNull('alt_text'))
            ->when($request->filled('used'), function ($q) use ($request) {
                if ($request->boolean('used')) {
                    $q->where(fn ($sub) => $sub->whereHas('usedByFeaturedContents')->orWhereHas('usedByThumbnailContents'));
                } else {
                    $q->whereDoesntHave('usedByFeaturedContents')->whereDoesntHave('usedByThumbnailContents');
                }
            })
            ->when($request->filled('sort') && $request->input('sort') !== 'recent', function ($q) use ($request) {
                match ($request->string('sort')->toString()) {
                    'largest' => $q->orderByDesc('size'),
                    'name' => $q->orderBy('original_name'),
                    default => $q->orderByDesc('created_at'),
                };
            }, fn ($q) => $q->orderByDesc('created_at'))
            ->paginate(24)
            ->withQueryString();

        // Backfill dimensions and thumbnails once for legacy items on the current page.
        $media->getCollection()->each(function (Media $item) {
            $item->fillDimensions();
            $item->ensureThumbnail();
        });

        $this->attachUsage($media);

        return Inertia::render('Media/Index', [
            'media' => $media,
            'filters' => [
                'search' => $request->input('search'),
                'type' => $request->input('type'),
                'sort' => $request->input('sort'),
                'mine' => $request->boolean('mine'),
                'alt' => $request->input('alt'),
                'used' => $request->filled('used') ? $request->boolean('used') : null,
            ],
            'stats' => $this->stats($manageAll, $user->id),
            'can' => [
                'upload' => $user->hasPermissionTo('upload_media'),
                'manage' => $manageAll,
            ],
        ]);
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

        $media->fillDimensions();
        $media->ensureThumbnail();

        $this->activityLog->log('media.uploaded', $media, "Mengunggah media '{$media->original_name}'.");

        if ($request->wantsJson()) {
            return response()->json(['media' => $media->refresh()], 201);
        }

        return Redirect::back()->with('success', 'Media berhasil diunggah.');
    }

    public function updateAltText(Request $request, Media $media)
    {
        $this->authorize('update', $media);

        $validated = $request->validate(['alt_text' => ['nullable', 'string', 'max:255']]);

        $media->update(['alt_text' => $validated['alt_text'] ?? null]);

        $this->activityLog->log('media.updated', $media, "Memperbarui alt text media '{$media->original_name}'.");

        return Redirect::back()->with('success', 'Alt text diperbarui.');
    }

    public function destroy(Request $request, Media $media)
    {
        $this->authorize('delete', $media);

        $name = $media->original_name;
        $media->deleteFromDisk();
        $media->delete();

        $this->activityLog->log('media.deleted', null, "Menghapus media '{$name}'.");

        return Redirect::back()->with('success', 'Media dihapus.');
    }

    private function attachUsage(LengthAwarePaginator $media): void
    {
        $ids = $media->getCollection()->pluck('id');

        if ($ids->isEmpty()) {
            return;
        }

        $contents = Content::query()
            ->where(fn ($q) => $q->whereIn('featured_image_id', $ids)->orWhereIn('thumbnail_id', $ids))
            ->select(['id', 'title', 'featured_image_id', 'thumbnail_id'])
            ->orderByDesc('updated_at')
            ->get();

        $usageMap = [];

        foreach ($contents as $content) {
            foreach (['featured_image_id', 'thumbnail_id'] as $column) {
                $mediaId = $content->{$column};

                if ($mediaId !== null && $ids->contains($mediaId)) {
                    $usageMap[$mediaId][] = ['id' => $content->id, 'title' => $content->title];
                }
            }
        }

        $media->getCollection()->each(function (Media $item) use ($usageMap) {
            $item->setAttribute('used_in_contents', $usageMap[$item->id] ?? []);
        });
    }

    /**
     * @return array{total: int, storage: int, missing_alt: int, unused: int}
     */
    private function stats(bool $manageAll, int $userId): array
    {
        $query = Media::query()->when(! $manageAll, fn ($q) => $q->where('uploaded_by', $userId));

        return [
            'total' => (clone $query)->count(),
            'storage' => (clone $query)->sum('size'),
            'missing_alt' => (clone $query)->whereNull('alt_text')->count(),
            'unused' => (clone $query)
                ->whereDoesntHave('usedByFeaturedContents')
                ->whereDoesntHave('usedByThumbnailContents')
                ->count(),
        ];
    }
}
