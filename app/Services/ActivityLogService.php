<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class ActivityLogService
{
    public function __construct(private readonly Request $request) {}

    public function log(
        string $action,
        ?Model $subject = null,
        ?string $description = null,
        ?int $userId = null
    ): ActivityLog {
        $user = $userId ?? auth()->id() ?? $this->request->user()?->id;

        try {
            $ip = $this->request->ip();
            $userAgent = $this->request->userAgent();
        } catch (\Throwable) {
            $ip = null;
            $userAgent = null;
        }

        return ActivityLog::query()->create([
            'user_id' => $user,
            'action' => $action,
            'entity_type' => $subject ? $subject->getMorphClass() : null,
            'entity_id' => $subject?->getKey(),
            'description' => $description,
            'ip_address' => $ip,
            'user_agent' => $userAgent,
        ]);
    }

    public function recent(int $limit = 10, ?int $userId = null): Collection
    {
        return ActivityLog::query()
            ->with('user')
            ->when($userId, fn ($q) => $q->where('user_id', $userId))
            ->latest('created_at')
            ->limit($limit)
            ->get();
    }

    public static function logStatic(string $action, ?Model $subject = null, ?string $description = null, ?int $userId = null): void
    {
        ActivityLog::query()->create([
            'user_id' => $userId,
            'action' => $action,
            'entity_type' => $subject ? $subject->getMorphClass() : null,
            'entity_id' => $subject?->getKey(),
            'description' => $description,
        ]);
    }
}
