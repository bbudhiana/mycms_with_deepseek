<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class MediaRequest extends FormRequest
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
        return match ($this->getMethod()) {
            'POST' => [
                'file' => [
                    'required',
                    'file',
                    'max:10240',
                    'mimes:jpg,jpeg,png,webp,gif,svg,pdf',
                ],
                'alt_text' => ['nullable', 'string', 'max:255'],
            ],
            default => [
                'alt_text' => ['sometimes', 'nullable', 'string', 'max:255'],
            ],
        };
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'File wajib diunggah.',
            'file.max' => 'Ukuran file maksimal 10MB.',
            'file.mimes' => 'Format file tidak diizinkan.',
        ];
    }
}
