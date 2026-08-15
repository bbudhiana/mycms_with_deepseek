<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CategoryRequest;
use App\Http\Resources\CategoryResource;
use App\Models\Category;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryApiController extends Controller
{
    public function __construct(private readonly ActivityLogService $activityLog) {}

    public function index(Request $request)
    {
        $categories = Category::query()
            ->withCount('contents')
            ->when($request->filled('search'), fn ($q) => $q->where('name', 'like', '%'.$request->string('search').'%'))
            ->orderBy('name')
            ->paginate($request->integer('per_page', 20));

        return CategoryResource::collection($categories);
    }

    public function tree()
    {
        $categories = Category::query()->with('children')->orderBy('name')->get();

        return CategoryResource::collection($categories);
    }

    public function store(CategoryRequest $request)
    {
        $this->authorize('create', Category::class);

        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? Str::slug($data['name']);

        $category = Category::create($data);

        $this->activityLog->log('category.created', $category, "Membuat kategori '{$category->name}'.");

        return (new CategoryResource($category))->response()->setStatusCode(201);
    }

    public function show(Category $category): CategoryResource
    {
        return new CategoryResource($category->load('children')->loadCount('contents'));
    }

    public function update(CategoryRequest $request, Category $category): CategoryResource
    {
        $this->authorize('update', $category);

        $data = $request->validated();
        $data['slug'] = $data['slug'] ?? $category->slug;

        $category->update($data);

        $this->activityLog->log('category.updated', $category, "Memperbarui kategori '{$category->name}'.");

        return new CategoryResource($category->fresh());
    }

    public function destroy(Request $request, Category $category): JsonResponse
    {
        $this->authorize('delete', $category);

        abort_if($category->children()->exists(), 422, 'Kategori dengan sub-kategori tidak dapat dihapus.');
        abort_if($category->contents()->exists(), 422, 'Kategori yang masih dipakai konten tidak dapat dihapus.');

        $name = $category->name;
        $category->delete();

        $this->activityLog->log('category.deleted', null, "Menghapus kategori '{$name}'.");

        return response()->json(['message' => 'Category deleted.']);
    }
}
