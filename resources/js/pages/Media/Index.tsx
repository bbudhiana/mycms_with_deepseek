import { useRef, useState, useEffect } from 'react';
import { Head, router, useForm, Link } from '@inertiajs/react';
import {
    Image as ImageIcon,
    Upload,
    LayoutGrid,
    List,
    Copy,
    Check,
    Trash2,
    RefreshCw,
    Search,
    Images,
    HardDrive,
    ImageOff,
    Archive,
    FileText,
    FileCode2,
    File as FileIcon,
    X,
    Maximize2,
    Loader2,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/feedback';
import { MetricCard } from '@/components/metric-card';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { formatDate, formatBytes } from '@/components/status-badge';
import { cn } from '@/lib/utils';

interface MediaItem {
    id: number;
    url: string;
    thumbnail_url?: string | null;
    original_name: string;
    mime_type: string;
    size: number;
    width?: number | null;
    height?: number | null;
    alt_text: string | null;
    featured_usage_count?: number;
    thumbnail_usage_count?: number;
    used_in_contents?: { id: number; title: string }[];
    created_at: string;
    uploader?: { id: number; name: string } | null;
}

interface Paginator {
    data: MediaItem[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    per_page: number;
}

interface Filters {
    search?: string;
    type?: string;
    sort?: string;
    mine?: boolean;
    alt?: string;
    used?: boolean | null;
}

interface Stats {
    total: number;
    storage: number;
    missing_alt: number;
    unused: number;
}

interface Can {
    upload: boolean;
    manage: boolean;
}

interface Props {
    media: Paginator;
    filters: Filters;
    stats: Stats;
    can: Can;
}

interface PendingFile {
    id: number;
    file: File;
    altText: string;
    previewUrl: string | null;
}

export default function MediaIndex({ media, filters, stats, can }: Props) {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? 'all');
    const [sort, setSort] = useState(filters.sort ?? 'recent');
    const [mine, setMine] = useState(filters.mine ?? false);
    const [alt, setAlt] = useState(filters.alt ?? 'all');
    const [used, setUsed] = useState<boolean | null>(filters.used ?? null);
    const [selected, setSelected] = useState<MediaItem | null>(null);
    const [lightbox, setLightbox] = useState<MediaItem | null>(null);
    const [copiedUrl, setCopiedUrl] = useState(false);
    const [copiedMd, setCopiedMd] = useState(false);
    const [uploadOpen, setUploadOpen] = useState(false);
    const [queue, setQueue] = useState<PendingFile[]>([]);
    const [uploading, setUploading] = useState(false);
    const [uploadingIndex, setUploadingIndex] = useState(-1);
    const [uploadProgress, setUploadProgress] = useState(0);
    const deleteConfirm = useConfirmDialog();

    useEffect(() => {
        setSearch(filters.search ?? '');
        setType(filters.type ?? 'all');
        setSort(filters.sort ?? 'recent');
        setMine(filters.mine ?? false);
        setAlt(filters.alt ?? 'all');
        setUsed(filters.used ?? null);
    }, [filters]);

    const apply = (overrides: Partial<Filters> = {}) => {
        const next = { search: search.trim(), type, sort, mine, alt, used, ...overrides };
        const params: Record<string, string | number> = {};

        if (next.search) params.search = next.search;
        if (next.type && next.type !== 'all') params.type = next.type;
        if (next.sort && next.sort !== 'recent') params.sort = next.sort;
        if (next.mine) params.mine = 1;
        if (next.alt && next.alt !== 'all') params.alt = next.alt;
        if (next.used !== null) params.used = next.used ? 1 : 0;

        router.get('/media', params, { preserveState: true, replace: true });
    };

    const reset = () => router.get('/media', {}, { preserveState: true, replace: true });

    const toggleAlt = () => {
        const next = alt === 'missing' ? 'all' : 'missing';
        setAlt(next);
        apply({ alt: next });
    };

    const toggleMine = () => {
        const next = !mine;
        setMine(next);
        apply({ mine: next });
    };

    const toggleUsed = (value: boolean) => {
        const next = used === value ? null : value;
        setUsed(next);
        apply({ used: next });
    };

    const addFiles = (fileList: FileList | File[]) => {
        const accepted = Array.from(fileList).filter(
            (f) => f.type.startsWith('image/') || f.type === 'application/pdf',
        );
        if (accepted.length === 0) {
            toast.error('Hanya file gambar dan PDF yang diperbolehkan.');
            return;
        }

        const pending = accepted.map((f) => ({
            id: Date.now() + Math.random(),
            file: f,
            altText: '',
            previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : null,
        }));

        setQueue((q) => [...q, ...pending]);
        setUploadOpen(true);
    };

    const removePending = (id: number) => {
        setQueue((q) => {
            const target = q.find((item) => item.id === id);
            if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl);
            return q.filter((item) => item.id !== id);
        });
    };

    const setPendingAlt = (id: number, altText: string) => {
        setQueue((q) => q.map((item) => (item.id === id ? { ...item, altText } : item)));
    };

    const uploadAll = async () => {
        if (queue.length === 0) return;

        setUploading(true);
        setUploadProgress(0);

        for (let i = 0; i < queue.length; i++) {
            const item = queue[i];
            setUploadingIndex(i);

            await new Promise<void>((resolve) => {
                router.post(
                    '/media',
                    { file: item.file, alt_text: item.altText },
                    {
                        forceFormData: true,
                        preserveScroll: true,
                        onProgress: (event) => setUploadProgress(event?.percentage ?? 0),
                        onSuccess: () => {
                            toast.success(`"${item.file.name}" diunggah.`);
                            resolve();
                        },
                        onError: (errors) => {
                            toast.error(errors.file ?? `Gagal mengunggah "${item.file.name}".`);
                            resolve();
                        },
                    },
                );
            });
        }

        setQueue((q) => {
            q.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
            return [];
        });
        setUploading(false);
        setUploadingIndex(-1);
        setUploadProgress(0);
        setUploadOpen(false);
    };

    const copyText = async (text: string, kind: 'url' | 'md') => {
        await navigator.clipboard.writeText(text);
        if (kind === 'url') {
            setCopiedUrl(true);
            setTimeout(() => setCopiedUrl(false), 1500);
        } else {
            setCopiedMd(true);
            setTimeout(() => setCopiedMd(false), 1500);
        }
    };

    const usageCount = (item: MediaItem) => (item.featured_usage_count ?? 0) + (item.thumbnail_usage_count ?? 0);

    const dimensions = (item: MediaItem) =>
        item.width != null && item.height != null ? `${item.width}×${item.height}` : null;

    const missingAltPct = stats.total ? Math.round((stats.missing_alt / stats.total) * 100) : 0;
    const overallProgress = queue.length ? ((uploadingIndex + uploadProgress / 100) / queue.length) * 100 : 0;

    return (
        <div
            className="flex flex-col gap-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
            }}
        >
            <Head title="Media" />
            <PageHeader
                eyebrow="Editorial"
                title="Media"
                description="Kelola semua aset visual dan file yang diunggah untuk konten."
                actions={
                    can.upload ? (
                        <Button type="button" onClick={() => setUploadOpen(true)}>
                            <Upload className="h-4 w-4" />
                            Unggah
                        </Button>
                    ) : undefined
                }
            />

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard label="Total Aset" value={stats.total} icon={Images} hint="Semua file di perpustakaan" />
                <MetricCard
                    label="Penyimpanan"
                    value={formatBytes(stats.storage)}
                    icon={HardDrive}
                    hint="Total ruang terpakai"
                />
                <MetricCard
                    label="Tanpa Alt Text"
                    value={stats.missing_alt}
                    icon={ImageOff}
                    tone="warning"
                    active={alt === 'missing'}
                    hint={
                        alt === 'missing'
                            ? `${missingAltPct}% · filter aktif, klik untuk reset`
                            : `${missingAltPct}% dari semua aset`
                    }
                    onClick={toggleAlt}
                />
                <MetricCard
                    label="Aset Tak Terpakai"
                    value={stats.unused}
                    icon={Archive}
                    tone="accent"
                    active={used === false}
                    hint={used === false ? 'Filter aktif, klik untuk reset' : 'Belum dipakai artikel'}
                    onClick={() => toggleUsed(false)}
                />
            </div>

            <div className="space-y-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                        <div className="relative sm:max-w-xs flex-1">
                            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                            <Input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && apply()}
                                placeholder="Cari media..."
                                className="pl-9"
                                aria-label="Cari media"
                            />
                        </div>
                        <Select
                            value={type}
                            onValueChange={(v) => {
                                setType(v);
                                apply({ type: v });
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Semua tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Semua Tipe</SelectItem>
                                <SelectItem value="image">Gambar</SelectItem>
                                <SelectItem value="doc">Dokumen</SelectItem>
                                <SelectItem value="svg">SVG</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select
                            value={sort}
                            onValueChange={(v) => {
                                setSort(v);
                                apply({ sort: v });
                            }}
                        >
                            <SelectTrigger className="w-full sm:w-40">
                                <SelectValue placeholder="Urutkan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="recent">Terbaru</SelectItem>
                                <SelectItem value="largest">Terbesar</SelectItem>
                                <SelectItem value="name">Nama</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button type="button" variant="ghost" size="sm" onClick={reset}>
                            <RefreshCw className="h-4 w-4" />
                            Reset
                        </Button>
                    </div>
                    <div className="flex items-center gap-1 rounded-md border border-border p-1">
                        <Button
                            variant={view === 'grid' ? 'secondary' : 'ghost'}
                            size="iconSm"
                            onClick={() => setView('grid')}
                            aria-label="Tampilan grid"
                            aria-pressed={view === 'grid'}
                        >
                            <LayoutGrid className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={view === 'list' ? 'secondary' : 'ghost'}
                            size="iconSm"
                            onClick={() => setView('list')}
                            aria-label="Tampilan daftar"
                            aria-pressed={view === 'list'}
                        >
                            <List className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {can.manage && (
                        <FilterChip active={mine} onClick={toggleMine}>
                            Milik Saya
                        </FilterChip>
                    )}
                    <FilterChip active={alt === 'missing'} onClick={toggleAlt}>
                        Tanpa Alt
                    </FilterChip>
                    <FilterChip active={used === true} onClick={() => toggleUsed(true)}>
                        Dipakai di Konten
                    </FilterChip>
                    <FilterChip active={used === false} onClick={() => toggleUsed(false)}>
                        Belum Dipakai
                    </FilterChip>
                    <p className="ml-auto text-xs text-muted-foreground">
                        Menampilkan <span className="font-medium text-foreground">{media.from ?? 0}</span>–
                        <span className="font-medium text-foreground">{media.to ?? 0}</span> dari {media.total}
                    </p>
                </div>
            </div>

            {media.data.length === 0 ? (
                <EmptyState
                    icon={ImageIcon}
                    title="Belum ada media"
                    description="Unggah file pertama Anda untuk mulai membangun perpustakaan media."
                    action={
                        can.upload ? (
                            <Button type="button" onClick={() => setUploadOpen(true)}>
                                <Upload className="h-4 w-4" />
                                Unggah File
                            </Button>
                        ) : undefined
                    }
                />
            ) : view === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {media.data.map((item) => {
                        const usage = usageCount(item);
                        const meta = fileTypeMeta(item.mime_type);

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => setSelected(item)}
                                className="group overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm transition-colors hover:border-primary/40"
                            >
                                <div className="relative flex aspect-square items-center justify-center overflow-hidden bg-muted/40">
                                    {item.mime_type.startsWith('image/') ? (
                                        <LazyThumb
                                            src={item.thumbnail_url ?? item.url}
                                            alt={item.alt_text ?? item.original_name}
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex flex-col items-center justify-center gap-1 p-3 text-center">
                                            <meta.icon className="h-6 w-6 text-muted-foreground" />
                                            <span className="line-clamp-2 text-[10px] text-muted-foreground">
                                                {item.original_name}
                                            </span>
                                        </div>
                                    )}
                                    {!item.alt_text ? (
                                        <Badge
                                            tone="destructive"
                                            className="absolute left-2 top-2 border-transparent bg-destructive text-destructive-foreground"
                                        >
                                            Tanpa Alt
                                        </Badge>
                                    ) : null}
                                    {usage > 0 ? (
                                        <span className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-full bg-card/90 px-2 py-0.5 text-[10px] font-semibold text-foreground shadow-sm">
                                            <FileText className="h-3 w-3" />
                                            {usage}
                                        </span>
                                    ) : null}
                                </div>
                                <div className="p-2">
                                    <p className="truncate text-xs font-medium">{item.original_name}</p>
                                    <p className="mt-0.5 text-[11px] text-muted-foreground">
                                        {meta.label} · {formatBytes(item.size)}
                                        {dimensions(item) ? ` · ${dimensions(item)}` : ''}
                                    </p>
                                </div>
                            </button>
                        );
                    })}
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <table className="w-full text-sm" role="grid">
                        <thead>
                            <tr className="border-b border-border">
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground"
                                >
                                    Media
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground"
                                >
                                    Tipe
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground"
                                >
                                    Ukuran
                                </th>
                                <th
                                    scope="col"
                                    className="hidden px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground md:table-cell"
                                >
                                    Dimensi
                                </th>
                                <th
                                    scope="col"
                                    className="hidden px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground lg:table-cell"
                                >
                                    Dipakai di
                                </th>
                                <th
                                    scope="col"
                                    className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground"
                                >
                                    Diunggah
                                </th>
                                <th
                                    scope="col"
                                    className="hidden px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground sm:table-cell"
                                >
                                    Waktu
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {media.data.map((item) => {
                                const usage = usageCount(item);
                                const meta = fileTypeMeta(item.mime_type);

                                return (
                                    <tr
                                        key={item.id}
                                        onClick={() => setSelected(item)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                setSelected(item);
                                            }
                                        }}
                                        tabIndex={0}
                                        aria-label={`Lihat detail ${item.original_name}`}
                                        className="cursor-pointer border-b border-border hover:bg-muted/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/40">
                                                    {item.mime_type.startsWith('image/') ? (
                                                        <LazyThumb
                                                            src={item.thumbnail_url ?? item.url}
                                                            alt=""
                                                            className="h-full w-full object-cover"
                                                        />
                                                    ) : (
                                                        <meta.icon className="h-4 w-4 text-muted-foreground" />
                                                    )}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{item.original_name}</p>
                                                    {item.alt_text ? (
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {item.alt_text}
                                                        </p>
                                                    ) : (
                                                        <p className="text-xs text-destructive">Tanpa alt text</p>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                                                <meta.icon className="h-4 w-4" />
                                                {meta.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{formatBytes(item.size)}</td>
                                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                                            {dimensions(item) ?? '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 lg:table-cell">
                                            {usage > 0 ? (
                                                <span
                                                    className="inline-flex items-center gap-1 font-medium text-foreground"
                                                    title={item.used_in_contents?.map((c) => c.title).join(', ')}
                                                >
                                                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {usage} artikel
                                                </span>
                                            ) : (
                                                <span className="text-muted-foreground">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {item.uploader?.name ?? '—'}
                                        </td>
                                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                                            {formatDate(item.created_at)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            )}

            <Pagination data={media} />

            <DetailDialog
                media={selected}
                usageCount={(item) => usageCount(item)}
                dimensions={(item) => dimensions(item)}
                canManage={can.manage}
                copiedUrl={copiedUrl}
                copiedMd={copiedMd}
                onClose={() => setSelected(null)}
                onCopyUrl={(item) => copyText(item.url, 'url')}
                onCopyMarkdown={(item) => copyText(`![${item.alt_text || item.original_name}](${item.url})`, 'md')}
                onOpenLightbox={setLightbox}
                onDelete={(item) =>
                    deleteConfirm.confirm({
                        title: 'Hapus media',
                        description:
                            `Hapus "${item.original_name}" secara permanen?` +
                            (usageCount(item) > 0
                                ? ` Aset ini dipakai di ${usageCount(item)} artikel dan akan kehilangan gambarnya.`
                                : ''),
                        onConfirm: () => {
                            router.delete(`/media/${item.id}`, { preserveScroll: true });
                            setSelected(null);
                        },
                    })
                }
            />

            <UploadDialog
                open={uploadOpen}
                queue={queue}
                uploading={uploading}
                uploadingIndex={uploadingIndex}
                overallProgress={overallProgress}
                uploadProgress={uploadProgress}
                onOpenChange={(o) => {
                    if (o) return;
                    if (uploading) return;
                    setUploadOpen(false);
                    queue.forEach((item) => item.previewUrl && URL.revokeObjectURL(item.previewUrl));
                    setQueue([]);
                }}
                onAddFiles={addFiles}
                onRemove={removePending}
                onAltChange={setPendingAlt}
                onUpload={uploadAll}
            />

            <Lightbox media={lightbox} onClose={() => setLightbox(null)} />

            <ConfirmDialog dialog={deleteConfirm.dialog} />
        </div>
    );
}

function FilterChip({
    active,
    onClick,
    children,
}: {
    active: boolean;
    onClick: () => void;
    children: React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={cn(
                'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-200 cursor-pointer',
                active
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
            )}
        >
            {children}
        </button>
    );
}

function LazyThumb({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [loaded, setLoaded] = useState(false);

    return (
        <img
            src={src}
            alt={alt}
            loading="lazy"
            decoding="async"
            onLoad={() => setLoaded(true)}
            className={cn('transition-opacity duration-300', loaded ? 'opacity-100' : 'opacity-0', className)}
        />
    );
}

function fileTypeMeta(mime?: string | null): { label: string; icon: LucideIcon } {
    if (!mime) return { label: 'File', icon: FileIcon };
    if (mime === 'image/svg+xml') return { label: 'SVG', icon: FileCode2 };
    if (mime === 'application/pdf') return { label: 'PDF', icon: FileText };
    if (mime.startsWith('image/')) return { label: mime.replace('image/', '').toUpperCase(), icon: ImageIcon };
    return { label: 'Dokumen', icon: FileIcon };
}

function DetailDialog({
    media,
    usageCount,
    dimensions,
    canManage,
    copiedUrl,
    copiedMd,
    onClose,
    onCopyUrl,
    onCopyMarkdown,
    onOpenLightbox,
    onDelete,
}: {
    media: MediaItem | null;
    usageCount: (item: MediaItem) => number;
    dimensions: (item: MediaItem) => string | null;
    canManage: boolean;
    copiedUrl: boolean;
    copiedMd: boolean;
    onClose: () => void;
    onCopyUrl: (item: MediaItem) => void;
    onCopyMarkdown: (item: MediaItem) => void;
    onOpenLightbox: (item: MediaItem) => void;
    onDelete: (item: MediaItem) => void;
}) {
    if (!media) return null;

    const meta = fileTypeMeta(media.mime_type);
    const usage = usageCount(media);

    return (
        <Dialog open={!!media} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle>{media.original_name}</DialogTitle>
                    <DialogDescription>
                        {meta.label} · {formatBytes(media.size)}
                        {dimensions(media) ? ` · ${dimensions(media)} px` : ''}
                    </DialogDescription>
                </DialogHeader>

                <div className="relative mt-4 flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
                    {media.mime_type.startsWith('image/') ? (
                        <>
                            <img
                                src={media.url}
                                alt={media.alt_text ?? media.original_name}
                                className="h-full w-full object-contain"
                            />
                            <button
                                type="button"
                                onClick={() => onOpenLightbox(media)}
                                aria-label="Lihat ukuran penuh"
                                className="absolute bottom-2 right-2 inline-flex h-8 w-8 items-center justify-center rounded-md bg-card/90 text-foreground shadow-sm transition-colors duration-200 hover:bg-card cursor-pointer"
                            >
                                <Maximize2 className="h-4 w-4" />
                            </button>
                        </>
                    ) : (
                        <meta.icon className="h-8 w-8 text-muted-foreground" />
                    )}
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Tipe</dt>
                        <dd className="mt-0.5 font-medium">{meta.label}</dd>
                    </div>
                    {dimensions(media) ? (
                        <div>
                            <dt className="text-xs uppercase tracking-wide text-muted-foreground">Dimensi</dt>
                            <dd className="mt-0.5 font-medium">{dimensions(media)} px</dd>
                        </div>
                    ) : null}
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Ukuran</dt>
                        <dd className="mt-0.5 font-medium">{formatBytes(media.size)}</dd>
                    </div>
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Diunggah oleh</dt>
                        <dd className="mt-0.5 font-medium">{media.uploader?.name ?? '—'}</dd>
                    </div>
                    <div>
                        <dt className="text-xs uppercase tracking-wide text-muted-foreground">Tanggal</dt>
                        <dd className="mt-0.5 font-medium">{formatDate(media.created_at)}</dd>
                    </div>
                </dl>

                <div className="mt-4 space-y-2">
                    <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-xs">{media.url}</code>
                        <Button type="button" size="sm" variant="outline" onClick={() => onCopyUrl(media)}>
                            {copiedUrl ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            <span role="status" aria-live="polite">
                                {copiedUrl ? 'Tersalin' : 'Salin'}
                            </span>
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                            {`![${media.alt_text || media.original_name}](${media.url})`}
                        </code>
                        <Button type="button" size="sm" variant="outline" onClick={() => onCopyMarkdown(media)}>
                            {copiedMd ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                            <span role="status" aria-live="polite">
                                {copiedMd ? 'Tersalin' : 'Salin MD'}
                            </span>
                        </Button>
                    </div>
                </div>

                {usage > 0 && (
                    <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                        <p className="text-sm font-semibold">Dipakai di {usage} artikel</p>
                        <ul className="mt-2 space-y-1">
                            {media.used_in_contents?.slice(0, 5).map((content) => (
                                <li key={content.id}>
                                    <Link
                                        href={`/contents/${content.id}`}
                                        className="line-clamp-1 text-sm text-accent underline-offset-2 hover:underline"
                                    >
                                        {content.title}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                        {(media.used_in_contents?.length ?? 0) > 5 ? (
                            <p className="mt-1 text-xs text-muted-foreground">
                                dan {media.used_in_contents!.length - 5} artikel lainnya.
                            </p>
                        ) : null}
                    </div>
                )}

                {canManage && <AltTextForm media={media} />}

                <DialogFooter className="justify-between sm:justify-between">
                    {canManage ? (
                        <Button type="button" variant="destructive" onClick={() => onDelete(media)}>
                            <Trash2 className="h-4 w-4" />
                            Hapus
                        </Button>
                    ) : (
                        <span />
                    )}
                    <Button type="button" variant="ghost" onClick={onClose}>
                        Tutup
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function UploadDialog({
    open,
    queue,
    uploading,
    uploadingIndex,
    overallProgress,
    uploadProgress,
    onOpenChange,
    onAddFiles,
    onRemove,
    onAltChange,
    onUpload,
}: {
    open: boolean;
    queue: PendingFile[];
    uploading: boolean;
    uploadingIndex: number;
    overallProgress: number;
    uploadProgress: number;
    onOpenChange: (o: boolean) => void;
    onAddFiles: (files: FileList | File[]) => void;
    onRemove: (id: number) => void;
    onAltChange: (id: number, value: string) => void;
    onUpload: () => void;
}) {
    const fileRef = useRef<HTMLInputElement>(null);
    const [isDragActive, setIsDragActive] = useState(false);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Unggah Media</DialogTitle>
                    <DialogDescription>
                        Seret & lepas beberapa file, atau klik untuk memilih. Tambahkan teks alt agar gambar mudah
                        diakses dan ramah SEO.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4">
                    <div
                        onDragOver={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragActive(true);
                        }}
                        onDragLeave={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragActive(false);
                        }}
                        onDrop={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsDragActive(false);
                            if (e.dataTransfer.files.length > 0) onAddFiles(e.dataTransfer.files);
                        }}
                        className={cn(
                            'rounded-lg border-2 border-dashed p-6 text-center transition-colors duration-200',
                            isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                        )}
                    >
                        <input
                            ref={fileRef}
                            type="file"
                            accept="image/*,.pdf"
                            multiple
                            className="hidden"
                            onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) onAddFiles(e.target.files);
                                e.target.value = '';
                            }}
                        />
                        <FileIcon className="mx-auto mb-3 h-10 w-10 text-muted-foreground/50" aria-hidden="true" />
                        <p className="mb-1 text-sm font-medium text-foreground">
                            {isDragActive
                                ? 'Lepaskan file di sini'
                                : 'Seret & lepas file di sini, atau klik untuk pilih'}
                        </p>
                        <p className="mb-4 text-xs text-muted-foreground">
                            Format: JPG, PNG, WebP, GIF, SVG, PDF · Maks 10MB per file
                        </p>
                        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                            <Upload className="h-4 w-4" />
                            Pilih File
                        </Button>
                    </div>

                    {queue.length > 0 && (
                        <ul className="mt-4 max-h-56 space-y-2 overflow-y-auto" aria-label="File yang akan diunggah">
                            {queue.map((item, i) => (
                                <li
                                    key={item.id}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg border border-border p-2',
                                        uploading && i === uploadingIndex && 'border-primary/40 bg-primary/5',
                                    )}
                                >
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/40">
                                        {item.previewUrl ? (
                                            <img src={item.previewUrl} alt="" className="h-full w-full object-cover" />
                                        ) : (
                                            <FileText className="h-4 w-4 text-muted-foreground" />
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-xs font-medium">{item.file.name}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                            {formatBytes(item.file.size)}
                                        </p>
                                        <Input
                                            value={item.altText}
                                            onChange={(e) => onAltChange(item.id, e.target.value)}
                                            placeholder="Teks alt (opsional)"
                                            className="mt-1 h-7 text-xs"
                                            disabled={uploading}
                                        />
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="iconSm"
                                        aria-label={`Hapus ${item.file.name} dari antrean`}
                                        disabled={uploading}
                                        onClick={() => onRemove(item.id)}
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </li>
                            ))}
                        </ul>
                    )}

                    {uploading && (
                        <div
                            className="mt-4"
                            role="progressbar"
                            aria-valuenow={Math.round(overallProgress)}
                            aria-valuemin={0}
                            aria-valuemax={100}
                        >
                            <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                                <span className="inline-flex items-center gap-1.5">
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Mengunggah {uploadingIndex + 1} dari {queue.length} — {Math.round(uploadProgress)}%
                                </span>
                                <span>{Math.round(overallProgress)}%</span>
                            </div>
                            <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full rounded-full bg-primary transition-[width] duration-200"
                                    style={{ width: `${overallProgress}%` }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button type="button" variant="ghost" disabled={uploading} onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button type="button" disabled={uploading || queue.length === 0} onClick={onUpload}>
                        <Upload className="h-4 w-4" />
                        {uploading ? 'Mengunggah…' : `Unggah ${queue.length} File`}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function Lightbox({ media, onClose }: { media: MediaItem | null; onClose: () => void }) {
    return (
        <Dialog open={!!media} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-5xl">
                {media && (
                    <>
                        <DialogHeader>
                            <DialogTitle>{media.original_name}</DialogTitle>
                            <DialogDescription>{media.alt_text ?? 'Tanpa teks alt'}</DialogDescription>
                        </DialogHeader>
                        <div className="mt-4 flex max-h-[80vh] items-center justify-center overflow-auto rounded-lg border border-border bg-muted/40">
                            <img
                                src={media.url}
                                alt={media.alt_text ?? media.original_name}
                                className="h-auto w-full object-contain"
                            />
                        </div>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}

function AltTextForm({ media }: { media: MediaItem }) {
    const form = useForm({ alt_text: media.alt_text ?? '' });
    return (
        <div className="mt-4 rounded-lg border border-border p-3">
            <Label htmlFor="alt-text">Teks Alt</Label>
            <div className="mt-1 flex gap-2">
                <Input
                    id="alt-text"
                    value={form.data.alt_text}
                    onChange={(e) => form.setData('alt_text', e.target.value)}
                    placeholder="Deskripsi singkat gambar"
                />
                <Button
                    type="button"
                    size="sm"
                    disabled={form.processing || form.data.alt_text === (media.alt_text ?? '')}
                    onClick={() => form.patch(`/media/${media.id}/alt-text`, { preserveScroll: true })}
                >
                    Simpan
                </Button>
            </div>
            <FieldError error={form.errors.alt_text} />
        </div>
    );
}
