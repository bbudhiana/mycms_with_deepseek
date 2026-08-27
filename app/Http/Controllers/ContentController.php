<?php

namespace App\Http\Controllers;

use App\Enums\ContentStatus;
use App\Http\Requests\ContentRequest;
use App\Models\Category;
use App\Models\Content;
use App\Models\Tag;
use App\Services\ActivityLogService;
use App\Services\CmsDataService;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ContentController extends Controller
{
    public function __construct(private readonly CmsDataService $cmsData, private readonly ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $user = $request->user();
        $isEditor = $user->hasAnyRole(['super_admin', 'admin', 'editor']);

        $sortable = ['updated_at', 'title', 'status', 'published_at'];
        $sort = $request->input('sort', 'updated_at');
        if (! in_array($sort, $sortable, true)) {
            $sort = 'updated_at';
        }
        $dir = strtolower($request->input('dir', 'desc')) === 'asc' ? 'asc' : 'desc';

        $contents = Content::query()
            ->with(['author:id,name', 'category:id,name', 'tags:id,name', 'featuredImage:id,path', 'thumbnail:id,path'])
            ->when(! $isEditor, fn ($q) => $q->where('author_id', $user->id))
            ->when($request->filled('search'), fn ($q) => $q->where('title', 'like', '%'.$request->string('search').'%'))
            ->when($request->filled('status') && $request->input('status') !== 'all', fn ($q) => $q->where('status', $request->string('status')))
            ->when($request->filled('category') && $request->input('category') !== 'all', fn ($q) => $q->where('category_id', $request->string('category')))
            ->when($request->filled('tag') && $request->input('tag') !== 'all', fn ($q) => $q->whereHas('tags', fn ($tq) => $tq->where('tags.id', $request->string('tag'))))
            ->orderBy($sort, $dir)
            ->paginate(15)
            ->withQueryString();

        foreach ($contents->items() as $content) {
            $content->setAttribute('pending_schedule_exists', $content->pendingSchedule()->exists());
        }

        return Inertia::render('Contents/Index', [
            'contents' => $contents,
            'filters' => $request->only(['search', 'status', 'category', 'tag', 'sort', 'dir']),
            'statuses' => collect(ContentStatus::cases())->map(fn ($s) => ['value' => $s->value, 'label' => $s->label()]),
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'tags' => Tag::query()->orderBy('name')->get(['id', 'name']),
            'can' => [
                'create' => $user->hasPermissionTo('create_content'),
                'delete' => $user->hasPermissionTo('delete_content'),
            ],
        ]);
    }

    public function create(Request $request)
    {
        $this->authorize('create', Content::class);

        return Inertia::render('Contents/Editor', [
            'content' => null,
            'cms' => $this->cmsDataForEditor(),
        ]);
    }

    public function store(ContentRequest $request)
    {
        $this->authorize('create', Content::class);

        $data = $request->validatedSanitized();
        $tags = $data['tags'] ?? [];
        unset($data['tags']);

        $content = Content::create([...$data, 'author_id' => $request->user()->id, 'status' => ContentStatus::Draft]);

        if (! empty($tags)) {
            $content->tags()->sync($tags);
        }

        $this->activityLog->log('content.created', $content, "Membuat konten '{$content->title}'.");

        return redirect()->route('contents.edit', $content)
            ->with('success', 'Draft berhasil dibuat.');
    }

    public function edit(Request $request, Content $content)
    {
        $this->authorize('view', $content);

        $content->load('tags:id,name', 'category:id,name', 'featuredImage', 'thumbnail', 'approvals.reviewer:id,name');

        return Inertia::render('Contents/Editor', [
            'content' => $content,
            'cms' => $this->cmsDataForEditor(),
        ]);
    }

    private function cmsDataForEditor(): array
    {
        return [
            'categories' => $this->cmsData->categories(),
            'tags' => $this->cmsData->tags(),
        ];
    }

    public function update(ContentRequest $request, Content $content)
    {
        $this->authorize('edit', $content);

        $data = $request->validatedSanitized();
        $tags = $data['tags'] ?? [];
        unset($data['tags']);

        $content->update($data);

        $content->tags()->sync($tags);

        $this->activityLog->log('content.updated', $content, "Memperbarui konten '{$content->title}'.");

        return redirect()->route('contents.edit', $content)
            ->with('success', 'Konten berhasil diperbarui.');
    }

    public function destroy(Request $request, Content $content)
    {
        $this->authorize('delete', $content);

        $title = $content->title;
        $content->delete();

        $this->activityLog->log('content.deleted', null, "Menghapus konten '{$title}'.");

        return redirect()
            ->route('contents.index')
            ->with('success', 'Konten berhasil dihapus.');
    }

    /**
     * Autosave body konten tanpa flash toast. Endpoint terpisah dari update
     * agar RichTextEditor boleh mengirim PATCH periodik tanpa membingungkan
     * pengguna dengan notifikasi "Konten berhasil diperbarui" yang muncul
     * padahal tidak ada klik simpan eksplisit.
     */
    public function autosave(Request $request, Content $content)
    {
        $this->authorize('edit', $content);

        $body = (string) $request->input('body', '');
        if (trim($body) === '') {
            return response()->noContent();
        }

        $clean = clean($body, 'cms_content');

        if (trim(strip_tags($clean)) === '') {
            return response()->noContent();
        }

        if ($content->body === $clean) {
            return response()->noContent();
        }

        $content->update(['body' => $clean]);

        return response()->noContent();
    }
}
