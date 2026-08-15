import React from 'react';
import { router } from '@inertiajs/react';
import { CalendarClock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface UpcomingItem {
    id: number;
    content_id: number;
    scheduled_at?: string;
    status?: string;
    content?: { id: number; title: string; status?: string } | null;
}

function formatRelative(dateStr?: string): string {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return '—';

    const diffMin = Math.round((d.getTime() - Date.now()) / 60000);
    if (diffMin < 0) return 'sudah lewat';
    if (diffMin < 60) return `dalam ${diffMin} mnt`;
    if (diffMin < 1440) return `dalam ${Math.round(diffMin / 60)} jam`;
    return `dalam ${Math.round(diffMin / 1440)} hari`;
}

export function UpcomingPublications({ items }: { items: UpcomingItem[] }) {
    if (!items || items.length === 0) {
        return <p className="py-6 text-center text-sm text-muted-foreground">Tidak ada publikasi terjadwal.</p>;
    }

    return (
        <ul className="space-y-2">
            {items.map((item) => (
                <li key={item.id}>
                    <Button
                        variant="ghost"
                        onClick={() => router.visit(`/contents/${item.content_id}`)}
                        className="w-full items-center gap-3 rounded-lg border border-border bg-card p-3 text-left justify-start hover:bg-muted/40 hover:border-primary/30"
                    >
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-muted">
                            <CalendarClock className="h-4 w-4 text-muted-foreground" />
                        </span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">
                                {item.content?.title ?? `Konten #${item.content_id}`}
                            </span>
                            <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                {item.scheduled_at
                                    ? new Date(item.scheduled_at).toLocaleString('id-ID', {
                                          day: 'numeric',
                                          month: 'short',
                                          hour: '2-digit',
                                          minute: '2-digit',
                                      })
                                    : '—'}
                            </span>
                        </span>
                        <span
                            className={cn(
                                'shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold',
                                isUrgent(item.scheduled_at)
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground',
                            )}
                        >
                            {formatRelative(item.scheduled_at)}
                        </span>
                    </Button>
                </li>
            ))}
        </ul>
    );
}

function isUrgent(dateStr?: string): boolean {
    if (!dateStr) return false;
    const diffMin = (new Date(dateStr).getTime() - Date.now()) / 60000;
    return diffMin >= 0 && diffMin < 180;
}
