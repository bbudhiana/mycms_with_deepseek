<?php

namespace App\Http\Controllers;

use App\Http\Requests\CategoryRequest;
use App\Models\Category;
use App\Services\ActivityLogService;
use App\Services\CmsDataService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Str;
use Inertia\Inertia;

class CategoryManagementController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog, private readonly CmsDataService $cmsData) {}

    public function index(Request $request, ?Category $category = null)
    {
        $categories = Category::query()
            ->withCount(['contents', 'children'])
            ->with('parent:id,name')
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->orderBy('name')
            ->paginate(20)
            ->withQueryString();

        return Inertia::render('Categories/Index', [
            'categories' => $categories,
            'filters' => $request->only(['search']),
            'editing' => $category ? $category->load('parent:id,name') : null,
            'parentOptions' => $this->cmsData->categoryTree($category),
            'can' => ['manage' => $request->user()->hasPermissionTo('manage_category')],
        ]);
    }

    public function store(CategoryRequest $request)
    {
        $this->authorize('create', Category::class);

        $data = $request->validated();
        $data['slug'] = ! empty($data['slug']) ? Str::slug($data['slug']) : null;

        $category = Category::create([...$data, 'slug' => $data['slug'] ?? Str::slug($data['name'])]);

        $this->activityLog->log('category.created', $category, "Membuat kategori '{$category->name}'.");

        return Redirect::back()->with('success', 'Kategori dibuat.');
    }

    public function update(CategoryRequest $request, Category $category)
    {
        $this->authorize('update', $category);

        $data = $request->validated();
        $data['slug'] = ! empty($data['slug']) ? Str::slug($data['slug']) : null;

        $category->update([...$data, 'slug' => $data['slug'] ?? Str::slug($data['name'])]);

        $this->activityLog->log('category.updated', $category, "Memperbarui kategori '{$category->name}'.");

        return Redirect::back()->with('success', 'Kategori diperbarui.');
    }

    public function destroy(Request $request, Category $category)
    {
        $this->authorize('delete', $category);

        if ($category->children()->exists()) {
            return Redirect::back()->with('error', 'Kategori dengan sub-kategori tidak dapat dihapus.');
        }

        if ($category->contents()->exists()) {
            return Redirect::back()->with('error', 'Kategori yang masih dipakai konten tidak dapat dihapus.');
        }

        $name = $category->name;
        $category->delete();

        $this->activityLog->log('category.deleted', null, "Menghapus kategori '{$name}'.");

        return Redirect::back()->with('success', 'Kategori dihapus.');
    }
}
