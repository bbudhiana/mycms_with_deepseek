import React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
    title,
    eyebrow,
    description,
    actions,
    className,
}: {
    title: string;
    eyebrow?: string;
    description?: string;
    actions?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'mb-6 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between',
                className,
            )}
        >
            <div>
                {eyebrow ? (
                    <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
                ) : null}
                <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
                {description ? <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
            </div>
            {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
    );
}

export function SectionCard({
    title,
    description,
    action,
    children,
    className,
}: {
    title?: string;
    description?: string;
    action?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <section className={cn('rounded-xl border border-border bg-card p-5 shadow-sm', className)}>
            {title ? (
                <div className="mb-4 flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-sm font-semibold">{title}</h2>
                        {description ? <p className="mt-0.5 text-xs text-muted-foreground">{description}</p> : null}
                    </div>
                    {action}
                </div>
            ) : null}
            {children}
        </section>
    );
}
