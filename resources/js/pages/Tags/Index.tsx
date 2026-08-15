import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { Plus, Pencil, Trash2, Search, RefreshCw, X, Tags as TagsIcon } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/feedback';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';

interface Tag {
    id: number;
    name: string;
    slug: string | null;
    contents_count: number;
}

interface Paginator {
    data: Tag[];
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
    tags: Paginator;
    filters: Filters;
    can: Can;
}

export default function TagsIndex({ tags, filters, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [editingId, setEditingId] = useState<number | null>(null);
    const deleteConfirm = useConfirmDialog();

    return (
        <>
            <Head title="Tag" />
            <PageHeader
                eyebrow="Editorial"
                title="Tag"
                description="Kelola label yang digunakan untuk mengindeks dan menemukan konten."
                actions={
                    can.manage ? (
                        <Button type="button" onClick={() => setEditingId(-1)}>
                            <Plus className="h-4 w-4" />
                            Tambah Tag
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
                        onKeyDown={(e) =>
                            e.key === 'Enter' && router.get('/tags', { search }, { preserveState: true, replace: true })
                        }
                        placeholder="Cari tag..."
                        className="pl-9"
                        aria-label="Cari tag"
                    />
                </div>
                {filters.search && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => router.get('/tags', {}, { replace: true })}
                    >
                        <RefreshCw className="h-4 w-4" />
                        Reset
                    </Button>
                )}
            </div>

            {editingId === -1 && can.manage && <TagForm key="create" onCancel={() => setEditingId(null)} />}

            {tags.data.length === 0 ? (
                <EmptyState
                    icon={TagsIcon}
                    title="Belum ada tag"
                    description="Buat tag pertama untuk mengelola konten."
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
                            {tags.data.map((tag) =>
                                editingId === tag.id ? (
                                    <tr key={tag.id}>
                                        <td colSpan={can.manage ? 4 : 3} className="px-4 py-3">
                                            <TagForm tag={tag} onCancel={() => setEditingId(null)} />
                                        </td>
                                    </tr>
                                ) : (
                                    <tr key={tag.id} className="border-b border-border hover:bg-muted/40">
                                        <td className="px-4 py-3 font-medium">{tag.name}</td>
                                        <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                                {tag.slug ?? '—'}
                                            </code>
                                        </td>
                                        <td className="px-4 py-3">
                                            <Badge tone="default">{tag.contents_count}</Badge>
                                        </td>
                                        {can.manage && (
                                            <td className="px-4 py-3">
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
                                                        onClick={() =>
                                                            deleteConfirm.confirm({
                                                                title: 'Hapus tag',
                                                                description: `Hapus tag "${tag.name}"?`,
                                                                onConfirm: () => router.delete(`/tags/${tag.id}`),
                                                            })
                                                        }
                                                        aria-label={`Hapus tag ${tag.name}`}
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ),
                            )}
                        </tbody>
                    </table>
                </Card>
            )}

            <ConfirmDialog dialog={deleteConfirm.dialog} />
            <Pagination data={tags} />
        </>
    );
}

function TagForm({ tag, onCancel }: { tag?: Tag; onCancel: () => void }) {
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
        <form onSubmit={submit} className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
            <div className="grid gap-3 sm:grid-cols-2">
                <div>
                    <Label>Nama</Label>
                    <Input
                        value={form.data.name}
                        onChange={(e) => form.setData('name', e.target.value)}
                        placeholder="Nama tag"
                    />
                    <FieldError error={form.errors.name} />
                </div>
                <div>
                    <Label>Slug</Label>
                    <Input
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
