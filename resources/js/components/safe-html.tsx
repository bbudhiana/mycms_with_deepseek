import React from 'react';
import { cn } from '@/lib/utils';

/**
 * Renders HTML that has already been sanitized server-side with HTMLPurifier.
 */
export function SafeHtml({ html, className }: { html?: string | null; className?: string }) {
    if (!html) {
        return null;
    }

    return (
        <div
            className={cn('prose-slim [&_a]:text-accent [&_a]:underline', className)}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    );
}
