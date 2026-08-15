import React, { useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { NotebookPen, Check, X, MessageSquareText, Clock, Eye, FileText } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge } from '@/components/status-badge';
import { SafeHtml } from '@/components/safe-html';
import { relativeTime } from '@/components/content-row-card';
import { Button } from '@/components/ui/button';
import { Textarea, Label, FieldError } from '@/components/ui/field';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/feedback';
import { Breadcrumbs } from '@/components/ui/breadcrumb';
import { cn } from '@/lib/utils';

interface ReviewItem {
    id: number;
    title: string;
    slug: string;
    status?: string;
    excerpt?: string | null;
    body?: string | null;
    waiting_hours?: number;
    author?: { id: number; name: string } | null;
    category?: { id: number; name: string } | null;
    updated_at?: string;
    thumbnail?: { id: number; url: string } | null;
    featured_image?: { id: number; url: string } | null;
}

interface DecidedItem {
    id: number;
    title: string;
    status?: string;
    reviewed_at?: string;
    reviewer?: { id: number; name: string } | null;
    latest_approval?: { action?: string; action_label?: string; reviewer?: { id: number; name: string } | null } | null;
}

interface PaginatorData {
    data: ReviewItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    links: { url: string | null; label: string; active: boolean }[];
}

const actionLabel: Record<string, string> = {
    submitted: 'Dikirim ke review',
    approved: 'Disetujui',
    rejected: 'Ditolak',
    request_changes: 'Diminta revisi',
};

