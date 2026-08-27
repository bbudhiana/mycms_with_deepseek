<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class ContentRequest extends FormRequest
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
        $contentId = $this->route('content')?->getKey();
        $creating = $this->route('content') === null;
        // PATCH autosave mengirim sebagian field (hanya body). Wajibkan lengkap
        // hanya saat membuat; update validasi field yang hadir.
        $req = $creating ? 'required' : 'sometimes';

        return [
            'title' => [$req, 'string', 'max:255'],
            'slug' => ['nullable', 'string', 'max:255', Rule::unique('contents', 'slug')->ignore($contentId)],
            'sub_title' => ['nullable', 'string', 'max:255'],
            'excerpt' => ['nullable', 'string', 'max:65535'],
            'body' => [$req, 'string'],
            'featured_video' => ['nullable', 'string', 'max:65535'],
            'breaking_news_flag' => ['sometimes', 'boolean'],
            'editor_pick_flag' => ['sometimes', 'boolean'],
            'featured_image_id' => ['nullable', 'integer', 'exists:media,id'],
            'thumbnail_id' => ['nullable', 'integer', 'exists:media,id'],
            'image_caption' => ['nullable', 'string', 'max:255'],
            'image_credit' => ['nullable', 'string', 'max:255'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'tags' => ['nullable', 'array'],
            'tags.*' => ['integer', 'exists:tags,id'],
        ];
    }

    /**
     * @return array<string, mixed>
     */
    public function validatedSanitized(): array
    {
        $data = $this->validated();

        if (isset($data['body'])) {
            $data['body'] = clean($data['body'], 'cms_content');
        }

        if (isset($data['featured_video'])) {
            $data['featured_video'] = clean($data['featured_video'], 'cms_content');
        }

        $data['slug'] = ! empty($data['slug'])
            ? Str::slug($data['slug'])
            : null;

        return $data;
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'title.required' => 'Judul wajib diisi.',
            'body.required' => 'Isi artikel wajib diisi.',
            'body.min_text' => 'Isi artikel tidak boleh hanya berisi kode HTML tanpa teks.',
        ];
    }

    protected function withValidator(Validator $validator): void
    {
        $validator->after(function ($validator) {
            $body = $this->input('body', '');

            if (trim(strip_tags(clean((string) $body, 'cms_content'))) === '') {
                $validator->errors()->add('body', 'Isi artikel tidak boleh hanya berisi kode HTML tanpa teks.');
            }
        });
    }
}
