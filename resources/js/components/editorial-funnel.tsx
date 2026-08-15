import React from 'react';
import { cn } from '@/lib/utils';

export interface FunnelStage {
    key: string;
    label: string;
    count: number;
    tone: 'draft' | 'review' | 'approved' | 'published' | 'archived';
}

export function EditorialFunnel({ stages }: { stages: FunnelStage[] }) {
    const total = stages.reduce((sum, s) => sum + s.count, 0) || 1;

    const dropoffs = stages.slice(1).map((stage, i) => {
        const prev = stages[i];
        if (prev.count <= 0) return { stage: null as FunnelStage | null, ratio: 0 };
        return { stage, ratio: stage.count / prev.count };
    });

    const biggestDropoff = dropoffs.reduce((acc, cur) => (cur.stage && cur.ratio < acc.ratio ? cur : acc), {
        stage: null as FunnelStage | null,
        ratio: 1,
    }).stage;

    return (
        <div className="space-y-4">
            <div
                className="flex h-4 w-full overflow-hidden rounded-md border border-border"
                role="img"
                aria-label="Distribusi status konten"
            >
                {stages.map((s) => (
                    <div
                        key={s.key}
                        className={cn('h-full transition-all duration-300', toneClasses[s.tone])}
                        style={{ width: `${(s.count / total) * 100}%` }}
                        title={`${s.label}: ${s.count}`}
                    />
                ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {stages.map((s, i) => {
                    const isBiggestDrop = biggestDropoff?.key === s.key && i > 0;
                    const prev = i > 0 ? stages[i - 1] : null;
                    const conv = prev && prev.count > 0 ? Math.round((s.count / prev.count) * 100) : 100;

                    return (
                        <div
                            key={s.key}
                            className={cn(
                                'rounded-lg border p-3',
                                isBiggestDrop ? 'border-warning/40 bg-warning/5' : 'border-border bg-card',
                            )}
                        >
                            <div className="flex items-center justify-between gap-1">
                                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                                {i > 0 && (
                                    <span className="text-[10px] font-semibold text-muted-foreground/70">{conv}%</span>
                                )}
                            </div>
                            <p className="mt-1 font-display text-2xl font-bold tabular-nums">{s.count}</p>
                            {isBiggestDrop ? (
                                <p className="mt-0.5 text-[10px] font-medium text-warning">Perlu perhatian</p>
                            ) : null}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

const toneClasses: Record<string, string> = {
    draft: 'bg-draft/60',
    review: 'bg-review/60',
    approved: 'bg-approved/60',
    published: 'bg-published/60',
    archived: 'bg-archived/60',
};