export default function ReviewIndex({
    queue,
    recentlyDecided,
}: {
    queue: PaginatorData;
    recentlyDecided: DecidedItem[];
}) {
    const [reviewing, setReviewing] = useState<ReviewItem | null>(null);
    const [dialog, setDialog] = useState<'approve' | 'request' | 'reject' | 'preview' | null>(null);

    const items = queue.data ?? [];
    const oldestWait = items.reduce((max, i) => Math.max(max, i.waiting_hours ?? 0), 0);

    const openDialog = (item: ReviewItem, mode: 'approve' | 'request' | 'reject' | 'preview') => {
        setReviewing(item);
        setDialog(mode);
    };

    return (
        <>
            <Head title="Review" />
            <PageHeader
                eyebrow="Editorial"
                title="Antrean Review"
                description="Tinjau, setujui, atau minta revisi konten yang dikirim author."
            />
            <Breadcrumbs items={[{ label: 'Review' }]} className="mb-4" />

            {items.length > 0 && (
                <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
                    <div className="flex items-center gap-2">
                        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-warning/10 text-warning">
                            <NotebookPen className="h-4 w-4" />
                        </span>
                        <div>
                            <p className="text-sm font-semibold">{items.length} artikel menunggu</p>
                            <p className="text-xs text-muted-foreground">
                                Tertua menunggu{' '}
                                {oldestWait >= 48 ? `${Math.round(oldestWait / 24)} hari` : `${oldestWait} jam`}
                            </p>
                        </div>
                    </div>
                    {oldestWait >= 48 ? (
                        <span className="rounded-full bg-destructive/10 px-2.5 py-1 text-xs font-semibold text-destructive">
                            Ada artikel sudah lama menunggu — prioritaskan
                        </span>
                    ) : null}
                </div>
            )}

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {items.length === 0 ? (
                    <EmptyState
                        icon={NotebookPen}
                        title="Tidak ada antrean"
                        description="Tidak ada konten yang menunggu review saat ini."
                    />
                ) : (
                    <>
                        <div className="grid gap-3 p-4 md:hidden">
                            {items.map((item) => (
                                <ReviewCard
                                    key={item.id}
                                    item={item}
                                    onPreview={() => openDialog(item, 'preview')}
                                    onApprove={() => openDialog(item, 'approve')}
                                    onRequest={() => openDialog(item, 'request')}
                                    onReject={() => openDialog(item, 'reject')}
                                />
                            ))}
                        </div>

                        <div className="hidden overflow-x-auto md:block">
                            <table className="w-full text-sm" role="grid">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th scope="col" className="px-4 py-3 font-semibold">
                                            Judul
                                        </th>
                                        <th scope="col" className="px-4 py-3 font-semibold">
                                            Kategori
                                        </th>
                                        <th scope="col" className="px-4 py-3 font-semibold">
                                            Penulis
                                        </th>
                                        <th scope="col" className="px-4 py-3 font-semibold">
                                            Menunggu
                                        </th>
                                        <th scope="col" className="px-4 py-3 text-right font-semibold">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-border transition-colors hover:bg-muted/30"
                                        >
                                            <td className="max-w-[360px] px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    {item.thumbnail?.url ? (
                                                        <img
                                                            src={item.thumbnail.url}
                                                            alt=""
                                                            loading="lazy"
                                                            className="h-11 w-11 shrink-0 rounded-md object-cover"
                                                        />
                                                    ) : null}
                                                    <div className="min-w-0">
                                                        <button
                                                            type="button"
                                                            onClick={() => openDialog(item, 'preview')}
                                                            className="block w-full text-left font-medium hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                                        >
                                                            {item.title}
                                                        </button>
                                                        {item.excerpt ? (
                                                            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                                                {item.excerpt}
                                                            </p>
                                                        ) : null}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.category?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3 text-muted-foreground">
                                                {item.author?.name ?? '—'}
                                            </td>
                                            <td className="px-4 py-3">
                                                <WaitBadge
                                                    hours={item.waiting_hours ?? 0}
                                                    updatedAt={item.updated_at}
                                                />
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1.5">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => openDialog(item, 'preview')}
                                                    >
                                                        <Eye className="h-4 w-4" /> Pratinjau
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="text-success hover:text-success"
                                                        onClick={() => openDialog(item, 'request')}
                                                    >
                                                        <MessageSquareText className="h-4 w-4" /> Minta Revisi
                                                    </Button>
                                                    <Button
                                                        variant="default"
                                                        size="sm"
                                                        onClick={() => openDialog(item, 'approve')}
                                                    >
                                                        <Check className="h-4 w-4" /> Setujui
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() => openDialog(item, 'reject')}
                                                    >
                                                        <X className="h-4 w-4" /> Tolak
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            <Pagination data={queue} />

            {recentlyDecided.length > 0 ? (
                <div className="mt-8">
                    <PageHeader eyebrow="Ringkasan" title="Keputusan Terbaru" className="mb-4 pb-3" />
                    <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-sm">
                        {recentlyDecided.map((c) => (
                            <li key={c.id} className="flex flex-wrap items-center gap-2 px-4 py-3">
                                <span
                                    className="flex h-2 w-2 shrink-0 rounded-full bg-muted-foreground/50"
                                    aria-hidden
                                />
                                <span className="min-w-0 flex-1 font-medium">{c.title}</span>
                                <span className="text-xs text-muted-foreground">
                                    {c.latest_approval?.action_label ??
                                        actionLabel[c.latest_approval?.action ?? ''] ??
                                        'Diputuskan'}
                                    {c.reviewer?.name ? ` oleh ${c.reviewer.name}` : ''}
                                </span>
                                <StatusBadge status={c.status ?? ''} />
                                <span className="text-xs text-muted-foreground/70">{relativeTime(c.reviewed_at)}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            <ReviewActionDialogImpl item={reviewing} mode={dialog} onClose={() => setDialog(null)} />
        </>
    );
}

function ReviewCard({
    item,
    onPreview,
    onApprove,
    onRequest,
    onReject,
}: {
    item: ReviewItem;
    onPreview: () => void;
    onApprove: () => void;
    onRequest: () => void;
    onReject: () => void;
}) {
    return (
        <article className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <button type="button" onClick={onPreview} className="flex w-full gap-3 p-4 text-left focus:outline-none">
                {item.thumbnail?.url ? (
                    <img
                        src={item.thumbnail.url}
                        alt=""
                        loading="lazy"
                        className="h-16 w-16 shrink-0 rounded-lg object-cover"
                    />
                ) : (
                    <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-muted">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                    </span>
                )}
                <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-base font-semibold leading-snug">{item.title}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">
                        {item.category?.name ?? 'Tanpa kategori'} · {item.author?.name ?? 'Tanpa penulis'}
                    </p>
                    {item.excerpt ? (
                        <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.excerpt}</p>
                    ) : null}
                    <div className="mt-2">
                        <WaitBadge hours={item.waiting_hours ?? 0} updatedAt={item.updated_at} />
                    </div>
                </div>
            </button>
            <div className="grid grid-cols-2 gap-2 border-t border-border p-3">
                <Button variant="outline" size="sm" className="text-success hover:text-success" onClick={onRequest}>
                    <MessageSquareText className="h-4 w-4" /> Revisi
                </Button>
                <Button variant="default" size="sm" onClick={onApprove}>
                    <Check className="h-4 w-4" /> Setujui
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onReject}
                    className="text-destructive hover:text-destructive col-span-2"
                >
                    <X className="h-4 w-4" /> Tolak
                </Button>
            </div>
        </article>
    );
}

function WaitBadge({ hours, updatedAt }: { hours: number; updatedAt?: string }) {
    const overdue = hours >= 48;
    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
                overdue ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground',
            )}
        >
            <Clock className="h-3 w-3" aria-hidden />
            {overdue
                ? `menunggu ${Math.round(hours / 24)} hari (terlambat)`
                : hours < 1
                  ? 'baru masuk'
                  : `menunggu ${hours} jam`}
            {hours < 24 && updatedAt ? (
                <span className="text-muted-foreground/60">· {relativeTime(updatedAt)}</span>
            ) : null}
        </span>
    );
}

