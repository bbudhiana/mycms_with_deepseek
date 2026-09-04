import * as React from 'react';
import { router } from '@inertiajs/react';
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
    prev_page_url: string | null;
    next_page_url: string | null;
    total: number;
    from: number | null;
    to: number | null;
    per_page: number;
}

export function Pagination({ data }: { data: Paginator }) {
    if (!data) {
        return null;
    }

    if (data.last_page <= 1) {
        return (
            <p className="mt-6 text-sm text-muted-foreground">
                Menampilkan {data.total} data.
            </p>
        );
    }

    const go = (url: string | null) => {
        if (!url) return;
        router.visit(url, { preserveScroll: true });
    };

    const prev = data.prev_page_url;
    const next = data.next_page_url;

    return (
        <nav className="mt-6 flex items-center justify-between text-sm" aria-label="Pagination">
            <p className="text-muted-foreground">
                Menampilkan <span className="font-medium text-foreground">{data.from ?? 0}</span>–
                <span className="font-medium text-foreground">{data.to ?? 0}</span> dari {data.total}
            </p>

            <div className="flex items-center gap-1">
                <button
                    type="button"
                    onClick={() => go(prev)}
                    disabled={!prev}
                    aria-label="Halaman sebelumnya"
                    className={cn(
                        'inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors duration-200',
                        prev
                            ? 'text-foreground hover:bg-muted cursor-pointer'
                            : 'text-muted-foreground cursor-not-allowed pointer-events-none',
                    )}
                >
                    <ChevronLeft className="h-4 w-4" />
                </button>

                {data.links
                    .filter((l) => !l.label.includes('Previous') && !l.label.includes('Next'))
                    .map((link, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => go(link.url)}
                            aria-label={`Halaman ${link.label}`}
                            aria-current={link.active ? 'page' : undefined}
                            className={cn(
                                'inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors duration-200',
                                link.active
                                    ? 'bg-foreground text-background cursor-default'
                                    : 'text-foreground hover:bg-muted cursor-pointer',
                            )}
                        >
                            {link.label.replace(/[^\d]/g, '') || '…'}
                        </button>
                    ))}

                <button
                    type="button"
                    onClick={() => go(next)}
                    disabled={!next}
                    aria-label="Halaman selanjutnya"
                    className={cn(
                        'inline-flex h-10 min-w-10 items-center justify-center rounded-md px-3 text-sm font-medium transition-colors duration-200',
                        next
                            ? 'text-foreground hover:bg-muted cursor-pointer'
                            : 'text-muted-foreground cursor-not-allowed pointer-events-none',
                    )}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </nav>
    );
}
