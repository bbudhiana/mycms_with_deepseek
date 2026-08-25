import { useEffect, useMemo, useRef, useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import {
    Plus,
    Pencil,
    Trash2,
    Search,
    X,
    FolderTree,
    Folder,
    FolderOpen,
    ChevronRight,
    ChevronDown,
    Network,
    ArrowDownToLine,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Textarea, FieldError } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/feedback';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface CategoryNode {
    id: number;
    name: string;
    slug: string | null;
    description?: string | null;
    parent_id: number | null;
    depth: number;
    path: string[];
    slug_path: string[];
    contents_count: number;
    published_count: number;
    children_count: number;
    children: CategoryNode[];
}

interface ParentOption {
    id: number;
    name: string;
    slug: string | null;
    parent_id: number | null;
    depth: number;
}

interface Filters {
    search?: string;
}

interface Stats {
    total: number;
    roots: number;
    subcategories: number;
    unused: number;
}

interface Can {
    manage: boolean;
}

interface Props {
    tree: CategoryNode[] | null;
    categories: CategoryNode[] | null;
    stats: Stats;
    filters: Filters;
    editing: (CategoryNode & { parent?: { id: number; name: string } | null }) | null;
    parentOptions: ParentOption[];
    can: Can;
}

interface Row extends CategoryNode {
    hasChildren: boolean;
}

function flattenTree(nodes: CategoryNode[], expanded: Set<number>, out: Row[] = []): Row[] {
    for (const node of nodes) {
        const hasChildren = node.children.length > 0;
        out.push({ ...node, hasChildren });
        if (hasChildren && expanded.has(node.id)) {
            flattenTree(node.children, expanded, out);
        }
    }

    return out;
}

