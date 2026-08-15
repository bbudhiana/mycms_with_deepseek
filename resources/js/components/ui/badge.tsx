import * as React from 'react';
import { cn } from '@/lib/utils';

const toneClasses: Record<string, string> = {
    draft: 'bg-draft/10 text-draft',
    review: 'bg-review/10 text-review',
    approved: 'bg-approved/10 text-approved',
    published: 'bg-published/10 text-published',
    archived: 'bg-archived/10 text-archived',
    default: 'bg-muted text-muted-foreground',
    destructive: 'bg-destructive/10 text-destructive',
    success: 'bg-success/10 text-success',
    warning: 'bg-warning/10 text-warning',
};

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    tone?: keyof typeof toneClasses;
}

export function Badge({ className, tone = 'default', ...props }: BadgeProps) {
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors duration-200',
                toneClasses[tone],
                tone !== 'default' && className?.includes('border') ? '' : 'border-transparent',
                className,
            )}
            {...props}
        />
    );
}
