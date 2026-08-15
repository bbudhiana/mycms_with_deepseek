import * as React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginator {
    current_page: number;
    last_page: number;
    links: PaginationLink[];
    total: number;
    from: number | null;
    to: number | null;
    per_page: number;
}

export function Pagination({ data }: { data: Paginator }) {
    if (!data || data.last_page <= 1) {
        return null;
    }

    const prev = data.links.find((l) => l.label.includes('Previous'));
    const next = data.links.find((l) => l.label.includes('Next'));

    return (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Pagination">
            <p className="text-muted-foreground">
                Menampilkan <span className="font-medium text-foreground">{data.from ?? 0}</span>–
                <span className="font-medium text-foreground">{data.to ?? 0}</span> dari {data.total}
            </p>

            <div className="flex items-center gap-1">
                <PageLink href={prev?.url} disabled={!prev?.url} label="Previous">
                    <ChevronLeft className="h-4 w-4" />
                </PageLink>

                {data.links
                    .filter((l) => !l.label.includes('Previous') && !l.label.includes('Next'))
                    .map((link, i) => (
                        <PageLink key={i} href={link.url} active={link.active} label={link.label}>
                            {link.label.replace(/[^\d]/g, '') || '…'}
                        </PageLink>
                    ))}

                <PageLink href={next?.url} disabled={!next?.url} label="Next">
                    <ChevronRight className="h-4 w-4" />
                </PageLink>
            </div>
        </nav>
    );
}

function PageLink({
    href,
    disabled,
    active,
    label,
    children,
}: {
    href?: string | null;
    disabled?: boolean;
    active?: boolean;
    label?: string;
    children: React.ReactNode;
}) {
    const cls = cn(
        'inline-flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors',
        active ? 'bg-foreground text-background' : 'text-foreground hover:bg-muted',
        disabled && 'pointer-events-none opacity-40',
    );

    if (!href || disabled) {
        return (
            <span aria-label={label} className={cls}>
                {children}
            </span>
        );
    }

    return (
        <a href={href} aria-label={label} className={cls}>
            {children}
        </a>
    );
}