function ReviewPreviewDialog({ item, open, onClose }: { item: ReviewItem | null; open: boolean; onClose: () => void }) {
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{item?.title}</DialogTitle>
                    <DialogDescription>
                        {item?.category?.name} · {item?.author?.name}
                    </DialogDescription>
                </DialogHeader>
                {item?.excerpt ? <p className="text-sm text-muted-foreground">{item.excerpt}</p> : null}
                <div className="rounded-lg border border-border p-4">
                    <SafeHtml html={item?.body} className="prose-slim text-sm" />
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ReviewActionDialogImpl({
    item,
    mode,
    onClose,
}: {
    item: ReviewItem | null;
    mode: 'approve' | 'request' | 'reject' | 'preview' | null;
    onClose: () => void;
}) {
    const form = useForm({ notes: '' });
    const open = mode === 'approve' || mode === 'request' || mode === 'reject';
    const isApprove = mode === 'approve';
    const isRequest = mode === 'request';
    const url = item
        ? isApprove
            ? `/contents/${item.id}/approve`
            : isRequest
              ? `/contents/${item.id}/request-changes`
              : `/contents/${item.id}/reject`
        : null;

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!url) return;
        form.post(url, {
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    };

    return (
        <>
            <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>
                            {isApprove ? `Setujui: ${item?.title ?? ''}` : isRequest ? 'Minta Revisi' : 'Tolak Konten'}
                        </DialogTitle>
                        <DialogDescription>
                            {isApprove
                                ? 'Artikel akan dipindah ke status Disetujui dan siap terbit.'
                                : isRequest
                                  ? 'Konten dikembalikan ke draft dengan catatan revisi untuk author.'
                                  : 'Konten dikembalikan ke draft. Catatan bersifat opsional.'}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="mt-2 space-y-4">
                        {isApprove ? (
                            <div className="rounded-lg border border-success/20 bg-success/5 p-3 text-sm">
                                Artikel akan tersedia untuk publikasi. Anda tetap dapat membatalkan melalui Tarik
                                Publikasi.
                            </div>
                        ) : (
                            <div>
                                <Label htmlFor="review-notes">Catatan {isRequest ? '(required)' : '(opsional)'}</Label>
                                <Textarea
                                    id="review-notes"
                                    value={form.data.notes}
                                    onChange={(e) => form.setData('notes', e.target.value)}
                                    rows={3}
                                    placeholder={isRequest ? 'Sebutkan bagian yang perlu direvisi' : 'Berikan masukan'}
                                />
                                <FieldError error={form.errors.notes} />
                            </div>
                        )}
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={onClose}>
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                variant={isApprove ? 'default' : isRequest ? 'secondary' : 'outline'}
                                disabled={form.processing || (isRequest && !form.data.notes.trim())}
                            >
                                {isApprove ? 'Setujui' : isRequest ? 'Kirim Revisi' : 'Tolak'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
            <ReviewPreviewDialog item={item} open={mode === 'preview'} onClose={onClose} />
        </>
    );
}
