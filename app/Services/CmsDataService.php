<?php

namespace App\Services;

use App\Models\Category;
use App\Models\Tag;
use Illuminate\Support\Collection;

class CmsDataService
{
    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, Category>
     */
    public function categories(bool $withCounts = true): \Illuminate\Database\Eloquent\Collection
    {
        return Category::query()
            ->with('children')
            ->when($withCounts, fn ($q) => $q->withCount('contents'))
            ->orderBy('name')
            ->get();
    }

    /**
     * @return \Illuminate\Database\Eloquent\Collection<int, Tag>
     */
    public function tags(bool $withCounts = true): \Illuminate\Database\Eloquent\Collection
    {
        return Tag::query()
            ->when($withCounts, fn ($q) => $q->withCount('contents'))
            ->orderBy('name')
            ->get();
    }

    public function categoryTree(?Category $exclude = null): Collection
    {
        $all = Category::query()->orderBy('name')->get();

        if ($exclude) {
            $selfAndChildren = collect([$exclude->id]);
            $this->collectDescendants($exclude, $selfAndChildren);
            $all = $all->reject(fn (Category $category) => $selfAndChildren->contains($category->id))->values();
        }

        $byId = $all->keyBy('id');
        $depthOf = function (Category $category) use (&$depthOf, $byId): int {
            if (! $category->parent_id || ! $byId->has($category->parent_id)) {
                return 0;
            }

            return $depthOf($byId->get($category->parent_id)) + 1;
        };

        return $all->map(fn (Category $category) => [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'parent_id' => $category->parent_id,
            'depth' => $depthOf($category),
        ]);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function categoryTaxonomy(): array
    {
        $nodes = Category::query()
            ->withCount(['contents', 'publishedContents', 'children'])
            ->orderBy('name')
            ->get();

        $byParent = $nodes->groupBy(fn (Category $category) => $category->parent_id ?? '_root');
        $build = function (string|int|null $parentId, int $depth, array $path, array $slugPath) use (&$build, $byParent): array {
            return $byParent->get($parentId, collect())
                ->map(function (Category $category) use ($depth, $path, $slugPath, &$build) {
                    $slug = $category->slug ?? $category->name;

                    return [
                        'id' => $category->id,
                        'name' => $category->name,
                        'slug' => $category->slug,
                        'description' => $category->description,
                        'parent_id' => $category->parent_id,
                        'depth' => $depth,
                        'path' => [...$path, $category->name],
                        'slug_path' => [...$slugPath, $slug],
                        'contents_count' => $category->contents_count,
                        'published_count' => $category->published_contents_count ?? 0,
                        'children_count' => $category->children_count,
                        'children' => $build($category->id, $depth + 1, [...$path, $category->name], [...$slugPath, $slug]),
                    ];
                })
                ->values()
                ->all();
        };

        return $build('_root', 0, [], []);
    }

    /**
     * @return array<int, array<string, mixed>>
     */
    public function searchCategories(string $search): array
    {
        $all = Category::query()->orderBy('name')->get()->keyBy('id');

        return Category::query()
            ->withCount(['contents', 'publishedContents', 'children'])
            ->where('name', 'like', "%{$search}%")
            ->orderBy('name')
            ->get()
            ->map(function (Category $category) use ($all) {
                $path = [];
                $slugPath = [];
                $current = $category;
                $guard = 0;

                while ($current && $guard < 20) {
                    $path[] = $current->name;
                    $slugPath[] = $current->slug ?? $current->name;
                    $current = $current->parent_id ? $all->get($current->parent_id) : null;
                    $guard++;
                }

                return [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                    'description' => $category->description,
                    'parent_id' => $category->parent_id,
                    'depth' => count($path) - 1,
                    'path' => array_reverse($path),
                    'slug_path' => array_reverse($slugPath),
                    'contents_count' => $category->contents_count,
                    'published_count' => $category->published_contents_count ?? 0,
                    'children_count' => $category->children_count,
                    'children' => [],
                ];
            })
            ->all();
    }

    private function collectDescendants(Category $category, Collection $ids): void
    {
        foreach ($category->children as $child) {
            $ids->push($child->id);
            $this->collectDescendants($child, $ids);
        }
    }
}
