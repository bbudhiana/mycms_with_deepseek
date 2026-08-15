import * as React from 'react';
import { cn } from '@/lib/utils';

const toneClasses: Record<string, string> = {
    draft: 'bg-[#e2e8f0] text-[#475569]',
    review: 'bg-[#fef3c7] text-[#92400e]',
    approved: 'bg-[#dbeafe] text-[#1e40af]',
    published: 'bg-[#dcfce7] text-[#166534]',
    archived: 'bg-[#e2e8f0] text-[#475569]',
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
                'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors',
                toneClasses[tone],
                tone !== 'default' && className?.includes('border') ? '' : 'border-transparent',
                className,
            )}
            {...props}
        />
    );
}
