import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, RefreshCw, X, FolderTree } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Textarea, FieldError } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/feedback';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';

interface Category {
    id: number;
    name: string;
    slug: string | null;
    description?: string | null;
    parent_id: number | null;
    parent?: { id: number; name: string } | null;
    contents_count: number;
    children_count: number;
}

interface ParentOption {
    id: number;
    name: string;
    slug: string | null;
    parent_id: number | null;
}

interface Paginator {
    data: Category[];
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
}

interface Can {
    manage: boolean;
}

interface Props {
    categories: Paginator;
    filters: Filters;
    editing: (Category & { parent?: { id: number; name: string } | null }) | null;
    parentOptions: ParentOption[];
    can: Can;
}

export default function CategoriesIndex({ categories, filters, editing, parentOptions, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editingId, setEditingId] = useState<number | null>(editing?.id ?? null);

    const applySearch = () => {
        router.get('/categories', { search }, { preserveState: true, replace: true });
    };

    const deleteConfirm = useConfirmDialog();

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

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applySearch()}
                        placeholder="Cari kategori..."
                        className="pl-9"
                        aria-label="Cari kategori"
                    />
                </div>
                {filters.search && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => router.get('/categories', {}, { replace: true })}
                    >
                        <RefreshCw className="h-4 w-4" />
                        Reset
                    </Button>
                )}
            </div>

            {editingId === -1 && can.manage && (
                <CategoryForm key="create" parentOptions={parentOptions} onCancel={() => setEditingId(null)} />
            )}

            {categories.data.length === 0 ? (
                <EmptyState
                    icon={FolderTree}
                    title="Belum ada kategori"
                    description="Buat kategori pertama untuk mulai mengelompokkan konten."
                />
            ) : (
                <Card className="overflow-hidden">
                    <table className="w-full text-sm" role="grid">
                        <thead>
                            <tr className="border-b border-border">
                                <th scope="col" className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    Nama
                                </th>
                                <th scope="col" className="hidden px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground md:table-cell">
                                    Slug
                                </th>
                                <th scope="col" className="hidden px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground sm:table-cell">
                                    Parent
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    Sub-kategori
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    Konten
                                </th>
                                {can.manage && (
                                    <th scope="col" className="px-4 py-3 text-right text-xs uppercase tracking-wide text-muted-foreground">
                                        Aksi
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {categories.data.map((category) => {
                                if (editingId === category.id) {
                                    return (
                                        <tr key={category.id}>
                                            <td colSpan={can.manage ? 6 : 5} className="px-4 py-3">
                                                <CategoryForm
                                                    category={category}
                                                    parentOptions={parentOptions}
                                                    onCancel={() => setEditingId(null)}
                                                />
                                            </td>
                                        </tr>
                                    );
                                }
                                return (
                                    <tr key={category.id} className="border-b border-border hover:bg-muted/40">
                                        <td className="px-4 py-3 font-medium">{category.name}</td>
                                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                                {category.slug ?? '—'}
                                            </code>
                                        </td>
                                        <td className="hidden px-4 py-3 text-muted-foreground sm:table-cell">
                                            {category.parent?.name ?? (
                                                <span className="text-muted-foreground/60">—</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge tone="default">{category.children_count}</Badge>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge tone="default">{category.contents_count}</Badge>
                                        </td>
                                        {can.manage && (
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="iconSm"
                                                        onClick={() => setEditingId(category.id)}
                                                        aria-label={`Edit kategori ${category.name}`}
                                                    >
                                                        <Pencil className="h-3.5 w-3.5" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="iconSm"
                                                        className="text-destructive hover:text-destructive"
                                                        onClick={() =>
                                                            deleteConfirm.confirm({
                                                                title: 'Hapus kategori',
                                                                description: `Hapus kategori "${category.name}"?`,
                                                                onConfirm: () =>
                                                                    router.delete(`/categories/${category.id}`),
                                                            })
                                                        }
                                                        aria-label={`Hapus kategori ${category.name}`}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </Card>
            )}

            <ConfirmDialog dialog={deleteConfirm.dialog} />
            <Pagination data={categories} />
        </>
    );
}

function CategoryForm({
    category,
    parentOptions,
    onCancel,
}: {
    category?: Category;
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
                            <SelectItem key={opt.id} value={String(opt.id)}>
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
