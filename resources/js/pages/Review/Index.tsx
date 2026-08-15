import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { NotebookPen, Check, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge, formatDate } from '@/components/status-badge';
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
import { useForm } from '@inertiajs/react';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/feedback';

interface ReviewItem {
    id: number;
    title: string;
    slug: string;
    status?: string;
    excerpt?: string | null;
    author?: { id: number; name: string } | null;
    category?: { id: number; name: string } | null;
    updated_at?: string;
}

export default function ReviewIndex({ queue, recentlyDecided }: { queue: any; recentlyDecided: ReviewItem[] }) {
    const [reviewing, setReviewing] = useState<ReviewItem | null>(null);
    const [dialog, setDialog] = useState<'approve' | 'reject' | null>(null);

    const approve = (item: ReviewItem) => {
        router.post(`/contents/${item.id}/approve`, {}, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Review" />
            <PageHeader
                eyebrow="Editorial"
                title="Antrean Review"
                description="Tinjau, setujui, atau minta revisi konten yang dikirim author."
            />

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {queue.data.length === 0 ? (
                    <EmptyState
                        icon={NotebookPen}
                        title="Tidak ada antrean"
                        description="Tidak ada konten yang menunggu review saat ini."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3 font-semibold">Judul</th>
                                    <th className="px-4 py-3 font-semibold">Kategori</th>
                                    <th className="px-4 py-3 font-semibold">Penulis</th>
                                    <th className="px-4 py-3 font-semibold">Dikirim</th>
                                    <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {queue.data.map((item: ReviewItem) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-border transition-colors hover:bg-muted/30"
                                    >
                                        <td className="max-w-[320px] px-4 py-3">
                                            <p className="font-medium">{item.title}</p>
                                            {item.excerpt ? (
                                                <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                                    {item.excerpt}
                                                </p>
                                            ) : null}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {item.category?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.author?.name ?? '—'}</td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {formatDate(item.updated_at)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1.5">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => router.visit(`/contents/${item.id}`)}
                                                >
                                                    Lihat
                                                </Button>
                                                <Button variant="outline" size="sm" onClick={() => approve(item)}>
                                                    <Check className="h-4 w-4 text-success" /> Setujui
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setReviewing(item);
                                                        setDialog('reject');
                                                    }}
                                                >
                                                    <X className="h-4 w-4 text-destructive" /> Tolak
                                                </Button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Pagination data={queue} />

            {recentlyDecided.length > 0 ? (
                <div className="mt-8">
                    <PageHeader eyebrow="Ringkasan" title="Keputusan Terbaru" className="mb-4 pb-3" />
                    <ul className="divide-y divide-border rounded-xl border border-border bg-card shadow-sm">
                        {recentlyDecided.map((c) => (
                            <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3">
                                <p className="font-medium">{c.title}</p>
                                <StatusBadge status={c.status ?? ''} />
                            </li>
                        ))}
                    </ul>
                </div>
            ) : null}

            <ReviewRejectDialog item={reviewing} open={dialog === 'reject'} onClose={() => setDialog(null)} />
        </>
    );
}

function ReviewRejectDialog({ item, open, onClose }: { item: ReviewItem | null; open: boolean; onClose: () => void }) {
    const form = useForm({ notes: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!item) return;
        form.post(`/contents/${item.id}/reject`, {
            onSuccess: () => {
                form.reset();
                onClose();
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Tolak Konten</DialogTitle>
                    <DialogDescription>Konten akan dikembalikan ke draft. Catatan bersifat opsional.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="mt-2 space-y-4">
                    <div>
                        <Label htmlFor="notes">Catatan (opsional)</Label>
                        <Textarea
                            id="notes"
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            rows={3}
                            placeholder="Berikan masukan"
                        />
                        <FieldError error={form.errors.notes} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" variant="outline" disabled={form.processing}>
                            Tolak
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
