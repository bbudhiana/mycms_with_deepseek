<?php

namespace App\Http\Controllers;

use App\Models\Content;
use App\Services\ContentPublishService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Redirect;
use RuntimeException;

class ContentPublishController extends Controller
{
    public function __construct(private readonly ContentPublishService $publish) {}

    public function publish(Request $request, Content $content)
    {
        $this->authorize('publish', $content);

        try {
            $this->publish->publishNow($content, $request->user());

            return Redirect::back()->with('success', 'Konten berhasil dipublikasikan.');
        } catch (RuntimeException $e) {
            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    public function schedule(Request $request, Content $content)
    {
        $this->authorize('publish', $content);

        $validated = $request->validate(['scheduled_at' => ['required', 'date', 'after:now']]);

        try {
            $this->publish->schedule($content, $request->user(), Carbon::parse($validated['scheduled_at']));

            return Redirect::back()->with('success', 'Publikasi dijadwalkan.');
        } catch (RuntimeException $e) {
            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    public function cancelSchedule(Request $request, Content $content)
    {
        $this->authorize('publish', $content);

        try {
            $this->publish->cancelSchedule($content, $request->user());

            return Redirect::back()->with('success', 'Jadwal publikasi dibatalkan.');
        } catch (RuntimeException $e) {
            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    public function unpublish(Request $request, Content $content)
    {
        $this->authorize('unpublish', $content);

        try {
            $this->publish->unpublish($content, $request->user());

            return Redirect::back()->with('success', 'Publikasi konten ditarik.');
        } catch (RuntimeException $e) {
            return Redirect::back()->with('error', $e->getMessage());
        }
    }

    public function archive(Request $request, Content $content)
    {
        $this->authorize('archive', $content);

        try {
            $this->publish->archive($content, $request->user());

            return Redirect::back()->with('success', 'Konten diarsipkan.');
        } catch (RuntimeException $e) {
            return Redirect::back()->with('error', $e->getMessage());
        }
    }
}
