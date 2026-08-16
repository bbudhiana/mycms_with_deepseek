import * as React from 'react';
import { Upload, Search, Lock, FileImage } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/field';
import { formatBytes } from '@/components/status-badge';
import { cn } from '@/lib/utils';

function getXsrfToken(): string {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : '';
}

interface MediaItem {
    id: number;
    url: string;
    thumbnail_url?: string | null;
    alt_text?: string | null;
    original_name: string;
    size: number;
    mime_type?: string | null;
}

interface MediaPickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (media: MediaItem) => void;
    canUpload?: boolean;
    onUploaded?: () => void;
}

export function MediaPicker({ open, onOpenChange, onSelect, canUpload = true, onUploaded }: MediaPickerProps) {
    const [items, setItems] = React.useState<MediaItem[]>([]);
    const [query, setQuery] = React.useState('');
    const [loading, setLoading] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [pendingFile, setPendingFile] = React.useState<File | null>(null);
    const [altText, setAltText] = React.useState('');
    const fileRef = React.useRef<HTMLInputElement>(null);
    const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    const handleFilesSelected = (files: FileList) => {
        const fileArray = Array.from(files);
        const imageFiles = fileArray.filter((f) => f.type.startsWith('image/') || f.type === 'application/pdf');
        if (imageFiles.length === 0) {
            toast.error('Hanya file gambar dan PDF yang diperbolehkan.');
            return;
        }
        // Process first file for now (could extend for multiple)
        if (imageFiles[0]) {
            setAltText('');
            setPendingFile(imageFiles[0]);
        }
    };

    const load = React.useCallback(async (search = '') => {
        setLoading(true);
        try {
            const res = await fetch(`/api/media?per_page=40${search ? `&search=${encodeURIComponent(search)}` : ''}`, {
                headers: { Accept: 'application/json', 'X-XSRF-TOKEN': getXsrfToken() },
            });
            if (!res.ok) throw new Error('Gagal memuat media');
            const data = await res.json();
            setItems(data.data ?? []);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        if (open) load();
    }, [open, load]);

    React.useEffect(() => {
        if (timer.current) clearTimeout(timer.current);
        timer.current = setTimeout(() => load(query), 350);

        return () => {
            if (timer.current) clearTimeout(timer.current);
        };
    }, [query, load]);

    const upload = async (file: File, alt = '') => {
        if (!canUpload) {
            toast.error('Anda tidak memiliki izin mengunggah media.');
            return;
        }
        setUploading(true);
        try {
            const form = new FormData();
            form.append('file', file);
            form.append('alt_text', alt);
            const res = await fetch('/api/media', {
                method: 'POST',
                body: form,
                headers: { Accept: 'application/json', 'X-XSRF-TOKEN': getXsrfToken() },
            });
            if (!res.ok) {
                const err = await res.json().catch(() => null);
                toast.error(err?.message ?? 'Gagal mengunggah.');
                return;
            }
            toast.success('Media diunggah.');
            onUploaded?.();
            load(query);
        } catch {
            toast.error('Gagal mengunggah.');
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Pilih Media</DialogTitle>
                    <DialogDescription>
                        Pilih gambar untuk disisipkan ke konten, atau unggah media baru.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 flex items-center gap-2">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="pl-9"
                            placeholder="Cari media…"
                        />
                    </div>
                    {canUpload ? (
                        <Button variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
                            <Upload className="h-4 w-4" />
                            {uploading ? 'Mengunggah…' : 'Unggah'}
                        </Button>
                    ) : (
                        <Button variant="outline" disabled title="Tidak ada izin unggah">
                            <Lock className="h-4 w-4" />
                        </Button>
                    )}
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*,.pdf"
                        className="hidden"
                        onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                                setAltText('');
                                setPendingFile(file);
                            }
                            e.target.value = '';
                        }}
                    />
                </div>

                {canUpload && <DropZone onFilesSelected={handleFilesSelected} uploading={uploading} />}

                <UploadAltDialog
                    open={!!pendingFile}
                    onOpenChange={(o) => {
                        if (!o) setPendingFile(null);
                    }}
                    file={pendingFile}
                    altText={altText}
                    onAltTextChange={setAltText}
                    uploading={uploading}
                    onConfirm={() => {
                        if (!pendingFile) return;
                        upload(pendingFile, altText);
                        setPendingFile(null);
                    }}
                />

                <div className="mt-4 max-h-[50vh] overflow-y-auto rounded-lg border border-border">
                    {loading ? (
                        <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4">
                            {Array.from({ length: 8 }).map((_, i) => (
                                <div key={i} className="aspect-[4/3] animate-pulse rounded-md bg-muted" />
                            ))}
                        </div>
                    ) : items.length === 0 ? (
                        <p className="py-12 text-center text-sm text-muted-foreground">Tidak ada media yang cocok.</p>
                    ) : (
                        <div className="grid grid-cols-3 gap-3 p-4 sm:grid-cols-4">
                            {items.map((item) => (
                                <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => onSelect(item)}
                                    className={cn(
                                        'group overflow-hidden rounded-md border border-border shadow-sm transition-all duration-200 hover:ring-2 hover:ring-primary cursor-pointer',
                                    )}
                                >
                                    <div className="aspect-[4/3] bg-muted">
                                        {item.mime_type?.startsWith('image') ? (
                                            <img
                                                src={item.thumbnail_url ?? item.url}
                                                alt={item.alt_text ?? item.original_name}
                                                className="h-full w-full object-cover"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                                                PDF
                                            </div>
                                        )}
                                    </div>
                                    <div className="px-2 py-1.5 text-left">
                                        <p className="truncate text-xs font-medium" title={item.original_name}>
                                            {item.original_name}
                                        </p>
                                        <p className="text-[11px] text-muted-foreground">{formatBytes(item.size)}</p>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

function UploadAltDialog({
    open,
    onOpenChange,
    file,
    altText,
    onAltTextChange,
    uploading,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    file: File | null;
    altText: string;
    onAltTextChange: (v: string) => void;
    uploading: boolean;
    onConfirm: () => void;
}) {
    const previewUrl = file ? URL.createObjectURL(file) : null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Unggah Media</DialogTitle>
                    <DialogDescription>Tambahkan teks alt (opsional) sebelum diunggah.</DialogDescription>
                </DialogHeader>

                {file && (
                    <div className="mt-4">
                        <div className="flex aspect-video items-center justify-center overflow-hidden rounded-lg border border-border bg-muted/40">
                            {previewUrl && file.type.startsWith('image/') ? (
                                <img src={previewUrl} alt="Pratinjau" className="h-full w-full object-cover" />
                            ) : (
                                <p className="px-4 text-sm text-muted-foreground">{file.name}</p>
                            )}
                        </div>
                        <p className="mt-2 text-xs text-muted-foreground">
                            {file.name} · {formatBytes(file.size)}
                        </p>

                        <div className="mt-4">
                            <Label htmlFor="picker-alt-text">Teks Alt</Label>
                            <Input
                                id="picker-alt-text"
                                value={altText}
                                onChange={(e) => onAltTextChange(e.target.value)}
                                placeholder="Deskripsi singkat gambar"
                            />
                        </div>
                    </div>
                )}

                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                        Batal
                    </Button>
                    <Button type="button" disabled={uploading} onClick={onConfirm}>
                        <Upload className="h-4 w-4" />
                        {uploading ? 'Mengunggah…' : 'Unggah'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DropZone({ onFilesSelected, uploading }: { onFilesSelected: (files: FileList) => void; uploading: boolean }) {
    const [isDragActive, setIsDragActive] = React.useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragActive(false);
        if (e.dataTransfer.files.length > 0) {
            onFilesSelected(e.dataTransfer.files);
        }
    };

    return (
        <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
                'mt-4 rounded-lg border-2 border-dashed p-6 text-center transition-all duration-200',
                isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
            )}
        >
            <input
                type="file"
                accept="image/*,.pdf"
                multiple
                className="hidden"
                onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                        onFilesSelected(e.target.files);
                    }
                    e.target.value = '';
                }}
                id="dropzone-file-input"
            />
            <FileImage className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" aria-hidden="true" />
            <p className="text-sm font-medium text-foreground mb-1">
                {isDragActive ? 'Lepaskan file di sini' : 'Seret & lepas file di sini, atau klik untuk pilih'}
            </p>
            <p className="text-xs text-muted-foreground mb-4">Format: JPG, PNG, WebP, GIF, PDF · Maks 10MB</p>
            <Button
                variant="outline"
                disabled={uploading}
                onClick={() => document.getElementById('dropzone-file-input')?.click()}
            >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Mengunggah…' : 'Pilih File'}
            </Button>
        </div>
    );
}
