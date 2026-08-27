<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AiScheduleRequest extends FormRequest
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
        $type = $this->input('type', 'daily');

        return [
            'name' => ['required', 'string', 'max:255'],
            'author_id' => ['nullable', 'integer', 'exists:users,id'],
            'is_active' => ['sometimes', 'boolean'],
            'type' => ['required', Rule::in(['daily', 'weekly'])],
            'tone' => ['required', Rule::in(['editorial', 'konvensional', 'teknis', 'santai', 'ceria'])],
            'topic_direction' => ['required', 'string', 'max:5000'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'tags' => ['nullable', 'array', 'max:20'],
            'tags.*' => ['integer', 'exists:tags,id'],
            'language' => ['required', 'string', 'max:10'],
            'publish_time' => ['required', 'date_format:H:i'],
            'day_of_week' => [$type === 'weekly' ? 'required' : 'nullable', 'integer', 'between:1,7'],
            'content_count' => ['required', 'integer', 'min:1', 'max:10'],
            'auto_publish' => ['sometimes', 'boolean'],
        ];
    }
}
