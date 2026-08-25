import { useEffect, useRef, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, X, Hash, Tag as TagIcon, Sparkles, FolderTree } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/feedback';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { relativeTime } from '@/components/content-row-card';
import { formatDate } from '@/components/status-badge';
import { cn } from '@/lib/utils';

interface TagItem {
    id: number;
    name: string;
    slug: string | null;
    contents_count: number;
    published_count: number;
    contents_max_published_at?: string | null;
}

interface Paginator {
    data: TagItem[];
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
    sort?: string;
    used?: string;
}

interface Stats {
    total: number;
    used: number;
    unused: number;
    hot: number;
}

interface Can {
    manage: boolean;
}

interface Props {
    tags: Paginator;
    stats: Stats;
    filters: Filters;
    can: Can;
}

export default function TagsIndex({ tags, stats, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search ?? '');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [editingId, setEditingId] = useState<number | null>(null);
    const deleteConfirm = useConfirmDialog();

    const sort = filters.sort ?? 'name';
    const used = filters.used ?? 'all';

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setDebouncedSearch(search), 300);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [search]);

    useEffect(() => {
        if (debouncedSearch === filters.search) return;
        router.get(
            '/tags',
            { ...filters, search: debouncedSearch || undefined },
            { preserveState: true, replace: true },
        );
    }, [debouncedSearch]);

    const setFilters = (patch: Record<string, string | undefined>) => {
        router.get('/tags', { ...filters, ...patch }, { preserveState: true, replace: true });
    };

    const navigateToContents = (id: number) => router.visit(`/contents?tag=${id}`);

    const rows = (tags.data as TagItem[]) ?? [];

    const confirmDelete = (tag: TagItem) => {
        deleteConfirm.confirm({
            title: 'Hapus tag',
            description: `Hapus tag "${tag.name}"? Tag ini digunakan oleh ${tag.contents_count} konten.`,
            confirmVariant: 'destructive',
            onConfirm: () => router.delete(`/tags/${tag.id}`),
        });
    };

    const usedChips: Array<{ value: string; label: string; count?: number }> = [
        { value: 'all', label: 'Semua', count: stats.total },
        { value: 'used', label: 'Terpakai', count: stats.used },
        { value: 'unused', label: 'Tanpa konten', count: stats.unused },
    ];

    const usageBar = (tag: TagItem) => {
        const published = tag.published_count ?? 0;
        const total = tag.contents_count ?? 0;
        const pct = total > 0 ? (published / total) * 100 : 0;

        return (
            <button
                type="button"
                onClick={() => navigateToContents(tag.id)}
                title={`Lihat konten bertag ${tag.name}`}
                className="group inline-flex items-center gap-2 rounded px-1 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                <span className="flex h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-muted" aria-hidden="true">
                    <span
                        className="h-full rounded-full bg-success transition-[width] duration-200"
                        style={{ width: `${pct}%` }}
                    />
                </span>
                <span className="whitespace-nowrap text-xs tabular-nums">
                    <span className={cn('font-semibold', published > 0 ? 'text-success' : 'text-muted-foreground')}>
                        {published}
                    </span>
                    <span className="text-muted-foreground"> / {total}</span>
                </span>
            </button>
        );
    };

    const lastUsed = (tag: TagItem) => {
        if (!tag.contents_max_published_at) {
            return <span className="text-muted-foreground/50">Belum terbit</span>;
        }

        return (
            <span className="text-xs text-muted-foreground" title={formatDate(tag.contents_max_published_at, false)}>
                {relativeTime(tag.contents_max_published_at)}
            </span>
        );
    };

    const actionButtons = (tag: TagItem) => {
        if (!can.manage) return null;

        return (
            <div className="flex justify-end gap-1">
                <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => setEditingId(tag.id)}
                    aria-label={`Edit tag ${tag.name}`}
                >
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                    variant="ghost"
                    size="iconSm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => confirmDelete(tag)}
                    aria-label={`Hapus tag ${tag.name}`}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        );
    };

    const hasAnyTags = stats.total > 0;

    return (
        <>
            <Head title="Tag" />
            <PageHeader
                eyebrow="Editorial"
                title="Tag"
                description="Kelola label untuk mengindeks dan menemukan konten."
                actions={
                    can.manage ? (
                        <Button type="button" onClick={() => setEditingId(-1)}>
                            <Plus className="h-4 w-4" />
                            Tambah Tag
                        </Button>
                    ) : undefined
                }
            />

            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard label="Total Tag" value={stats.total} icon={Hash} hint="Seluruh label" />
                <MetricCard label="Tag Terpakai" value={stats.used} icon={TagIcon} tone="success" hint="Dipakai minimal 1 konten" />
                <MetricCard
                    label="Tanpa Konten"
                    value={stats.unused}
                    icon={FolderTree}
                    tone="warning"
                    hint="Kandidat untuk dirapikan"
                />
                <MetricCard label="Topik Terpanas" value={stats.hot} icon={Sparkles} tone="primary" hint="Terbit 30 hari terakhir" />
            </div>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-9"
                        placeholder="Cari tag..."
                        aria-label="Cari tag"
                    />
                    {search ? (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            aria-label="Bersihkan pencarian"
                            className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                </div>

                <Select value={sort} onValueChange={(v) => setFilters({ sort: v })}>
                    <SelectTrigger className="w-full sm:w-[200px]" aria-label="Urutkan tag">
                        <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name">Nama</SelectItem>
                        <SelectItem value="count">Terbanyak konten</SelectItem>
                        <SelectItem value="created">Terbaru dibuat</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            <div className="mb-4 flex flex-wrap items-center gap-2">
                {usedChips.map((chip) => (
                    <button
                        key={chip.value}
                        type="button"
                        onClick={() => setFilters({ used: chip.value === 'all' ? undefined : chip.value })}
                        aria-pressed={used === chip.value}
                        className={cn(
                            'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-200 cursor-pointer',
                            used === chip.value
                                ? 'border-primary/40 bg-primary/10 text-primary'
                                : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
                        )}
                    >
                        {chip.label}
                        <span className="tabular-nums opacity-70">{chip.count}</span>
                    </button>
                ))}
                {filters.search ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => router.get('/tags', {}, { replace: true })}
                    >
                        <X className="h-4 w-4" />
                        Reset
                    </Button>
                ) : null}
            </div>

            {editingId === -1 && can.manage && <TagForm key="create" onCancel={() => setEditingId(null)} />}

            {!hasAnyTags ? (
                <EmptyState
                    icon={Hash}
                    title="Belum ada tag"
                    description="Buat tag pertama untuk mulai mengindeks konten."
                    action={
                        can.manage ? (
                            <Button type="button" onClick={() => setEditingId(-1)}>
                                <Plus className="h-4 w-4" />
                                Buat Tag
                            </Button>
                        ) : undefined
                    }
                />
            ) : rows.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="Tidak ada hasil"
                    description={`Tidak ada tag yang cocok dengan filter Anda.`}
                    action={
                        <Button type="button" variant="outline" onClick={() => router.get('/tags', {}, { replace: true })}>
                            <X className="h-4 w-4" />
                            Reset filter
                        </Button>
                    }
                />
            ) : (
                <>
                    <div className="space-y-3 md:hidden">
                        {rows.map((tag) =>
                            editingId === tag.id ? (
                                <Card key={tag.id} className="p-4">
                                    <TagForm tag={tag} onCancel={() => setEditingId(null)} />
                                </Card>
                            ) : (
                                <Card key={tag.id} className="p-4">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <Hash className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
                                                <p className="truncate font-medium">{tag.name}</p>
                                            </div>
                                            {tag.slug ? (
                                                <code className="mt-0.5 block truncate text-xs text-muted-foreground">
                                                    {tag.slug}
                                                </code>
                                            ) : null}
                                        </div>
                                        {actionButtons(tag)}
                                    </div>
                                    <div className="mt-2 flex flex-wrap items-center gap-2">
                                        <button
                                            type="button"
                                            onClick={() => navigateToContents(tag.id)}
                                            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                            title={`Lihat konten bertag ${tag.name}`}
                                        >
                                            <Badge tone={tag.published_count > 0 ? 'success' : 'default'} className="tabular-nums">
                                                {tag.published_count} terbit · {tag.contents_count} total
                                            </Badge>
                                        </button>
                                        <span className="text-xs text-muted-foreground">Terakhir: {lastUsed(tag)}</span>
                                    </div>
                                </Card>
                            ),
                        )}
                    </div>

                    <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm" role="grid">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th scope="col" className="px-4 py-3 font-semibold">
                                            Nama
                                        </th>
                                        <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">
                                            Slug
                                        </th>
                                        <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">
                                            Terakhir dipakai
                                        </th>
                                        <th scope="col" className="px-4 py-3 font-semibold">
                                            Konten
                                        </th>
                                        {can.manage && (
                                            <th scope="col" className="px-4 py-3 text-right font-semibold">
                                                Aksi
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((tag) =>
                                        editingId === tag.id ? (
                                            <tr key={tag.id} className="border-b border-border bg-muted/20">
                                                <td colSpan={can.manage ? 5 : 4} className="px-4 py-3">
                                                    <TagForm tag={tag} onCancel={() => setEditingId(null)} />
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr
                                                key={tag.id}
                                                className="border-b border-border transition-colors duration-200 hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <Hash className="h-4 w-4 shrink-0 text-primary/70" aria-hidden="true" />
                                                        <span className="truncate font-medium">{tag.name}</span>
                                                    </div>
                                                </td>
                                                <td className="hidden max-w-[200px] px-4 py-3 text-muted-foreground lg:table-cell">
                                                    {tag.slug ? (
                                                        <code className="block truncate rounded bg-muted px-1.5 py-0.5 text-xs" title={tag.slug}>
                                                            {tag.slug}
                                                        </code>
                                                    ) : (
                                                        <span className="text-muted-foreground/50">—</span>
                                                    )}
                                                </td>
                                                <td className="hidden px-4 py-3 lg:table-cell">{lastUsed(tag)}</td>
                                                <td className="px-4 py-3">{usageBar(tag)}</td>
                                                {can.manage && <td className="px-4 py-3">{actionButtons(tag)}</td>}
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <Pagination data={tags} />
            <ConfirmDialog dialog={deleteConfirm.dialog} />
        </>
    );
}

function TagForm({ tag, onCancel }: { tag?: TagItem; onCancel: () => void }) {
    const isEdit = !!tag;
    const form = useForm({ name: tag?.name ?? '', slug: tag?.slug ?? '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && tag) {
            form.patch(`/tags/${tag.id}`);
        } else {
            form.post('/tags');
        }
    };

    return (
        <form onSubmit={submit} className="mb-4 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <Label htmlFor={isEdit ? `tag-name-${tag.id}` : 'tag-name-new'}>Nama</Label>
                    <Input
                        id={isEdit ? `tag-name-${tag?.id}` : 'tag-name-new'}
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Nama tag"
                    />
                    {!isEdit ? (
                        <p className="mt-1 text-xs text-muted-foreground">
                            Pisahkan dengan koma untuk membuat beberapa tag sekaligus.
                        </p>
                    ) : null}
                    <FieldError error={form.errors.name} />
                </div>
                <div>
                    <Label htmlFor={isEdit ? `tag-slug-${tag.id}` : 'tag-slug-new'}>Slug</Label>
                    <Input
                        id={isEdit ? `tag-slug-${tag?.id}` : 'tag-slug-new'}
                        value={form.data.slug}
                        onChange={(e) => form.setData('slug', e.target.value)}
                        placeholder="opsional"
                    />
                    <FieldError error={form.errors.slug} />
                </div>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={onCancel}>
                    <X className="h-4 w-4" />
                    Batal
                </Button>
                <Button type="submit" disabled={form.processing}>
                    {isEdit ? 'Simpan' : 'Buat'}
                </Button>
            </div>
        </form>
    );
}