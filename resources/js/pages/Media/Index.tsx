import { useRef, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Image as ImageIcon, Upload, LayoutGrid, List, Copy, Check, Trash2, RefreshCw, Search } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/feedback';
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

interface MediaItem {
    id: number;
    url: string;
    original_name: string;
    mime_type: string;
    size: number;
    alt_text: string | null;
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
}

interface Can {
    upload: boolean;
    manage: boolean;
}

interface Props {
    media: Paginator;
    filters: Filters;
    can: Can;
}

export default function MediaIndex({ media, filters, can }: Props) {
    const [view, setView] = useState<'grid' | 'list'>('grid');
    const [search, setSearch] = useState(filters.search ?? '');
    const [type, setType] = useState(filters.type ?? 'all');
    const [selected, setSelected] = useState<MediaItem | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);
    const [pendingFile, setPendingFile] = useState<File | null>(null);
    const upload = useForm({ file: null as File | null, alt_text: '' });
    const [copied, setCopied] = useState(false);
    const deleteConfirm = useConfirmDialog();

    const applyFilters = (next: { search?: string; type?: string } = { search, type }, preserve = false) => {
        router.get('/media', next, { preserveState: preserve, replace: true });
    };

    const onUploadFile = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        upload.setData('alt_text', '');
        setPendingFile(file);
        e.target.value = '';
    };

    const submitUpload = () => {
        if (!pendingFile) return;
        upload.setData('file', pendingFile);
        upload.post('/media', {
            forceFormData: true,
            onSuccess: () => setPendingFile(null),
        });
    };

    const previewUrl = pendingFile ? URL.createObjectURL(pendingFile) : null;

    const copyUrl = async (url: string) => {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    const imgSrc = (item: MediaItem) => item.url;

    return (
        <>
            <Head title="Media" />
            <PageHeader
                eyebrow="Editorial"
                title="Media"
                description="Kelola semua aset visual dan file yang diunggah untuk konten."
                actions={
                    can.upload ? (
                        <>
                            <input
                                ref={fileRef}
                                type="file"
                                className="hidden"
                                onChange={onUploadFile}
                                accept="image/*,.pdf"
                            />
                            <Button type="button" onClick={() => fileRef.current?.click()}>
                                <Upload className="h-4 w-4" />
                                Unggah
                            </Button>
                        </>
                    ) : undefined
                }
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                    <div className="relative sm:max-w-xs flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search, type })}
                            placeholder="Cari media..."
                            className="pl-9"
                        />
                    </div>
                    <Select
                        value={type}
                        onValueChange={(v) => {
                            setType(v);
                            applyFilters({ search, type: v });
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
                    {(filters.search || filters.type) && (
                        <Button type="button" variant="ghost" size="sm" onClick={() => applyFilters({}, true)}>
                            <RefreshCw className="h-4 w-4" />
                            Reset
                        </Button>
                    )}
                </div>
                <div className="flex items-center gap-1 rounded-md border border-border p-1">
                    <Button
                        variant={view === 'grid' ? 'secondary' : 'ghost'}
                        size="iconSm"
                        onClick={() => setView('grid')}
                    >
                        <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                        variant={view === 'list' ? 'secondary' : 'ghost'}
                        size="iconSm"
                        onClick={() => setView('list')}
                    >
                        <List className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {media.data.length === 0 ? (
                <EmptyState
                    icon={ImageIcon}
                    title="Belum ada media"
                    description="Unggah file pertama Anda untuk mulai membangun perpustakaan media."
                />
            ) : view === 'grid' ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {media.data.map((item) => (
                        <button
                            key={item.id}
                            type="button"
                            onClick={() => setSelected(item)}
                            className="group overflow-hidden rounded-lg border border-border bg-card text-left shadow-sm transition-colors hover:border-primary/40"
                        >
                            <div className="flex aspect-square items-center justify-center bg-muted/40 overflow-hidden">
                                {item.mime_type.startsWith('image/') ? (
                                    <img
                                        src={imgSrc(item)}
                                        alt={item.alt_text ?? item.original_name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <div className="flex flex-col items-center justify-center gap-1 p-3 text-center">
                                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                                        <span className="line-clamp-2 text-[10px] text-muted-foreground">
                                            {item.original_name}
                                        </span>
                                    </div>
                                )}
                            </div>
                            <div className="p-2">
                                <p className="truncate text-xs font-medium">{item.original_name}</p>
                                <p className="text-[11px] text-muted-foreground">
                                    {formatBytes(item.size)} · {formatDate(item.created_at, true)}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            ) : (
                <Card className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    Media
                                </th>
                                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    Tipe
                                </th>
                                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    Ukuran
                                </th>
                                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    Diunggah
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground sm:table-cell">
                                    Waktu
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {media.data.map((item) => (
                                <tr
                                    key={item.id}
                                    onClick={() => setSelected(item)}
                                    className="cursor-pointer border-b border-border hover:bg-muted/40"
                                >
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/40">
                                                {item.mime_type.startsWith('image/') ? (
                                                    <img
                                                        src={imgSrc(item)}
                                                        alt=""
                                                        className="h-full w-full object-cover"
                                                    />
                                                ) : (
                                                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="truncate font-medium">{item.original_name}</p>
                                                {item.alt_text && (
                                                    <p className="truncate text-xs text-muted-foreground">
                                                        {item.alt_text}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">{item.mime_type}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{formatBytes(item.size)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{item.uploader?.name ?? '—'}</td>
                                    <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                                        {formatDate(item.created_at)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            )}

            <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
                <DialogContent className="max-w-md">
                    {selected && (
                        <>
                            <DialogHeader>
                                <DialogTitle>{selected.original_name}</DialogTitle>
                                <DialogDescription>{formatDate(selected.created_at)}</DialogDescription>
                            </DialogHeader>

                            <div className="mt-4 flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
                                {selected.mime_type.startsWith('image/') ? (
                                    <img
                                        src={imgSrc(selected)}
                                        alt={selected.alt_text ?? selected.original_name}
                                        className="h-full w-full object-cover"
                                    />
                                ) : (
                                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                )}
                            </div>

                            <div className="mt-4 rounded-lg border border-border bg-muted/30 p-3">
                                <Label>URL</Label>
                                <div className="mt-1 flex items-center gap-2">
                                    <code className="min-w-0 flex-1 truncate rounded bg-muted px-2 py-1 text-xs">
                                        {selected.url}
                                    </code>
                                    <Button
                                        type="button"
                                        size="sm"
                                        variant="outline"
                                        onClick={() => copyUrl(selected.url)}
                                    >
                                        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                                        {copied ? 'Tersalin' : 'Salin'}
                                    </Button>
                                </div>
                            </div>

                            {can.manage && <AltTextForm media={selected} />}
                        </>
                    )}

                    <DialogFooter className="justify-between sm:justify-between">
                        {selected && can.manage ? (
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={() =>
                                    deleteConfirm.confirm({
                                        title: 'Hapus media',
                                        description: `Hapus "${selected.original_name}" secara permanen?`,
                                        onConfirm: () => {
                                            router.delete(`/media/${selected.id}`, { preserveScroll: true });
                                            setSelected(null);
                                        },
                                    })
                                }
                            >
                                <Trash2 className="h-4 w-4" />
                                Hapus
                            </Button>
                        ) : (
                            <span />
                        )}
                        <Button type="button" variant="ghost" onClick={() => setSelected(null)}>
                            Tutup
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog
                open={!!pendingFile}
                onOpenChange={(o) => {
                    if (!o) {
                        setPendingFile(null);
                        upload.reset();
                    }
                }}
            >
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Unggah Media</DialogTitle>
                        <DialogDescription>
                            Tinjau file dan tambahkan teks alt (opsional) sebelum diunggah.
                        </DialogDescription>
                    </DialogHeader>

                    {pendingFile && (
                        <div className="mt-4">
                            <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
                                {previewUrl && pendingFile.type.startsWith('image/') ? (
                                    <img src={previewUrl} alt="Pratinjau" className="h-full w-full object-cover" />
                                ) : (
                                    <p className="px-4 text-sm text-muted-foreground">{pendingFile.name}</p>
                                )}
                            </div>
                            <p className="mt-2 text-xs text-muted-foreground">
                                {pendingFile.name} · {formatBytes(pendingFile.size)}
                            </p>

                            <div className="mt-4">
                                <Label htmlFor="upload-alt-text">Teks Alt</Label>
                                <Input
                                    id="upload-alt-text"
                                    value={upload.data.alt_text}
                                    onChange={(e) => upload.setData('alt_text', e.target.value)}
                                    placeholder="Deskripsi singkat gambar"
                                />
                                <FieldError error={upload.errors.alt_text} />
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => {
                                setPendingFile(null);
                                upload.reset();
                            }}
                        >
                            Batal
                        </Button>
                        <Button type="button" disabled={upload.processing} onClick={submitUpload}>
                            <Upload className="h-4 w-4" />
                            {upload.processing ? 'Mengunggah…' : 'Unggah'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <ConfirmDialog dialog={deleteConfirm.dialog} />
            <Pagination data={media} />
        </>
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