export default function CategoriesIndex({ tree, categories, filters, stats, editing, parentOptions, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search ?? '');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const [editingId, setEditingId] = useState<number | null>(editing?.id ?? null);
    const [expanded, setExpanded] = useState<Set<number> | null>(null);
    const deleteConfirm = useConfirmDialog();

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
            '/categories',
            { search: debouncedSearch || undefined },
            { preserveState: true, replace: true },
        );
    }, [debouncedSearch]);

    const allExpandedIds = useMemo(() => {
        const ids = new Set<number>();
        const walk = (nodes: CategoryNode[]) => {
            for (const node of nodes) {
                if (node.children.length > 0) ids.add(node.id);
                walk(node.children);
            }
        };
        walk(tree ?? []);

        return ids;
    }, [tree]);

    const expandedIds = expanded ?? allExpandedIds;

    const toggle = (id: number) => {
        setExpanded((prev) => {
            const base = prev ?? allExpandedIds;
            const next = new Set(base);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }

            return next;
        });
    };

    const searching = Boolean(filters.search);
    const rows = searching
        ? (categories ?? []).map((c) => ({ ...c, hasChildren: c.children_count > 0 }))
        : flattenTree(tree ?? [], expandedIds);

    const navigateToContents = (id: number) => router.visit(`/contents?category=${id}`);

    const rowCounts = (row: Row) => {
        const parts = [];
        if (row.children_count > 0) parts.push(`${row.children_count} sub`);
        if (row.contents_count > 0) parts.push(`${row.contents_count} konten`);

        return parts.join(', ');
    };

    const confirmDelete = (row: Row) => {
        deleteConfirm.confirm({
            title: 'Hapus kategori',
            description: `Hapus kategori "${row.name}"? Kategori ini berisi ${rowCounts(row) || 'tidak ada konten atau sub-kategori'}.`,
            confirmVariant: 'destructive',
            onConfirm: () => router.delete(`/categories/${row.id}`),
        });
    };

    const canDelete = (row: Row) => row.children_count === 0 && row.contents_count === 0;

    const actionButtons = (row: Row) => {
        if (!can.manage) return null;

        return (
            <div className="flex justify-end gap-1">
                <Button
                    variant="ghost"
                    size="iconSm"
                    onClick={() => setEditingId(row.id)}
                    aria-label={`Edit kategori ${row.name}`}
                >
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                {canDelete(row) ? (
                    <Button
                        variant="ghost"
                        size="iconSm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => confirmDelete(row)}
                        aria-label={`Hapus kategori ${row.name}`}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                ) : (
                    <Button
                        variant="ghost"
                        size="iconSm"
                        disabled
                        title="Tidak dapat dihapus karena masih memiliki sub-kategori atau konten"
                        aria-label={`Hapus kategori ${row.name} (tidak dapat dihapus)`}
                    >
                        <Trash2 className="h-3.5 w-3.5 opacity-30" />
                    </Button>
                )}
            </div>
        );
    };

    const treeToggle = (row: Row) => {
        if (!row.hasChildren) {
            return <span className="inline-flex w-4 shrink-0 items-center justify-center" aria-hidden="true" />;
        }

        const open = expandedIds.has(row.id);

        return (
            <button
                type="button"
                onClick={() => toggle(row.id)}
                aria-expanded={open}
                aria-label={open ? `Sembunyikan sub-kategori ${row.name}` : `Tampilkan sub-kategori ${row.name}`}
                className="inline-flex h-5 w-4 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
                {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </button>
        );
    };

    const folderIcon = (row: Row) => {
        const Icon = row.hasChildren ? (expandedIds.has(row.id) ? FolderOpen : Folder) : Folder;
        const className = cn(
            'h-4 w-4 shrink-0',
            row.hasChildren ? 'text-primary/70' : 'text-muted-foreground/60',
        );

        return <Icon className={className} aria-hidden="true" />;
    };

    const nameCell = (row: Row) => (
        <div className="flex min-w-0 items-start gap-2">
            <span
                className="flex shrink-0 items-center gap-1"
                style={{ paddingLeft: Math.min(row.depth, 6) * 16 }}
            >
                {treeToggle(row)}
                {folderIcon(row)}
            </span>
            <span className="min-w-0">
                <span className="block truncate font-medium">{row.name}</span>
                {row.path.length > 1 ? (
                    <span className="block truncate text-xs text-muted-foreground" title={row.path.join(' › ')}>
                        {row.path.join(' › ')}
                    </span>
                ) : (
                    <span className="block text-xs text-muted-foreground/50">Kategori utama</span>
                )}
            </span>
        </div>
    );

    const slugCell = (row: Row) => (
        <code className="block max-w-[180px] truncate rounded bg-muted px-1.5 py-0.5 text-xs" title={row.slug_path.join('/')}>
            {row.slug_path.join('/')}
        </code>
    );

    const contentCountCell = (row: Row) => (
        <button
            type="button"
            onClick={() => navigateToContents(row.id)}
            className="group inline-flex items-center gap-2 rounded px-1 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            title={`Lihat konten kategori ${row.name}`}
        >
            {row.published_count > 0 ? (
                <Badge tone="success" className="tabular-nums">
                    {row.published_count} terbit
                </Badge>
            ) : (
                <Badge tone="default" className="tabular-nums">
                    {row.contents_count} konten
                </Badge>
            )}
            <span className="text-xs text-muted-foreground tabular-nums group-hover:text-primary">
                {row.published_count > 0 ? `dari ${row.contents_count}` : row.contents_count === 0 ? 'kosong' : 'belum terbit'}
            </span>
        </button>
    );

    const hasAnyCategories = searching ? (categories?.length ?? 0) > 0 : (tree?.length ?? 0) > 0;

    return (
        <>
            <Head title="Kategori" />
            <PageHeader
                eyebrow="Editorial"
                title="Kategori"
                description="Atur hierarki kategori untuk mengorganisir konten."
                actions={
                    can.manage ? (
                        <Button type="button" onClick={() => setEditingId(-1)}>
                            <Plus className="h-4 w-4" />
                            Tambah Kategori
                        </Button>
                    ) : undefined
                }
            />

            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard
                    label="Total Kategori"
                    value={stats.total}
                    icon={FolderTree}
                    hint="Seluruh taksonomi"
                />
                <MetricCard label="Kategori Utama" value={stats.roots} icon={Folder} hint="Level teratas" />
                <MetricCard
                    label="Sub-kategori"
                    value={stats.subcategories}
                    icon={Network}
                    hint="Berinduk di bawah kategori lain"
                />
                <MetricCard
                    label="Tanpa Konten"
                    value={stats.unused}
                    icon={ArrowDownToLine}
                    tone="warning"
                    hint="Kandidat untuk dirapikan"
                />
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-9"
                        placeholder="Cari kategori..."
                        aria-label="Cari kategori"
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
                {filters.search ? (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => router.get('/categories', {}, { replace: true })}
                    >
                        <X className="h-4 w-4" />
                        Reset
                    </Button>
                ) : null}
            </div>

            {editingId === -1 && can.manage && (
                <div className="mb-4">
                    <CategoryForm
                        key="create"
                        parentOptions={parentOptions}
                        onCancel={() => setEditingId(null)}
                    />
                </div>
            )}

            {!hasAnyCategories ? (
                <EmptyState
                    icon={FolderTree}
                    title="Belum ada kategori"
                    description="Buat kategori pertama untuk mulai mengelompokkan konten."
                    action={
                        can.manage ? (
                            <Button type="button" onClick={() => setEditingId(-1)}>
                                <Plus className="h-4 w-4" />
                                Buat Kategori
                            </Button>
                        ) : undefined
                    }
                />
            ) : rows.length === 0 ? (
                <EmptyState
                    icon={Search}
                    title="Tidak ada hasil"
                    description={`Tidak ada kategori yang cocok dengan "${filters.search}".`}
                    action={
                        <Button type="button" variant="outline" onClick={() => router.get('/categories', {}, { replace: true })}>
                            <X className="h-4 w-4" />
                            Reset pencarian
                        </Button>
                    }
                />
            ) : (
                <>
                    <div className="space-y-3 md:hidden">
                        {rows.map((row) =>
                            editingId === row.id ? (
                                <Card key={row.id} className="p-4">
                                    <CategoryForm
                                        category={row}
                                        parentOptions={parentOptions}
                                        onCancel={() => setEditingId(null)}
                                    />
                                </Card>
                            ) : (
                                <Card key={row.id} className="p-4">
                                    <div className="flex items-start gap-2">
                                        <div
                                            className="flex shrink-0 items-start gap-1"
                                            style={{ paddingLeft: Math.min(row.depth, 6) * 16 }}
                                        >
                                            {treeToggle(row)}
                                            {folderIcon(row)}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">{row.name}</p>
                                                    {row.path.length > 1 ? (
                                                        <p className="truncate text-xs text-muted-foreground" title={row.path.join(' › ')}>
                                                            {row.path.join(' › ')}
                                                        </p>
                                                    ) : null}
                                                </div>
                                                {actionButtons(row)}
                                            </div>
                                            {row.description ? (
                                                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground/80">
                                                    {row.description}
                                                </p>
                                            ) : null}
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                {row.hasChildren ? (
                                                    <Badge tone="default" className="tabular-nums">
                                                        {row.children_count} sub
                                                    </Badge>
                                                ) : null}
                                                <button
                                                    type="button"
                                                    onClick={() => navigateToContents(row.id)}
                                                    className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                                    title={`Lihat konten kategori ${row.name}`}
                                                >
                                                    {row.published_count > 0 ? (
                                                        <Badge tone="success" className="tabular-nums">
                                                            {row.published_count} terbit
                                                        </Badge>
                                                    ) : (
                                                        <Badge tone="default" className="tabular-nums">
                                                            {row.contents_count} konten
                                                        </Badge>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
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
                                        <th scope="col" className="px-4 py-3 font-semibold">
                                            Slug
                                        </th>
                                        <th scope="col" className="hidden px-4 py-3 font-semibold lg:table-cell">
                                            Deskripsi
                                        </th>
                                        <th scope="col" className="px-4 py-3 font-semibold">
                                            Sub-kategori
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
                                    {rows.map((row) =>
                                        editingId === row.id ? (
                                            <tr key={row.id} className="border-b border-border bg-muted/20">
                                                <td colSpan={can.manage ? 6 : 5} className="px-4 py-3">
                                                    <CategoryForm
                                                        category={row}
                                                        parentOptions={parentOptions}
                                                        onCancel={() => setEditingId(null)}
                                                    />
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr
                                                key={row.id}
                                                className="border-b border-border transition-colors duration-200 hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3">{nameCell(row)}</td>
                                                <td className="px-4 py-3 text-muted-foreground">{slugCell(row)}</td>
                                                <td
                                                    className="hidden max-w-[260px] px-4 py-3 text-muted-foreground lg:table-cell"
                                                    title={row.description ?? undefined}
                                                >
                                                    <span className="block truncate">
                                                        {row.description ?? <span className="text-muted-foreground/50">—</span>}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    {row.hasChildren ? (
                                                        <Badge tone="default" className="tabular-nums">
                                                            {row.children_count}
                                                        </Badge>
                                                    ) : (
                                                        <span className="text-muted-foreground/50">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3">{contentCountCell(row)}</td>
                                                {can.manage && <td className="px-4 py-3">{actionButtons(row)}</td>}
                                            </tr>
                                        ),
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <ConfirmDialog dialog={deleteConfirm.dialog} />
        </>
    );
}

function CategoryForm({
    category,
    parentOptions,
    onCancel,
}: {
    category?: CategoryNode;
    parentOptions: ParentOption[];
    onCancel: () => void;
}) {
    const isEdit = !!category;
    const form = useForm({
        name: category?.name ?? '',
        slug: category?.slug ?? '',
        description: category?.description ?? '',
        parent_id: category?.parent_id != null ? String(category.parent_id) : '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        form.transform((d) => ({
            ...d,
            parent_id: d.parent_id === '' || d.parent_id == null ? null : Number(d.parent_id),
        }));
        if (isEdit && category) {
            form.patch(`/categories/${category.id}`);
        } else {
            form.post('/categories');
        }
    };

    const canPickParent = parentOptions.length > 0;

    return (
        <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <Label htmlFor={isEdit ? `name-${category.id}` : 'name-new'}>Nama</Label>
                    <Input
                        id={isEdit ? `name-${category?.id}` : 'name-new'}
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Nama kategori"
                    />
                    <FieldError error={form.errors.name} />
                </div>
                <div>
                    <Label htmlFor={isEdit ? `slug-${category.id}` : 'slug-new'}>Slug</Label>
                    <Input
                        id={isEdit ? `slug-${category?.id}` : 'slug-new'}
                        value={form.data.slug}
                        onChange={(e) => form.setData('slug', e.target.value)}
                        placeholder="opsional"
                    />
                    <FieldError error={form.errors.slug} />
                </div>
            </div>

            <div>
                <Label htmlFor={isEdit ? `desc-${category.id}` : 'desc-new'}>Deskripsi</Label>
                <Textarea
                    id={isEdit ? `desc-${category?.id}` : 'desc-new'}
                    value={form.data.description}
                    onChange={(e) => form.setData('description', e.target.value)}
                />
                <FieldError error={form.errors.description} />
            </div>

            <div>
                <Label>Parent</Label>
                <Select
                    value={form.data.parent_id === '' ? undefined : form.data.parent_id}
                    onValueChange={(v) => form.setData('parent_id', v)}
                >
                    <SelectTrigger disabled={!canPickParent}>
                        <SelectValue placeholder={canPickParent ? 'Tanpa parent (root)' : 'Tidak ada opsi parent'} />
                    </SelectTrigger>
                    <SelectContent>
                        {canPickParent && <SelectItem value="">Tanpa parent (root)</SelectItem>}
                        {parentOptions.map((opt) => (
                            <SelectItem
                                key={opt.id}
                                value={String(opt.id)}
                                style={{ paddingLeft: `${Math.min(opt.depth, 6) * 14 + 8}px` }}
                            >
                                {opt.depth > 0 ? '↳ ' : ''}
                                {opt.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
                <FieldError error={form.errors.parent_id} />
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