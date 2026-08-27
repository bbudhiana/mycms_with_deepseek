import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import {
    Save,
    Send,
    Check,
    X,
    Clock,
    ImagePlus,
    Link2,
    Link2Off,
    ArrowLeft,
    UploadCloud,
    CalendarClock,
    Archive,
    MessageSquareText,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge, formatDate, formatBytes } from '@/components/status-badge';
import { cn } from '@/lib/utils';
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
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { SectionCard } from '@/components/page-header';
import { Breadcrumbs } from '@/components/ui/breadcrumb';

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
    updated_at?: string | null;
    featured_image?: { id: number; url: string; original_name?: string } | null;
    thumbnail?: { id: number; url: string; original_name?: string } | null;
    tags: Array<{ id: number; name: string }>;
    approvals?: Approval[];
    has_pending_schedule?: boolean;
}

interface EditorFormData {
    title: string;
    sub_title: string;
    slug: string;
    excerpt: string;
    body: string;
    featured_video: string;
    breaking_news_flag: boolean;
    editor_pick_flag: boolean;
    category_id: string;
    featured_image_id: number | null;
    thumbnail_id: number | null;
    image_caption: string;
    image_credit: string;
    tags: number[];
}

/**
 * Representasi form yang dibandingkan untuk deteksi "belum disimpan".
 * Tag diurutkan agar urutan klik tidak dianggap perubahan.
 */
