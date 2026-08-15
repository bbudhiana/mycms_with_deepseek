import * as React from 'react';
import { Inbox } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EmptyState({
    icon: Icon = Inbox,
    title,
    description,
    action,
    className,
}: {
    icon?: React.ElementType;
    title: string;
    description?: string;
    action?: React.ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-16 text-center',
                className,
            )}
        >
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold">{title}</h3>
            {description ? <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p> : null}
            {action ? <div className="mt-5">{action}</div> : null}
        </div>
    );
}

export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn('animate-pulse rounded-md bg-muted', className)} {...props} />;
}
