import React from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { CalendarClock, Play, Plus, Pencil, Trash2, FileText, Tag as TagIcon, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/feedback';
import { Switch } from '@/components/ui/controls';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/field';
import { Textarea } from '@/components/ui/field';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { formatDate } from '@/components/status-badge';
import { cn } from '@/lib/utils';

interface Schedule {
    id: number;
    name: string;
    is_active: boolean;
    type: 'daily' | 'weekly';
    day_of_week: number | null;
    tone: string;
    topic_direction: string;
    language: string;
    publish_time: string;
    content_count: number;
    auto_publish: boolean;
    status: string;
    last_run_at: string | null;
    last_error: string | null;
    generated_contents_count: number;
    author: { id: number; name: string } | null;
    author_id: number | null;
    category_id: number | null;
    category?: { id: number; name: string } | null;
    tags?: number[];
}

interface Option {
    value: string;
    label: string;
}

interface Author {
    id: number;
    name: string;
}

interface TaxonomyItem {
    id: number;
    name: string;
}

const statusTone: Record<string, 'success' | 'warning' | 'destructive' | 'default'> = {
    idle: 'default',
    running: 'warning',
    ok: 'success',
    failed: 'destructive',
};

const dayNames = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

const emptyForm = {
    name: '',
    author_id: null as number | null,
    is_active: true,
    type: 'daily' as 'daily' | 'weekly',
    day_of_week: null as number | null,
    tone: 'editorial',
    topic_direction: '',
    category_id: null as number | null,
    tags: [] as number[],
    language: 'id',
    publish_time: '08:00',
    content_count: 1,
    auto_publish: false,
};

export default function AiSchedulesPage({
    schedules,
    authors,
    categories,
    tags,
    options,
}: {
    schedules: Schedule[];
    authors: Author[];
    categories: TaxonomyItem[];
    tags: TaxonomyItem[];
    options: { types: Option[]; tones: Option[] };
}) {
    const { confirm, dialog } = useConfirmDialog();
    const [editing, setEditing] = React.useState<Schedule | null>(null);
    const [open, setOpen] = React.useState(false);
    const { data, setData, post, patch, errors, processing, reset } = useForm(emptyForm);

    const toggleTag = (id: number) => {
        setData('tags', data.tags.includes(id) ? data.tags.filter((t) => t !== id) : [...data.tags, id]);
    };

    const openCreate = () => {
        setEditing(null);
        reset();
        setData(emptyForm);
        setOpen(true);
    };

    const openEdit = (s: Schedule) => {
        setEditing(s);
        setData({
            name: s.name,
            author_id: s.author_id,
            is_active: s.is_active,
            type: s.type,
            day_of_week: s.day_of_week,
            tone: s.tone,
            topic_direction: s.topic_direction,
            category_id: s.category_id,
            tags: s.tags ?? [],
            language: s.language,
            publish_time: s.publish_time,
            content_count: s.content_count,
            auto_publish: s.auto_publish,
        });
        setOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            patch(`/ai/schedules/${editing.id}`, { onSuccess: () => setOpen(false) });
        } else {
            post('/ai/schedules', { onSuccess: () => setOpen(false) });
        }
    };

    const confirmDelete = (s: Schedule) => {
        confirm({
            title: `Hapus jadwal "${s.name}"?`,
            description: 'Riwayat autopilot dari jadwal ini ikut terhapus.',
            confirmLabel: 'Hapus',
            confirmVariant: 'destructive',
            onConfirm: () => router.delete(`/ai/schedules/${s.id}`),
        });
    };

    const runNow = (s: Schedule) => {
        router.post(`/ai/schedules/${s.id}/run`);
    };

    return (
        <>
            <Head title="Jadwal Otomasi AI" />
            <PageHeader
                eyebrow="Integrasi AI"
                title="Jadwal Otomasi AI"
                description="Beberapa jadwal sekaligus — masing-masing dengan nada, arah topik, dan bahasa sendiri. AI menulis pada jam yang Anda pilih."
                actions={
                    <Button onClick={openCreate}>
                        <Plus className="h-4 w-4" /> Buat Jadwal
                    </Button>
                }
            />

            {schedules.length === 0 ? (
                <EmptyState
                    icon={CalendarClock}
                    title="Belum ada jadwal"
                    description="Buat jadwal otomasi pertama untuk mulai menghasilkan konten dengan AI."
                    action={
                        <Button onClick={openCreate}>
                            <Plus className="h-4 w-4" /> Buat Jadwal
                        </Button>
                    }
                />
            ) : (
                <div className="space-y-3">
                    {schedules.map((s) => {
                        const scheduleTags = (s.tags ?? [])
                            .map((id) => tags.find((t) => t.id === id)?.name)
                            .filter((name): name is string => Boolean(name));

                        return (
                            <div key={s.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                    <div className="min-w-0">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <h3 className="font-display text-base font-semibold">{s.name}</h3>
                                            <Badge tone={statusTone[s.status] ?? 'default'}>
                                                {s.status === 'idle' && 'Idle'}
                                                {s.status === 'running' && 'Sedang Berjalan'}
                                                {s.status === 'ok' && 'Berhasil'}
                                                {s.status === 'failed' && 'Gagal'}
                                            </Badge>
                                            {!s.is_active && <Badge tone="default">Nonaktif</Badge>}
                                        </div>
                                        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">{s.topic_direction}</p>
                                        <p className="mt-2 text-xs text-muted-foreground">
                                            {s.type === 'weekly' && s.day_of_week
                                                ? `Mingguan · ${dayNames[s.day_of_week - 1]} · `
                                                : 'Harian · '}
                                            {s.publish_time} WIB · Nada {s.tone} · {s.language} · {s.content_count}{' '}
                                            konten/siklus · {s.auto_publish ? 'auto-terbit' : 'draft'}
                                            {s.author ? ` · Pemilik: ${s.author.name}` : ''}
                                            {s.last_run_at ? ` · Terakhir: ${formatDate(s.last_run_at)}` : ''}
                                        </p>
                                        {(s.category || scheduleTags.length > 0) && (
                                            <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs">
                                                <span className="text-muted-foreground">Target:</span>
                                                {s.category && (
                                                    <Badge tone="primary" className="font-normal">
                                                        {s.category.name}
                                                    </Badge>
                                                )}
                                                {scheduleTags.map((name) => (
                                                    <Badge key={name} tone="default" className="font-normal">
                                                        {name}
                                                    </Badge>
                                                ))}
                                            </div>
                                        )}
                                        {s.last_error && (
                                            <p className="mt-1 text-xs text-destructive">{s.last_error}</p>
                                        )}
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                        <Button size="sm" variant="outline" onClick={() => runNow(s)} disabled={s.status === 'running'}>
                                            <Play className="h-4 w-4" /> Jalankan Sekarang
                                        </Button>
                                        <Button size="sm" variant="ghost" onClick={() => openEdit(s)}>
                                            <Pencil className="h-4 w-4" /> Ubah
                                        </Button>
                                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => confirmDelete(s)}>
                                            <Trash2 className="h-4 w-4" /> Hapus
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Ubah Jadwal' : 'Buat Jadwal'}</DialogTitle>
                        <DialogDescription>
                            {editing
                                ? 'Perbarui parameter jadwal autopilot.'
                                : 'Jadwal nonaktif tetap tersimpan tapi tidak berjalan otomatis.'}
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={submit} className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nama Jadwal</Label>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                            <FieldError error={errors.name} />
                        </div>

                        <div>
                            <Label>Pemilik Konten</Label>
                            <Select
                                value={data.author_id?.toString() ?? ''}
                                onValueChange={(v) => setData('author_id', v === '' ? null : parseInt(v))}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Pilih author (default: Super Admin)" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="">Super Admin (default)</SelectItem>
                                    {authors.map((a) => (
                                        <SelectItem key={a.id} value={a.id.toString()}>
                                            {a.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <p className="mt-1 text-xs text-muted-foreground">
                                Konten yang dihasilkan AI otomatis menjadi milik author terpilih.
                            </p>
                            <FieldError error={errors.author_id} />
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div>
                                <p className="text-sm font-medium">Aktif</p>
                                <p className="text-xs text-muted-foreground">
                                    Jadwal nonaktif tidak dijalankan otomatis.
                                </p>
                            </div>
                            <Switch checked={data.is_active} onCheckedChange={(v) => setData('is_active', v)} />
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label>Jenis Jadwal</Label>
                                <Select
                                    value={data.type}
                                    onValueChange={(v) => setData('type', v as 'daily' | 'weekly')}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.types.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError error={errors.type} />
                            </div>

                            {data.type === 'weekly' && (
                                <div>
                                    <Label>Hari</Label>
                                    <Select
                                        value={data.day_of_week?.toString() ?? ''}
                                        onValueChange={(v) => setData('day_of_week', parseInt(v))}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih hari" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {dayNames.map((d, i) => (
                                                <SelectItem key={i + 1} value={(i + 1).toString()}>
                                                    {d}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FieldError error={errors.day_of_week} />
                                </div>
                            )}

                            <div>
                                <Label>Nada</Label>
                                <Select value={data.tone} onValueChange={(v) => setData('tone', v)}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {options.tones.map((t) => (
                                            <SelectItem key={t.value} value={t.value}>
                                                {t.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError error={errors.tone} />
                            </div>

                            <div>
                                <Label htmlFor="publish_time">Jam Terbit</Label>
                                <Input
                                    id="publish_time"
                                    type="time"
                                    value={data.publish_time}
                                    onChange={(e) => setData('publish_time', e.target.value)}
                                />
                                <FieldError error={errors.publish_time} />
                            </div>

                            <div>
                                <Label htmlFor="language">Bahasa</Label>
                                <Input id="language" value={data.language} onChange={(e) => setData('language', e.target.value)} />
                                <FieldError error={errors.language} />
                            </div>

                            <div>
                                <Label htmlFor="content_count">Jumlah Konten Per Siklus</Label>
                                <Input
                                    id="content_count"
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={data.content_count}
                                    onChange={(e) => setData('content_count', parseInt(e.target.value) || 1)}
                                />
                                <FieldError error={errors.content_count} />
                            </div>
                        </div>

                        <div>
                            <Label htmlFor="topic_direction">Arah Topik</Label>
                            <Textarea
                                id="topic_direction"
                                rows={4}
                                value={data.topic_direction}
                                onChange={(e) => setData('topic_direction', e.target.value)}
                                placeholder="Petunjuk arah yang Anda berikan ke AI sebagai latar belakang tiap artikel."
                            />
                            <FieldError error={errors.topic_direction} />
                        </div>

                        <div className="space-y-4 border-t border-border pt-4">
                            <div>
                                <h3 className="text-sm font-semibold">Target Konten</h3>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Kategori dan tag yang dipakai otomatis untuk setiap artikel dari jadwal ini. Boleh
                                    kosong — AI lewati bila tidak dipilih.
                                </p>
                            </div>

                            <div>
                                <Label>Kategori Default</Label>
                                <Select
                                    value={data.category_id?.toString() ?? ''}
                                    onValueChange={(v) => setData('category_id', v === '' ? null : parseInt(v))}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Tanpa kategori default" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Tanpa kategori</SelectItem>
                                        {categories.map((c) => (
                                            <SelectItem key={c.id} value={c.id.toString()}>
                                                {c.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FieldError error={errors.category_id} />
                            </div>

                            <div>
                                <div className="mb-1.5 flex items-center justify-between">
                                    <Label htmlFor="schedule-tags">Tag Otomatis</Label>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">
                                            {data.tags.length} dipilih
                                        </span>
                                        {data.tags.length > 0 && (
                                            <Button
                                                id="schedule-tags"
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setData('tags', [])}
                                                className="h-7 px-2 text-xs"
                                            >
                                                <X className="h-3 w-3" /> Bersihkan
                                            </Button>
                                        )}
                                    </div>
                                </div>
                                {tags.length === 0 ? (
                                    <p className="rounded-md border border-dashed border-input bg-muted/30 px-3 py-4 text-center text-xs text-muted-foreground">
                                        Belum ada tag. Tambahkan tag di menu Tag terlebih dahulu.
                                    </p>
                                ) : (
                                    <div
                                        role="group"
                                        aria-labelledby="schedule-tags"
                                        className="flex max-h-40 flex-wrap gap-2 overflow-y-auto rounded-md border border-input bg-card p-2"
                                    >
                                        {tags.map((tag) => {
                                            const on = data.tags.includes(tag.id);
                                            return (
                                                <button
                                                    key={tag.id}
                                                    type="button"
                                                    onClick={() => toggleTag(tag.id)}
                                                    aria-pressed={on}
                                                    className={cn(
                                                        'inline-flex min-h-[44px] items-center justify-center rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                        on
                                                            ? 'border-primary bg-primary text-primary-foreground hover:bg-primary/90'
                                                            : 'border-input bg-card text-foreground hover:border-primary/40 hover:bg-muted',
                                                    )}
                                                >
                                                    {on && <TagIcon className="mr-1 h-3 w-3" aria-hidden />}
                                                    {tag.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                                <FieldError error={errors.tags} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between rounded-lg border border-border p-3">
                            <div>
                                <p className="text-sm font-medium">Auto Terbit</p>
                                <p className="text-xs text-muted-foreground">
                                    Terbitkan draf langsung alih-alih mengantre untuk review editor.
                                </p>
                            </div>
                            <Switch checked={data.auto_publish} onCheckedChange={(v) => setData('auto_publish', v)} />
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={processing}>
                                <FileText className="h-4 w-4" />
                                {processing ? 'Menyimpan...' : editing ? 'Simpan Perubahan' : 'Buat Jadwal'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog dialog={dialog} />
        </>
    );
}