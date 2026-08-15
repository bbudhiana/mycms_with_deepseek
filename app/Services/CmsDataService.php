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
        $query = Category::query()->orderBy('name');

        if ($exclude) {
            $selfAndChildren = collect([$exclude->id]);
            $this->collectDescendants($exclude, $selfAndChildren);
            $query = $query->whereNotIn('id', $selfAndChildren->all());
        }

        return $query->get()->map(fn (Category $category) => [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'parent_id' => $category->parent_id,
        ]);
    }

    private function collectDescendants(Category $category, Collection $ids): void
    {
        foreach ($category->children as $child) {
            $ids->push($child->id);
            $this->collectDescendants($child, $ids);
        }
    }
}
