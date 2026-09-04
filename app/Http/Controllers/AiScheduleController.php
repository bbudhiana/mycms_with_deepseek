<?php

namespace App\Http\Controllers;

use App\Enums\AiScheduleStatus;
use App\Enums\AiScheduleType;
use App\Enums\AiTone;
use App\Http\Requests\AiScheduleRequest;
use App\Models\AiSchedule;
use App\Models\Category;
use App\Models\Tag;
use App\Models\User;
use App\Services\ActivityLogService;
use App\Services\AiAutopilotService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class AiScheduleController extends Controller
{
    public function __construct(
        private readonly AiAutopilotService $autopilot,
        private readonly ActivityLogService $activityLog,
    ) {}

    public function index()
    {
        $schedules = AiSchedule::query()
            ->withCount('generatedContents')
            ->with(['author:id,name', 'category:id,name'])
            ->latest()
            ->get();

        $authors = User::query()
            ->role('author')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Ai/Schedules', [
            'schedules' => $schedules,
            'authors' => $authors,
            'categories' => Category::query()->orderBy('name')->get(['id', 'name']),
            'tags' => Tag::query()->orderBy('name')->get(['id', 'name']),
            'options' => [
                'types' => collect(AiScheduleType::cases())->map(fn ($t) => ['value' => $t->value, 'label' => $t->label()]),
                'tones' => collect(AiTone::cases())->map(fn ($t) => ['value' => $t->value, 'label' => $t->label()]),
            ],
        ]);
    }

    public function store(AiScheduleRequest $request)
    {
        $data = $this->normalize($request->validated());

        $schedule = AiSchedule::create([...$data, 'status' => AiScheduleStatus::Idle]);

        $this->activityLog->log('ai.schedule.created', $schedule, "Membuat jadwal autopilot '{$schedule->name}'.");

        return Redirect::back()->with('success', 'Jadwal berhasil dibuat.');
    }

    public function update(AiScheduleRequest $request, AiSchedule $schedule)
    {
        $schedule->update($this->normalize($request->validated()));

        $this->activityLog->log('ai.schedule.updated', $schedule, "Memperbarui jadwal autopilot '{$schedule->name}'.");

        return Redirect::back()->with('success', 'Jadwal berhasil diperbarui.');
    }

    public function destroy(AiSchedule $schedule)
    {
        $name = $schedule->name;
        $schedule->delete();

        $this->activityLog->log('ai.schedule.deleted', null, "Menghapus jadwal autopilot '{$name}'.");

        return Redirect::back()->with('success', 'Jadwal berhasil dihapus.');
    }

    public function duplicate(AiSchedule $schedule)
    {
        $copy = $schedule->replicate([
            'status', 'last_run_at', 'failed_at', 'last_error',
        ]);
        $copy->name = "{$schedule->name} (Salinan)";
        $copy->is_active = false;
        $copy->status = AiScheduleStatus::Idle;
        $copy->save();

        $this->activityLog->log('ai.schedule.duplicated', $copy, "Menduplikasi jadwal autopilot '{$schedule->name}'.");

        return Redirect::back()->with('success', 'Jadwal berhasil diduplikasi.');
    }

    public function runNow(Request $request, AiSchedule $schedule)
    {
        $this->autopilot->run($schedule, $request->user()->id);

        return Redirect::back()->with(
            $schedule->fresh()->status === AiScheduleStatus::Failed ? 'error' : 'success',
            $schedule->fresh()->status === AiScheduleStatus::Failed
                ? 'Eksekusi gagal: '.$schedule->fresh()->last_error
                : 'Jadwal berhasil dieksekusi.',
        );
    }

    /**
     * @param  array<string, mixed>  $data
     * @return array<string, mixed>
     */
    private function normalize(array $data): array
    {
        $data['is_active'] = $data['is_active'] ?? false;
        $data['auto_publish'] = $data['auto_publish'] ?? false;
        $data['author_id'] = $data['author_id'] ?? null;
        $data['category_id'] = $data['category_id'] ?? null;
        $data['tags'] = isset($data['tags']) && is_array($data['tags']) ? array_values(array_unique($data['tags'])) : [];

        if (($data['type'] ?? 'daily') !== 'weekly') {
            $data['day_of_week'] = null;
        }

        return $data;
    }
}
