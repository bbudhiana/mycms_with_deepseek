import React, { useMemo, useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    Save,
    Send,
    Check,
    X,
    Clock,
    ImagePlus,
    Sparkles,
    ArrowLeft,
    UploadCloud,
    CalendarClock,
    Archive,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge, formatDate } from '@/components/status-badge';
import { WorkflowStepper } from '@/components/workflow-stepper';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { MediaPicker } from '@/components/media-picker';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea, Label, FieldError } from '@/components/ui/field';
import { Switch } from '@/components/ui/controls';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { SectionCard } from '@/components/page-header';

interface Approval {
    id: number;
    action: string;
    action_label?: string;
    notes?: string | null;
    created_at?: string;
    reviewer?: { id: number; name: string } | null;
}

interface CmsContent {
    id: number;
    title: string;
    sub_title: string | null;
    slug: string;
    excerpt: string | null;
    body: string | null;
    featured_video: string | null;
    breaking_news_flag: boolean;
    editor_pick_flag: boolean;
    category_id: number | null;
    featured_image_id: number | null;
    thumbnail_id: number | null;
    image_caption: string | null;
    image_credit: string | null;
    status: string;
    author_id: number | null;
    published_at?: string | null;
    featured_image?: { id: number; url: string; original_name?: string } | null;
    thumbnail?: { id: number; url: string; original_name?: string } | null;
    tags: Array<{ id: number; name: string }>;
    approvals?: Approval[];
    has_pending_schedule?: boolean;
}

