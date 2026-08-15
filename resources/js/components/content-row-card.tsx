import React from 'react';
import { Pencil, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/status-badge';

export interface ContentRowCardProps {
    item: {
        id: number;
        title: string;
        status: string;
        category?: { id: number; name: string } | null;
        author?: { id: number; name: string } | null;
        updated_at?: string;
        published_at?: string | null;
        published_today?: boolean;
        has_pending_schedule?: boolean;
        breaking_news_flag?: boolean;
        editor_pick_flag?: boolean;
        thumbnail?: { id: number; url: string } | null;
        featured_image?: { id: number; url: string } | null;
    };
    onOpen: () => void;
    onDelete: () => void;
    canDelete?: boolean;
}

export function relativeTime(dateStr?: string | null): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';

    const diffMs = Date.now() - d.getTime();
    const diffMin = Math.round(diffMs / 60000);
    if (diffMin < 1) return 'baru saja';
    if (diffMin < 60) return `${diffMin} mnt lalu`;
    if (diffMin < 1440) return `${Math.round(diffMin / 60)} jam lalu`;
    const diffDay = Math.round(diffMin / 1440);
    if (diffDay < 7) return `${diffDay} hari lalu`;

    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function ContentRowCard({ item, onOpen, onDelete, canDelete = false }: ContentRowCardProps) {
    const thumbUrl = item.thumbnail?.url ?? item.featured_image?.url ?? null;

    return (
        <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-shadow duration-200 hover:shadow-md">
            <div className="flex gap-3 p-3">
                <button
                    type="button"
                    onClick={onOpen}
                    aria-label={`Buka ${item.title}`}
                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
                >
                    {thumbUrl ? (
                        <img
                            src={thumbUrl}
                            alt=""
                            loading="lazy"
                            className="h-16 w-16 shrink-0 rounded-lg object-cover"
                        />
                    ) : (
                        <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                            <FileText className="h-5 w-5 text-muted-foreground" />
                        </span>
                    )}
                </button>

                <div className="min-w-0 flex-1">
                    <button type="button" onClick={onOpen} className="block w-full text-left focus:outline-none">
                        <p className="truncate font-display text-base font-semibold leading-snug group-hover:text-accent transition-colors">
                            {item.title}
                        </p>
                    </button>

                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        {(item.breaking_news_flag || item.editor_pick_flag) && (
                            <span className="flex flex-wrap gap-1.5">
                                {item.breaking_news_flag ? (
                                    <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                                        Breaking
                                    </span>
                                ) : null}
                                {item.editor_pick_flag ? (
                                    <span className="rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-accent">
                                        Pilihan Editor
                                    </span>
                                ) : null}
                            </span>
                        )}
                        {item.published_today ? (
                            <span className="rounded bg-success/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-success">
                                Terbit hari ini
                            </span>
                        ) : null}
                        {item.has_pending_schedule ? (
                            <span className="rounded bg-warning/10 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                                Terjadwal
                            </span>
                        ) : null}
                    </div>

                    <p className="mt-1 truncate text-xs text-muted-foreground">
                        {item.category?.name ?? 'Tanpa kategori'}
                        {item.author?.name ? ` · ${item.author.name}` : ''}
                        <span className="text-muted-foreground/70"> · {relativeTime(item.updated_at)}</span>
                    </p>
                </div>

                <div className="flex flex-col items-end justify-between gap-1">
                    <StatusBadge status={item.status} announce={false} />
                    <div className="flex items-center gap-0.5">
                        <Button
                            type="button"
                            variant="ghost"
                            size="iconSm"
                            onClick={onOpen}
                            aria-label={`Edit ${item.title}`}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        {canDelete ? (
                            <Button
                                type="button"
                                variant="ghost"
                                size="iconSm"
                                className="text-destructive hover:text-destructive"
                                onClick={onDelete}
                                aria-label={`Hapus ${item.title}`}
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                        ) : null}
                    </div>
                </div>
            </div>
        </article>
    );
}
