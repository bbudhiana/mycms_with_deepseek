import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

export function MetricCard({
    label,
    value,
    icon: Icon,
    tone = 'default',
    hint,
    delta,
    deltaLabel,
    onClick,
}: {
    label: string;
    value: React.ReactNode | number;
    icon?: React.ElementType;
    tone?: 'default' | 'primary' | 'accent' | 'success' | 'warning';
    hint?: string;
    delta?: number | null;
    deltaLabel?: string;
    onClick?: () => void;
}) {
    const toneMap: Record<string, string> = {
        default: 'bg-muted text-muted-foreground',
        primary: 'bg-primary/10 text-primary',
        accent: 'bg-accent/10 text-accent',
        success: 'bg-success/10 text-success',
        warning: 'bg-warning/10 text-warning',
    };

    const deltaComp =
        delta == null ? null : delta > 0 ? (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-success">
                <ArrowUpRight className="h-3 w-3" /> {delta}
            </span>
        ) : delta < 0 ? (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-destructive">
                <ArrowDownRight className="h-3 w-3" /> {Math.abs(delta)}
            </span>
        ) : (
            <span className="inline-flex items-center gap-0.5 text-xs font-semibold text-muted-foreground">
                <Minus className="h-3 w-3" /> 0
            </span>
        );

    const Comp = onClick ? 'button' : 'div';

    return (
        <Comp
            onClick={onClick}
            className={cn(
                'rounded-xl border border-border bg-card p-5 text-left shadow-sm transition-colors duration-200',
                onClick && 'cursor-pointer hover:border-primary/40',
            )}
        >
            <div className="flex items-center justify-between">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
                {Icon ? (
                    <span className={cn('flex h-9 w-9 items-center justify-center rounded-lg', toneMap[tone])}>
                        <Icon className="h-4 w-4" />
                    </span>
                ) : null}
            </div>
            <div className="mt-2 flex items-end gap-2">
                <p className="font-display text-4xl font-bold tabular-nums leading-none">{value}</p>
                {deltaComp}
            </div>
            {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
            {deltaLabel ? <p className="mt-0.5 text-[10px] text-muted-foreground/70">{deltaLabel}</p> : null}
        </Comp>
    );
}
