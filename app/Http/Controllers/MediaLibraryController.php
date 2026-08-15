<?php

namespace App\Http\Controllers;

use App\Http\Requests\MediaRequest;
use App\Models\Media;
use App\Services\ActivityLogService;
use Illuminate\Http\Request;
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
            ->when($request->filled('search'), fn ($q) => $q->where('original_name', 'like', '%'.$request->string('search').'%'))
            ->when($request->filled('type') && $request->input('type') !== 'all', function ($q) use ($request) {
                $type = $request->string('type')->toString();
                $q->where('mime_type', 'like', $type === 'image' ? 'image/%' : ($type === 'doc' ? 'application/%' : 'image/svg+xml'));
            })
            ->when(! $manageAll, fn ($q) => $q->where('uploaded_by', $user->id))
            ->when($request->boolean('mine') === false && $manageAll && $request->filled('uploaded_by'), fn ($q) => $q->where('uploaded_by', $request->integer('uploaded_by')))
            ->orderByDesc('created_at')
            ->paginate(24)
            ->withQueryString();

        return Inertia::render('Media/Index', [
            'media' => $media,
            'filters' => $request->only(['search', 'type']),
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
}