export default function ContentsEditor({
    content,
    cms,
}: {
    content: CmsContent | null;
    cms: {
        categories: Array<{ id: number; name: string; parent_id: number | null }>;
        tags: Array<{ id: number; name: string; slug: string }>;
    };
}) {
    const page = usePage();
    const me = page.props.auth?.user;
    const isCreate = !content;

    const [picker, setPicker] = useState<'featured' | 'thumbnail' | 'body' | null>(null);
    const [scheduleOpen, setScheduleOpen] = useState(false);
    const [rejectOpen, setRejectOpen] = useState(false);

    const form = useForm({
        title: content?.title ?? '',
        sub_title: content?.sub_title ?? '',
        slug: content?.slug ?? '',
        excerpt: content?.excerpt ?? '',
        body: content?.body ?? '',
        featured_video: content?.featured_video ?? '',
        breaking_news_flag: content?.breaking_news_flag ?? false,
        editor_pick_flag: content?.editor_pick_flag ?? false,
        category_id: content?.category_id ? String(content.category_id) : '',
        featured_image_id: content?.featured_image_id ?? null,
        thumbnail_id: content?.thumbnail_id ?? null,
        image_caption: content?.image_caption ?? '',
        image_credit: content?.image_credit ?? '',
        tags: content?.tags?.map((t) => t.id) ?? [],
    });

    const status = content?.status ?? 'draft';
    const editable = isCreate || status === 'draft';
    const meAuthor = !isCreate && content?.author_id === me?.id;

    const can = useMemo(() => {
        const perms = new Set(me?.permissions ?? []);
        const own = meAuthor;
        return {
            edit: editable && (perms.has('edit_any_content') || own),
            submit: status === 'draft' && own,
            reviewAction: status === 'review' && perms.has('approve_content') && !meAuthor,
            publish: status === 'approved' && perms.has('publish_content'),
            unpublish: status === 'published' && perms.has('publish_content'),
            archive: status === 'published' && perms.has('publish_content'),
            canUpload: perms.has('upload_media'),
        };
    }, [status, meAuthor, editable, me]);

    const save = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((data) => ({
            ...data,
            category_id: data.category_id ? Number(data.category_id) : null,
            tags: data.tags ?? [],
        }));
        if (isCreate) {
            form.post('/contents');
        } else {
            form.patch(`/contents/${content!.id}`);
        }
    };

    const action = (url: string) => {
        router.post(url, {}, { preserveScroll: true });
    };

    const toggleTag = (id: number) => {
        const exists = form.data.tags.includes(id);
        form.setData('tags', exists ? form.data.tags.filter((t) => t !== id) : [...form.data.tags, id]);
    };

    const flatCategories = useMemo(() => cms.categories.map((c) => ({ ...c, depth: 0 })), [cms.categories]);

    const metaTitleOk = form.data.title.trim().length > 10 && form.data.title.trim().length <= 60;
    const metaTitleCount = form.data.title.trim().length;
    const metaDesc = form.data.excerpt.trim().slice(0, 160);
    const metaDescOk = metaDesc.length >= 70 && metaDesc.length <= 160;

    return (
        <>
            <Head title={isCreate ? 'Konten Baru' : 'Edit Konten'} />

            <PageHeader
                eyebrow="Editorial"
                title={isCreate ? 'Konten Baru' : 'Edit Konten'}
                description="Tulis dan kelola artikel melalui alur editorial."
                actions={
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/contents">
                            <ArrowLeft className="h-4 w-4" /> Kembali
                        </Link>
                    </Button>
                }
            />

            <form onSubmit={save}>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <div className="lg:col-span-2 space-y-6">
                        <SectionCard
                            title={isCreate ? 'Tulis Artikel' : 'Editor Artikel'}
                            description="Isi utama konten Anda."
                        >
                            <Tabs defaultValue="write">
                                <TabsList>
                                    <TabsTrigger value="write">Tulis</TabsTrigger>
                                    <TabsTrigger value="ai" disabled>
                                        <Sparkles className="mr-1.5 h-3.5 w-3.5" /> AI Assist
                                    </TabsTrigger>
                                </TabsList>

                                <TabsContent value="write" className="space-y-4">
                                    <div>
                                        <Label htmlFor="title">Judul *</Label>
                                        <Input
                                            id="title"
                                            value={form.data.title}
                                            onChange={(e) => form.setData('title', e.target.value)}
                                            disabled={!editable}
                                            placeholder="Judul berita"
                                        />
                                        <FieldError error={form.errors.title} />
                                        <SeoBar ok={metaTitleOk} count={metaTitleCount} max={60} label="SEO judul" />
                                    </div>

                                    <div>
                                        <Label htmlFor="sub_title">Sub Judul</Label>
                                        <Input
                                            id="sub_title"
                                            value={form.data.sub_title}
                                            onChange={(e) => form.setData('sub_title', e.target.value)}
                                            disabled={!editable}
                                            placeholder="Sub judul (opsional)"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="slug">Slug</Label>
                                        <Input
                                            id="slug"
                                            value={form.data.slug}
                                            onChange={(e) => form.setData('slug', e.target.value)}
                                            disabled={!editable}
                                            placeholder="Diisi otomatis dari judul bila kosong"
                                        />
                                        <FieldError error={form.errors.slug} />
                                    </div>

                                    <div>
                                        <Label>Isi Artikel *</Label>
                                        <RichTextEditor
                                            value={form.data.body ?? ''}
                                            onChange={(html) => form.setData('body', html)}
                                            readOnly={!editable}
                                            onRequestImage={() => setPicker('body')}
                                        />
                                        <FieldError error={form.errors.body} />
                                    </div>

                                    <div>
                                        <Label htmlFor="excerpt">Ringkasan (Excerpt)</Label>
                                        <Textarea
                                            id="excerpt"
                                            value={form.data.excerpt}
                                            onChange={(e) => form.setData('excerpt', e.target.value)}
                                            disabled={!editable}
                                            rows={3}
                                            placeholder="Ringkasan singkat artikel"
                                        />
                                        <SeoBar
                                            ok={metaDescOk}
                                            count={metaDesc.length}
                                            max={160}
                                            label="Meta description"
                                        />
                                    </div>

                                    <div>
                                        <Label htmlFor="featured_video">Embed Video Utama</Label>
                                        <Textarea
                                            id="featured_video"
                                            value={form.data.featured_video}
                                            onChange={(e) => form.setData('featured_video', e.target.value)}
                                            disabled={!editable}
                                            rows={2}
                                            placeholder={'<iframe src="..."></iframe> (disanitasi server)'}
                                        />
                                    </div>
                                </TabsContent>

                                <TabsContent value="ai">
                                    <p className="rounded-md border border-border bg-muted/40 p-4 text-sm text-muted-foreground">
                                        Asisten AI sedang disiapkan. Modul ini belum aktif pada MVP dan memerlukan
                                        persetujuan manusia sebelum output disimpan.
                                    </p>
                                </TabsContent>
                            </Tabs>
                        </SectionCard>

                        <SectionCard title="Organisasi & Media" description="Kategori, tag, dan aset visual.">
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label>Kategori</Label>
                                    <Select
                                        value={form.data.category_id ? String(form.data.category_id) : ''}
                                        onValueChange={(v) => form.setData('category_id', v)}
                                        disabled={!editable}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Pilih kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {flatCategories.map((c) => (
                                                <SelectItem key={c.id} value={String(c.id)}>
                                                    {c.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label>Tag</Label>
                                    <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto rounded-md border border-input bg-card p-2">
                                        {cms.tags.map((tag) => {
                                            const on = form.data.tags.includes(tag.id);
                                            return (
                                                <button
                                                    key={tag.id}
                                                    type="button"
                                                    disabled={!editable}
                                                    onClick={() => toggleTag(tag.id)}
                                                    className={
                                                        'rounded-full border px-2.5 py-1 text-xs transition-colors disabled:opacity-50 cursor-pointer ' +
                                                        (on
                                                            ? 'border-primary bg-primary text-primary-foreground'
                                                            : 'border-input hover:bg-muted')
                                                    }
                                                >
                                                    {tag.name}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <MediaField
                                    label="Gambar Utama"
                                    mediaId={form.data.featured_image_id}
                                    media={content?.featured_image}
                                    fallbackText="Pilih gambar utama"
                                    onPick={() => setPicker('featured')}
                                    onClear={() => form.setData('featured_image_id', null)}
                                    disabled={!editable}
                                />
                                <MediaField
                                    label="Thumbnail"
                                    mediaId={form.data.thumbnail_id}
                                    media={content?.thumbnail}
                                    fallbackText="Pilih thumbnail"
                                    onPick={() => setPicker('thumbnail')}
                                    onClear={() => form.setData('thumbnail_id', null)}
                                    disabled={!editable}
                                />
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="image_caption">Keterangan Gambar</Label>
                                    <Input
                                        id="image_caption"
                                        value={form.data.image_caption}
                                        onChange={(e) => form.setData('image_caption', e.target.value)}
                                        disabled={!editable}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="image_credit">Kredit Gambar</Label>
                                    <Input
                                        id="image_credit"
                                        value={form.data.image_credit}
                                        onChange={(e) => form.setData('image_credit', e.target.value)}
                                        disabled={!editable}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-6">
                                <label className="flex items-center gap-2 text-sm">
                                    <Switch
                                        checked={form.data.breaking_news_flag}
                                        onCheckedChange={(v) => form.setData('breaking_news_flag', v)}
                                        disabled={!editable}
                                    />
                                    Breaking News
                                </label>
                                <label className="flex items-center gap-2 text-sm">
                                    <Switch
                                        checked={form.data.editor_pick_flag}
                                        onCheckedChange={(v) => form.setData('editor_pick_flag', v)}
                                        disabled={!editable}
                                    />
                                    Pilihan Editor
                                </label>
                            </div>
                        </SectionCard>

                        <div className="flex items-center gap-2">
                            <Button type="submit" disabled={!editable || form.processing}>
                                <Save className="h-4 w-4" /> {isCreate ? 'Buat Draft' : 'Simpan Perubahan'}
                            </Button>
                            {!isCreate && can.submit ? (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => action(`/contents/${content!.id}/submit`)}
                                >
                                    <Send className="h-4 w-4" /> Kirim ke Review
                                </Button>
                            ) : null}
                        </div>
                    </div>

                    <aside className="space-y-6">
                        {!isCreate ? (
                            <div className="overflow-hidden rounded-xl border border-border bg-[#171a1f] text-white shadow-sm">
                                <div className="border-b border-white/10 px-5 py-4">
                                    <h2 className="font-display text-base font-semibold">Alur Editorial</h2>
                                </div>
                                <div className="space-y-4 px-5 py-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-white/50">Status</span>
                                        <StatusBadge status={status} />
                                    </div>
                                    <WorkflowStepper status={status} />
                                    {content!.published_at ? (
                                        <p className="text-xs text-white/50">
                                            Terbit {formatDate(content!.published_at)}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="border-t border-white/10 px-5 py-4 space-y-2">
                                    <WorkflowActions
                                        can={can}
                                        onPublish={() => action(`/contents/${content!.id}/publish`)}
                                        onUnpublish={() => action(`/contents/${content!.id}/unpublish`)}
                                        onArchive={() => action(`/contents/${content!.id}/archive`)}
                                        onSchedule={() => setScheduleOpen(true)}
                                        onReject={() => setRejectOpen(true)}
                                        onApprove={() => action(`/contents/${content!.id}/approve`)}
                                    />
                                </div>
                            </div>
                        ) : null}

                        {!isCreate && content?.approvals?.length ? (
                            <SectionCard title="Riwayat Persetujuan">
                                <ol className="space-y-4">
                                    {content.approvals.map((a) => (
                                        <li key={a.id} className="border-l-2 border-border pl-3">
                                            <p className="text-sm font-medium capitalize">
                                                {a.action_label ?? a.action}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {a.reviewer?.name ?? 'Sistem'} · {formatDate(a.created_at)}
                                            </p>
                                            {a.notes ? (
                                                <p className="mt-1 text-sm text-muted-foreground">{a.notes}</p>
                                            ) : null}
                                        </li>
                                    ))}
                                </ol>
                            </SectionCard>
                        ) : null}
                    </aside>
                </div>
            </form>

            <MediaPicker
                open={picker !== null}
                onOpenChange={(o) => !o && setPicker(null)}
                canUpload={can.canUpload}
                onSelect={(media) => {
                    if (picker === 'featured') form.setData('featured_image_id', media.id);
                    if (picker === 'thumbnail') form.setData('thumbnail_id', media.id);
                    if (picker === 'body' && media.mime_type?.startsWith('image')) {
                        const img = `<img src="${media.url}" alt="${media.alt_text ?? ''}" style="max-width:100%" />`;
                        form.setData('body', (form.data.body ?? '') + img);
                    }
                    setPicker(null);
                }}
            />

            <ScheduleDialog open={scheduleOpen} onOpenChange={setScheduleOpen} contentId={content?.id} />
            <ReviewNotesDialog open={rejectOpen} onOpenChange={setRejectOpen} mode="reject" contentId={content?.id} />
        </>
    );
}

function SeoBar({ ok, count, max, label }: { ok: boolean; count: number; max: number; label: string }) {
    return (
        <div className="mt-1.5 flex items-center gap-2 text-xs">
            <span className={ok ? 'text-success' : 'text-warning'}>{ok ? '✓' : '•'}</span>
            <span className="text-muted-foreground">
                {label}: {count}/{max} karakter
            </span>
        </div>
    );
}

function MediaField({
    label,
    mediaId,
    media,
    fallbackText,
    onPick,
    onClear,
    disabled,
}: {
    label: string;
    mediaId: number | null;
    media?: { url: string; original_name?: string } | null;
    fallbackText: string;
    onPick: () => void;
    onClear: () => void;
    disabled?: boolean;
}) {
    return (
        <div>
            <Label>{label}</Label>
            <div className="flex items-center gap-3 rounded-md border border-input bg-card p-3">
                {mediaId && media ? (
                    <img src={media.url} alt="" className="h-16 w-16 rounded-md object-cover" />
                ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                        <ImagePlus className="h-6 w-6 text-muted-foreground" />
                    </div>
                )}
                <div className="flex-1">
                    <p className="text-xs text-muted-foreground">
                        {mediaId ? (media?.original_name ?? 'Terpilih') : fallbackText}
                    </p>
                </div>
                <div className="flex gap-1">
                    <Button type="button" variant="outline" size="sm" onClick={onPick} disabled={disabled}>
                        Pilih
                    </Button>
                    {mediaId ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="iconSm"
                            onClick={onClear}
                            disabled={disabled}
                            aria-label="Hapus"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    ) : null}
                </div>
            </div>
        </div>
    );
}

function WorkflowActions({
    can,
    onPublish,
    onUnpublish,
    onArchive,
    onSchedule,
    onReject,
    onApprove,
}: {
    can: Record<string, boolean>;
    onPublish: () => void;
    onUnpublish: () => void;
    onArchive: () => void;
    onSchedule: () => void;
    onReject: () => void;
    onApprove: () => void;
}) {
    return (
        <div className="space-y-2">
            {can.reviewAction ? (
                <>
                    <Button type="button" variant="default" className="w-full" onClick={onApprove}>
                        <Check className="h-4 w-4" /> Setujui
                    </Button>
                    <Button type="button" variant="secondary" className="w-full" onClick={onReject}>
                        <X className="h-4 w-4" /> Tolak / Minta Revisi
                    </Button>
                </>
            ) : null}
            {can.publish ? (
                <div className="flex gap-2">
                    <Button type="button" className="flex-1" onClick={onPublish}>
                        <UploadCloud className="h-4 w-4" /> Terbit
                    </Button>
                    <Button type="button" variant="outline" className="flex-1" onClick={onSchedule}>
                        <CalendarClock className="h-4 w-4" /> Jadwalkan
                    </Button>
                </div>
            ) : null}
            {can.unpublish ? (
                <Button type="button" variant="outline" className="w-full" onClick={onUnpublish}>
                    <Clock className="h-4 w-4" /> Tarik Publikasi
                </Button>
            ) : null}
            {can.archive ? (
                <Button type="button" variant="secondary" className="w-full" onClick={onArchive}>
                    <Archive className="h-4 w-4" /> Arsipkan
                </Button>
            ) : null}
        </div>
    );
}

function ScheduleDialog({
    open,
    onOpenChange,
    contentId,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    contentId?: number;
}) {
    const form = useForm({ scheduled_at: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/contents/${contentId}/schedule`, {
            onSuccess: () => onOpenChange(false),
        });
    };

    if (!contentId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Jadwalkan Publikasi</DialogTitle>
                    <DialogDescription>Atur waktu rilis artikel ini.</DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="mt-2 space-y-4">
                    <div>
                        <Label htmlFor="scheduled_at">Waktu Publikasi</Label>
                        <Input
                            id="scheduled_at"
                            type="datetime-local"
                            value={form.data.scheduled_at}
                            onChange={(e) => form.setData('scheduled_at', e.target.value)}
                        />
                        <FieldError error={form.errors.scheduled_at} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            Jadwalkan
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function ReviewNotesDialog({
    open,
    onOpenChange,
    mode,
    contentId,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    mode: 'reject';
    contentId?: number;
}) {
    const form = useForm({ notes: '' });
    const isReject = mode === 'reject';

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.post(`/contents/${contentId}/${isReject ? 'reject' : 'request-changes'}`, {
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
            },
        });
    };

    if (!contentId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>{isReject ? 'Tolak Konten' : 'Minta Perubahan'}</DialogTitle>
                    <DialogDescription>
                        {isReject
                            ? 'Konten akan dikembalikan ke draft. Tambahkan catatan (opsional).'
                            : 'Catatan revisi wajib diisi.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="mt-2 space-y-4">
                    <div>
                        <Label htmlFor="notes">Catatan {isReject ? '(opsional)' : '*'}</Label>
                        <Textarea
                            id="notes"
                            value={form.data.notes}
                            onChange={(e) => form.setData('notes', e.target.value)}
                            rows={3}
                            placeholder="Berikan masukan kepada author"
                        />
                        <FieldError error={form.errors.notes} />
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                            Batal
                        </Button>
                        <Button
                            type="submit"
                            variant={isReject ? 'outline' : 'destructive'}
                            disabled={form.processing || (!isReject && !form.data.notes.trim())}
                        >
                            {isReject ? 'Tolak' : 'Kirim Revisi'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