function toComparable(d: EditorFormData) {
    return {
        title: d.title,
        sub_title: d.sub_title,
        slug: d.slug,
        excerpt: d.excerpt,
        body: d.body,
        featured_video: d.featured_video,
        breaking_news_flag: d.breaking_news_flag,
        editor_pick_flag: d.editor_pick_flag,
        category_id: d.category_id,
        featured_image_id: d.featured_image_id,
        thumbnail_id: d.thumbnail_id,
        image_caption: d.image_caption,
        image_credit: d.image_credit,
        tags: [...d.tags].sort((a, b) => a - b),
    };
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
    const [publishOpen, setPublishOpen] = useState(false);
    const [unpublishOpen, setUnpublishOpen] = useState(false);
    const [archiveOpen, setArchiveOpen] = useState(false);

    const initialSnapshot = useMemo(
        () =>
            toComparable({
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
            }),
        [content],
    );
    const [snapshot, setSnapshot] = useState(initialSnapshot);

    const [slugTouched, setSlugTouched] = useState(() => !!content?.slug);
    const [lastSavedAt, setLastSavedAt] = useState<Date | null>(() =>
        content?.updated_at ? new Date(content.updated_at) : null,
    );
    const savingRef = useRef(false);

    const form = useForm<EditorFormData>({
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

    const isDirty = useMemo(
        () => JSON.stringify(toComparable(form.data)) !== JSON.stringify(snapshot),
        [form.data, snapshot],
    );

    const status = content?.status ?? 'draft';
    const editable = isCreate || status === 'draft';
    const meAuthor = !isCreate && content?.author_id === me?.id;

    // Auto-slug dari judul (debounced), nonaktif jika user sudah meng-edit manual.
    React.useEffect(() => {
        if (slugTouched || !form.data.title.trim()) return;
        const t = setTimeout(() => {
            const slug = form.data.title
                .toLowerCase()
                .trim()
                .replace(/[^a-z0-9\s-]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-');
            if (slug !== form.data.slug) {
                form.setData('slug', slug);
            }
        }, 600);
        return () => clearTimeout(t);
    }, [form.data.title]);

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
        savingRef.current = true;
        const finish = () => {
            savingRef.current = false;
            setSnapshot(toComparable(form.data));
            setLastSavedAt(new Date());
        };
        const onSuccess = finish;
        const onError = () => {
            savingRef.current = false;
        };
        if (isCreate) {
            form.post('/contents', { onSuccess, onError });
        } else {
            form.patch(`/contents/${content!.id}`, { onSuccess, onError });
        }
    };

    const action = (url: string) => {
        router.post(url, {}, { preserveScroll: true });
    };

    const handleAutosave = React.useCallback(
        async (html: string) => {
            if (isCreate || !editable || !content) return;

            savingRef.current = true;

            return new Promise<void>((resolve, reject) => {
                router.patch(
                    `/contents/${content.id}/autosave`,
                    { body: html },
                    {
                        preserveState: true,
                        preserveScroll: true,
                        onSuccess: () => {
                            savingRef.current = false;
                            setSnapshot((prev) => ({ ...prev, body: html }));
                            setLastSavedAt(new Date());
                            resolve();
                        },
                        onError: () => {
                            savingRef.current = false;
                            reject(new Error('Autosave failed'));
                        },
                    },
                );
            });
        },
        [isCreate, editable, content?.id, router],
    );

    // Guard: tolak navigasi & unload ketika ada perubahan belum disimpan.
    const discardDialog = useConfirmDialog();
    const pendingNavRef = useRef<(() => void) | null>(null);

    useEffect(() => {
        if (!isDirty) return;

        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', onBeforeUnload);

        const removeListener = router.on('before', (event) => {
            if (!isDirty || savingRef.current) return;
            const visit = event.detail.visit;
            const path = new URL(visit.url, window.location.origin).pathname;
            // Jangan intercept request simpan/autosave itu sendiri.
            const isSaveRequest =
                (visit.method === 'post' && path === '/contents') ||
                (visit.method === 'patch' && /^\/contents\/\d+$/.test(path));
            if (isSaveRequest) return;
            event.preventDefault();
            pendingNavRef.current = () => {
                pendingNavRef.current = null;
                router.on('before', () => true);
                if (visit.method === 'post') {
                    router.post(visit.url, visit.data ?? {});
                } else {
                    router.visit(visit.url);
                }
            };
            discardDialog.confirm({
                title: 'Perubahan belum disimpan',
                description:
                    'Ada perubahan yang belum tersimpan di artikel ini. Yakin keluar dari halaman? Perubahan akan hilang.',
                confirmLabel: 'Ya, keluar',
                onConfirm: () => {
                    window.removeEventListener('beforeunload', onBeforeUnload);
                    pendingNavRef.current?.();
                },
            });
        });

        return () => {
            window.removeEventListener('beforeunload', onBeforeUnload);
            removeListener();
        };
    }, [isDirty, router, discardDialog]);

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
                    <Button variant="ghost" size="sm" onClick={() => router.visit('/contents')}>
                        <ArrowLeft className="h-4 w-4" /> Kembali
                    </Button>
                }
            />
            <Breadcrumbs
                items={[{ label: 'Konten', href: '/contents' }, { label: isCreate ? 'Konten Baru' : 'Edit Konten' }]}
                className="mb-6"
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
                                        <div className="flex gap-2">
                                            <Input
                                                id="slug"
                                                value={form.data.slug}
                                                onChange={(e) => {
                                                    setSlugTouched(true);
                                                    form.setData('slug', e.target.value);
                                                }}
                                                disabled={!editable}
                                                placeholder={slugTouched ? 'Slug artikel' : 'Otomatis dari judul…'}
                                            />
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={!editable}
                                                onClick={() => setSlugTouched((v) => !v)}
                                                aria-pressed={!slugTouched}
                                                title={
                                                    slugTouched ? 'Gunakan otomatis dari judul' : 'Kunci slug manual'
                                                }
                                            >
                                                {slugTouched ? (
                                                    <Link2Off className="h-4 w-4" />
                                                ) : (
                                                    <Link2 className="h-4 w-4" />
                                                )}
                                                <span className="hidden sm:inline">
                                                    {slugTouched ? 'Manual' : 'Otomatis'}
                                                </span>
                                            </Button>
                                        </div>
                                        <FieldError error={form.errors.slug} />
                                        {!slugTouched ? (
                                            <p className="mt-1.5 text-xs text-muted-foreground">
                                                Slug dibuat otomatis dari judul. Klik ikon untuk mengunci &amp; ubah
                                                manual.
                                            </p>
                                        ) : null}
                                    </div>

                                    <div>
                                        <Label>Isi Artikel *</Label>
                                        <RichTextEditor
                                            value={form.data.body ?? ''}
                                            onChange={(html) => form.setData('body', html)}
                                            readOnly={!editable}
                                            onRequestImage={() => setPicker('body')}
                                            onAutosave={handleAutosave}
                                            autosaveDelay={2000}
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
                                    <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto rounded-md border border-input bg-card p-2">
                                        {cms.tags.map((tag) => {
                                            const on = form.data.tags.includes(tag.id);
                                            return (
                                                <button
                                                    key={tag.id}
                                                    type="button"
                                                    disabled={!editable}
                                                    onClick={() => toggleTag(tag.id)}
                                                    className={
                                                        'min-h-[44px] min-w-[44px] flex items-center justify-center rounded-full border px-3 py-1.5 text-xs transition-colors duration-200 disabled:opacity-50 cursor-pointer ' +
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
                        <SectionCard
                            title="Status Simpan"
                            action={
                                isDirty ? (
                                    <span className="rounded-full bg-warning/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-warning">
                                        Belum disimpan
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                        <Save className="h-3 w-3" /> Tersimpan
                                    </span>
                                )
                            }
                        >
                            {lastSavedAt ? (
                                <p className="text-sm text-muted-foreground">
                                    Terakhir disimpan{' '}
                                    {lastSavedAt.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    {isCreate
                                        ? 'Konten baru — simpan untuk membuat draft.'
                                        : 'Klik "Simpan Perubahan" untuk menyimpan.'}
                                </p>
                            )}
                        </SectionCard>

                        <SectionCard title="Pratinjau Hasil Pencarian">
                            <SeoPreview title={form.data.title} slug={form.data.slug} description={metaDesc} />
                        </SectionCard>

                        {!isCreate ? (
                            <div className="overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-sm">
                                <div className="border-b border-border px-5 py-4">
                                    <h2 className="font-display text-base font-semibold">Alur Editorial</h2>
                                </div>
                                <div className="space-y-4 px-5 py-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs text-muted-foreground">Status</span>
                                        <StatusBadge status={status} announce={false} />
                                    </div>
                                    <WorkflowStepper status={status} />
                                    {content!.published_at ? (
                                        <p className="text-xs text-muted-foreground">
                                            Terbit {formatDate(content!.published_at)}
                                        </p>
                                    ) : null}
                                </div>
                                <div className="border-t border-border px-5 py-4 space-y-2">
                                    <WorkflowActions
                                        can={can}
                                        onPublish={() => setPublishOpen(true)}
                                        onUnpublish={() => setUnpublishOpen(true)}
                                        onArchive={() => setArchiveOpen(true)}
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
            <PublishDialog open={publishOpen} onOpenChange={setPublishOpen} contentId={content?.id} />
            <UnpublishDialog open={unpublishOpen} onOpenChange={setUnpublishOpen} contentId={content?.id} />
            <ArchiveDialog open={archiveOpen} onOpenChange={setArchiveOpen} contentId={content?.id} />
            <ConfirmDialog dialog={discardDialog.dialog} />
        </>
    );
}

function SeoPreview({ title, slug, description }: { title: string; slug: string; description: string }) {
    const displayTitle = title.trim() ? title.trim() : 'Judul Artikel Anda';
    const safeSlug = slug.trim() ? slug.trim() : 'slug-artikel';
    const url = `${window.location.origin}/${safeSlug}`;

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-background p-3">
            <div className="flex flex-col gap-1" aria-label="Pratinjau hasil pencarian Google">
                <p className="truncate text-lg leading-snug text-primary font-medium">{displayTitle}</p>
                <p className="truncate text-xs text-success">{url.length > 70 ? url.slice(0, 70) + '…' : url}</p>
                <p className="line-clamp-2 text-sm text-muted-foreground">
                    {description.trim() ? description : 'Ringkasan artikel akan tampil di sini…'}
                </p>
            </div>
            <div className="mt-2 border-t border-border pt-2">
                <p className="text-[11px] text-muted-foreground">
                    {metaTitleOk(title) ? 'Judul SEO baik' : 'Judul ideal 10–60 karakter'} ·{' '}
                    {metaDescOk(description) ? 'Deskripsi baik' : 'Deskripsi ideal 70–160 karakter'}
                </p>
            </div>
        </div>
    );
}

function metaTitleOk(title: string): boolean {
    const len = title.trim().length;
    return len > 10 && len <= 60;
}

function metaDescOk(desc: string): boolean {
    const len = desc.trim().length;
    return len >= 70 && len <= 160;
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
    media?: { url: string; original_name?: string; size?: number; mime_type?: string } | null;
    fallbackText: string;
    onPick: () => void;
    onClear: () => void;
    disabled?: boolean;
}) {
    const isSelected = mediaId !== null && media !== null && media !== undefined;
    const isOrphan = mediaId !== null && !isSelected;
    const fileName = media?.original_name ?? null;
    const ext = fileName?.includes('.') ? fileName.split('.').pop()?.toUpperCase() : null;
    const sizeLabel = typeof media?.size === 'number' && media.size > 0 ? formatBytes(media.size) : null;

    return (
        <div>
            <Label>{label}</Label>
            <div
                className={cn(
                    'flex items-stretch gap-3 rounded-md border bg-card p-3 transition-colors',
                    isSelected ? 'border-primary/40 bg-primary/5' : 'border-input hover:border-primary/30',
                )}
            >
                <div className="shrink-0">
                    {isSelected ? (
                        <img
                            src={media!.url}
                            alt=""
                            className="h-16 w-16 rounded-md object-cover ring-1 ring-border"
                        />
                    ) : (
                        <div
                            className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-input bg-muted/40"
                            aria-hidden
                        >
                            <ImagePlus className="h-6 w-6 text-muted-foreground" />
                        </div>
                    )}
                </div>

                <div className="min-w-0 flex-1 self-center">
                    {isSelected ? (
                        <div className="space-y-0.5">
                            <p
                                className="truncate text-sm font-medium text-foreground"
                                title={fileName ?? undefined}
                            >
                                {fileName}
                            </p>
                            {(ext || sizeLabel) && (
                                <p className="flex items-center gap-1.5 truncate text-[11px] text-muted-foreground">
                                    {ext && <span className="font-medium uppercase tracking-wide">{ext}</span>}
                                    {ext && sizeLabel && <span aria-hidden>·</span>}
                                    {sizeLabel && <span>{sizeLabel}</span>}
                                </p>
                            )}
                        </div>
                    ) : isOrphan ? (
                        <p className="truncate text-sm text-warning">Media tidak tersedia — pilih ulang</p>
                    ) : (
                        <p className="truncate text-sm text-muted-foreground">{fallbackText}</p>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-1 self-center">
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onPick}
                        disabled={disabled}
                        aria-label={isSelected ? `Ganti ${label.toLowerCase()}` : `Pilih ${label.toLowerCase()}`}
                    >
                        <UploadCloud className="h-3.5 w-3.5" />
                        {isSelected ? 'Ganti' : 'Pilih'}
                    </Button>
                    {isSelected ? (
                        <Button
                            type="button"
                            variant="ghost"
                            size="iconSm"
                            onClick={onClear}
                            disabled={disabled}
                            aria-label={`Hapus ${label.toLowerCase()}`}
                            title="Hapus"
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
        <div className="space-y-4">
            {can.reviewAction || can.publish ? (
                <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Tindakan Utama
                    </p>
                    {can.reviewAction ? (
                        <>
                            <Button type="button" variant="default" className="w-full" onClick={onApprove}>
                                <Check className="h-4 w-4" /> Setujui
                            </Button>
                            <Button type="button" variant="outline" className="w-full" onClick={onReject}>
                                <MessageSquareText className="h-4 w-4" /> Minta Revisi
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
                </div>
            ) : null}
            {can.unpublish || can.archive ? (
                <div className="space-y-2">
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                        Pasca-Terbit
                    </p>
                    {can.unpublish ? (
                        <Button type="button" variant="outline" className="w-full" onClick={onUnpublish}>
                            <Clock className="h-4 w-4" /> Tarik Publikasi
                        </Button>
                    ) : null}
                    {can.archive ? (
                        <Button type="button" variant="ghost" className="w-full text-destructive hover:text-destructive" onClick={onArchive}>
                            <Archive className="h-4 w-4" /> Arsipkan
                        </Button>
                    ) : null}
                </div>
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

function PublishDialog({
    open,
    onOpenChange,
    contentId,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    contentId?: number;
}) {
    const [processing, setProcessing] = useState(false);

    const confirm = () => {
        if (!contentId) return;
        setProcessing(true);
        router.post(
            `/contents/${contentId}/publish`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
                onSuccess: () => onOpenChange(false),
            },
        );
    };

    if (!contentId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Terbitkan Artikel</DialogTitle>
                    <DialogDescription>
                        Artikel akan langsung tampil sebagai konten terbit di situs berita. Pastikan judul dan isi
                        sudah final sebelum melanjutkan.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-2 rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
                    <strong>Konfirmasi:</strong> setelah terbit, artikel dapat dilihat publik. Anda masih dapat
                    menarik publikasi atau mengarsipkan artikel dari halaman ini.
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button type="button" onClick={confirm} disabled={processing}>
                        {processing ? 'Menerbitkan…' : 'Ya, Terbitkan'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function UnpublishDialog({
    open,
    onOpenChange,
    contentId,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    contentId?: number;
}) {
    const [processing, setProcessing] = useState(false);

    const confirm = () => {
        if (!contentId) return;
        setProcessing(true);
        router.post(
            `/contents/${contentId}/unpublish`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
                onSuccess: () => onOpenChange(false),
            },
        );
    };

    if (!contentId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Tarik Publikasi</DialogTitle>
                    <DialogDescription>
                        Artikel akan ditarik dari publikasi dan dikembalikan ke status <strong>draft</strong>.
                        Artikel yang sudah disebarluaskan akan berhenti tampil sebagai konten terbit.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                    <strong>Perhatian:</strong> menarik publikasi berita yang sudah tayang dapat berdampak negatif
                    pada kredibilitas situs berita. Pastikan keputusan ini benar-benar diperlukan sebelum
                    melanjutkan.
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button type="button" variant="destructive" onClick={confirm} disabled={processing}>
                        Ya, Tarik Publikasi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function ArchiveDialog({
    open,
    onOpenChange,
    contentId,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    contentId?: number;
}) {
    const [processing, setProcessing] = useState(false);

    const confirm = () => {
        if (!contentId) return;
        setProcessing(true);
        router.post(
            `/contents/${contentId}/archive`,
            {},
            {
                preserveScroll: true,
                onFinish: () => setProcessing(false),
                onSuccess: () => onOpenChange(false),
            },
        );
    };

    if (!contentId) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Arsipkan Artikel</DialogTitle>
                    <DialogDescription>
                        Artikel akan dipindahkan ke status <strong>Arsip</strong>. Artikel tidak lagi tampil di
                        daftar terbit dan tidak dapat dipublikasikan kembali dari halaman ini tanpa tindakan
                        admin.
                    </DialogDescription>
                </DialogHeader>
                <div className="mt-2 rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
                    <strong>Perhatian:</strong> pengarsipan menandai akhir dari siklus editorial artikel ini.
                    Pastikan ini adalah keputusan yang memang diinginkan.
                </div>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button type="button" variant="destructive" onClick={confirm} disabled={processing}>
                        {processing ? 'Mengarsipkan…' : 'Ya, Arsipkan'}
                    </Button>
                </DialogFooter>
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
