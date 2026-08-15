<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class CategoryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('categories', 'slug')->ignore($this->route('category')?->getKey())],
            'description' => ['nullable', 'string', 'max:65535'],
            'parent_id' => ['nullable', 'integer', 'exists:categories,id'],
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $category = $this->route('category');
            $parentId = $this->input('parent_id');

            if ($category && $parentId) {
                $selfAndDescendants = $this->selfAndDescendantIds($category);

                if (in_array((int) $parentId, $selfAndDescendants, true)) {
                    $validator->errors()->add('parent_id', 'Kategori tidak dapat menjadi parent dari dirinya sendiri.');
                }
            }
        });
    }

    /**
     * @return array<int, int>
     */
    private function selfAndDescendantIds($category): array
    {
        $ids = [$category->id];
        $this->collectChildren($category, $ids);

        return $ids;
    }

    /**
     * @param  array<int, int>  $ids
     */
    private function collectChildren($category, array &$ids): void
    {
        foreach ($category->children as $child) {
            $ids[] = $child->id;
            $this->collectChildren($child, $ids);
        }
    }
}
