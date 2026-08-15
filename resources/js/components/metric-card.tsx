import React from 'react';
import { cn } from '@/lib/utils';

export function MetricCard({
    label,
    value,
    icon: Icon,
    tone = 'default',
    hint,
}: {
    label: string;
    value: React.ReactNode | number;
    icon?: React.ElementType;
    tone?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
    hint?: string;
}) {
    const toneMap: Record<string, string> = {
        default: 'bg-muted text-muted-foreground',
        primary: 'bg-primary/10 text-primary',
        accent: 'bg-accent/10 text-accent',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
    };

    return (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                {Icon ? (
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', toneMap[tone])}>
                        <Icon className="h-4.5 w-4.5" />
                    </span>
                ) : null}
            </div>
            <p className="mt-3 font-display text-3xl font-bold tabular-nums">{value}</p>
            {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
    );
}
