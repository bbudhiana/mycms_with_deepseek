<?php

namespace App\Http\Controllers;

use App\Models\Content;
use App\Services\ContentWorkflowService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use RuntimeException;

class ContentWorkflowController extends Controller
{
    public function __construct(private readonly ContentWorkflowService $workflow) {}

    public function submit(Request $request, Content $content)
    {
        $this->authorize('submit', $content);

        try {
            $this->workflow->submit($content, $request->user());

            return Redirect::back()->with('success', 'Konten dikirim ke review.');
        } catch (RuntimeException $e) {
            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    public function approve(Request $request, Content $content)
    {
        $this->authorize('approve', $content);

        try {
            $this->workflow->approve($content, $request->user());

            return Redirect::back()->with('success', 'Konten disetujui.');
        } catch (RuntimeException $e) {
            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    public function reject(Request $request, Content $content)
    {
        $this->authorize('approve', $content);

        $validated = $request->validate(['notes' => ['nullable', 'string', 'max:5000']]);

        try {
            $this->workflow->reject($content, $request->user(), $validated['notes'] ?? null);

            return Redirect::back()->with('success', 'Konten ditolak dan dikembalikan ke draft.');
        } catch (RuntimeException $e) {
            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    public function requestChanges(Request $request, Content $content)
    {
        $this->authorize('approve', $content);

        $validated = $request->validate(['notes' => ['required', 'string', 'max:5000']]);

        try {
            $this->workflow->requestChanges($content, $request->user(), $validated['notes']);

            return Redirect::back()->with('success', 'Permintaan revisi dikirim ke author.');
        } catch (RuntimeException $e) {
            return Redirect::back()->with('error', $e->getMessage());
        }
    }
}
