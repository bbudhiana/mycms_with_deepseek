<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AiSettingsRequest extends FormRequest
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
        $imageEnabled = (bool) $this->input('image_enabled', false);
        $imageProvider = (string) $this->input('image_provider', 'custom');

        return [
            'base_url' => ['required', 'url', 'max:255'],
            'api_key' => ['nullable', 'string', 'max:500'],
            'model' => ['required', 'string', 'max:255'],
            'provider' => ['required', 'string', Rule::in(['openai-compatible'])],
            'temperature' => ['required', 'numeric', 'min:0', 'max:2'],
            'max_tokens' => ['required', 'integer', 'min:1', 'max:131072'],
            'image_enabled' => ['sometimes', 'boolean'],
            'image_provider' => ['sometimes', Rule::in(['custom', 'pexels'])],
            'image_api_key' => [
                $imageEnabled && $imageProvider === 'pexels' ? 'required' : 'nullable',
                'string',
                'max:500',
            ],
            'image_endpoint_url' => [
                $imageEnabled && $imageProvider === 'custom' ? 'required' : 'nullable',
                'url',
                'max:255',
            ],
        ];
    }
}
