import React, { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { Plus, Search, FileText, ArrowUpDown, ArrowUp, ArrowDown, X } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge, formatDate } from '@/components/status-badge';
import { ContentRowCard, relativeTime } from '@/components/content-row-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/feedback';
import { Breadcrumbs } from '@/components/ui/breadcrumb';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';

interface ContentItem {
    id: number;
    title: string;
    slug: string;
    status: string;
    category?: { id: number; name: string } | null;
    author?: { id: number; name: string } | null;
    updated_at?: string;
    published_at?: string | null;
    published_today?: boolean;
    has_pending_schedule?: boolean;
    breaking_news_flag?: boolean;
    editor_pick_flag?: boolean;
    thumbnail?: { id: number; url: string } | null;
}

interface PaginatorData {
    data: ContentItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
}

interface Props {
    contents: PaginatorData;
    filters: { search?: string; status?: string; category?: string; tag?: string; sort?: string; dir?: string };
    statuses: Array<{ value: string; label: string }>;
    categories: Array<{ id: number; name: string }>;
    tags: Array<{ id: number; name: string }>;
    can: { create: boolean; delete: boolean };
}

export default function ContentsIndex({ contents, filters, statuses, categories, tags, can }: Props) {
    const [search, setSearch] = useState(filters.search ?? '');
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search ?? '');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const deleteConfirm = useConfirmDialog();

    const sort = filters.sort ?? 'updated_at';
    const dir = filters.dir ?? 'desc';

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setDebouncedSearch(search), 300);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [search]);

    useEffect(() => {
        // `filters.search` dari server adalah `null` saat query tanpa `search=`,
        // sedangkan `debouncedSearch` selalu string (state diinisialisasi
        // dengan `?? ''`). Normalisasi kedua sisi sebelum dibandingkan — kalau
        // tidak, '' !== null dan effect langsung navigasi ke `/contents` saat
        // mount (mis. membuka `/contents?page=2` akan dilempar balik ke page 1).
        const serverSearch = filters.search ?? '';
        if (debouncedSearch === serverSearch) return;
        router.get(
            '/contents',
            { ...filters, search: debouncedSearch || undefined },
            { preserveState: true, replace: true },
        );
    }, [debouncedSearch]);

    const navigate = (href: string) => {
        router.visit(href);
    };

    // Inertia v3 sets `preserveState: true` on `router.delete()` by default.
    // Setelah delete di sini redirect ke URL yang sama (`/contents`), Inertia
    // tidak selalu re-fetch prop `contents` — halaman kelihatan stale dengan
    // item yang baru dihapus. Paksa partial reload prop `contents` setelah
    // sukses, supaya paginator selalu ambil data segar.
    const handleDelete = (item: ContentItem) => {
        deleteConfirm.confirm({
            title: 'Hapus konten',
            description: `Hapus "${item.title}" secara permanen?`,
            confirmVariant: 'destructive',
            onConfirm: () =>
                router.delete(`/contents/${item.id}`, {
                    onSuccess: () => router.reload({ only: ['contents'] }),
                }),
        });
    };

    const toggleSort = (key: string) => {
        const nextDir = sort === key && dir === 'asc' ? 'desc' : 'asc';
        router.get('/contents', { ...filters, sort: key, dir: nextDir }, { preserveState: true, replace: true });
    };

    const SortHeader = ({ label, sortKey }: { label: string; sortKey: string }) => {
        const active = sort === sortKey;
        return (
            <button
                type="button"
                onClick={() => toggleSort(sortKey)}
                className="inline-flex items-center gap-1 font-semibold uppercase tracking-wide hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                aria-sort={active ? (dir === 'asc' ? 'ascending' : 'descending') : 'none'}
            >
                {label}
                {active ? (
                    dir === 'asc' ? (
                        <ArrowUp className="h-3 w-3" />
                    ) : (
                        <ArrowDown className="h-3 w-3" />
                    )
                ) : (
                    <ArrowUpDown className="h-3 w-3 opacity-40" />
                )}
            </button>
        );
    };

    const rows = (contents.data as ContentItem[]) ?? [];

    return (
        <>
            <Head title="Konten" />
            <PageHeader
                eyebrow="Editorial"
                title="Konten"
                description="Kelola artikel Anda melalui alur editorial dari draft hingga publikasi."
                actions={
                    can.create ? (
                        <Button onClick={() => navigate('/contents/create')}>
                            <Plus className="h-4 w-4" /> Konten Baru
                        </Button>
                    ) : null
                }
            />
            <Breadcrumbs items={[{ label: 'Konten' }]} className="mb-4" />

            <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-9"
                        placeholder="Cari judul konten…"
                        aria-label="Cari judul konten"
                    />
                    {search ? (
                        <button
                            type="button"
                            onClick={() => setSearch('')}
                            aria-label="Bersihkan pencarian"
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    ) : null}
                </div>

                <Select
                    value={filters.status ?? 'all'}
                    onValueChange={(v) =>
                        router.get(
                            '/contents',
                            { ...filters, status: v === 'all' ? undefined : v },
                            { preserveState: true, replace: true },
                        )
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        {statuses.map((s) => (
                            <SelectItem key={s.value} value={s.value}>
                                {s.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.category ?? 'all'}
                    onValueChange={(v) =>
                        router.get(
                            '/contents',
                            { ...filters, category: v === 'all' ? undefined : v },
                            { preserveState: true, replace: true },
                        )
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Kategori" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Kategori</SelectItem>
                        {categories.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                                {c.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <Select
                    value={filters.tag ?? 'all'}
                    onValueChange={(v) =>
                        router.get(
                            '/contents',
                            { ...filters, tag: v === 'all' ? undefined : v },
                            { preserveState: true, replace: true },
                        )
                    }
                >
                    <SelectTrigger className="w-[180px]">
                        <SelectValue placeholder="Tag" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Tag</SelectItem>
                        {tags.map((t) => (
                            <SelectItem key={t.id} value={String(t.id)}>
                                {t.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {rows.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Tidak ada konten"
                    description="Belum ada konten yang cocok dengan filter Anda."
                    action={
                        can.create ? (
                            <Button variant="outline" onClick={() => navigate('/contents/create')}>
                                <Plus className="h-4 w-4" /> Konten Baru
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <>
                    <div className="grid gap-3 md:hidden">
                        {rows.map((item) => (
                            <ContentRowCard
                                key={item.id}
                                item={item}
                                onOpen={() => navigate(`/contents/${item.id}`)}
                                onDelete={() => handleDelete(item)}
                                canDelete={can.delete}
                            />
                        ))}
                    </div>

                    <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm" role="grid">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th className="px-4 py-3 font-semibold w-10" scope="col">
                                            No
                                        </th>
                                        <th className="px-4 py-3 font-semibold" scope="col">
                                            <SortHeader label="Judul" sortKey="title" />
                                        </th>
                                        <th className="px-4 py-3 font-semibold" scope="col">
                                            Kategori
                                        </th>
                                        <th className="px-4 py-3 font-semibold" scope="col">
                                            Penulis
                                        </th>
                                        <th className="px-4 py-3 font-semibold" scope="col">
                                            <SortHeader label="Status" sortKey="status" />
                                        </th>
                                        <th className="px-4 py-3 font-semibold" scope="col">
                                            <SortHeader label="Diperbarui" sortKey="updated_at" />
                                        </th>
                                        <th className="px-4 py-3 text-right font-semibold" scope="col">
                                            Aksi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((item, index) => {
                                        const rowNumber =
                                            (contents.current_page - 1) * (contents.per_page ?? 15) + index + 1;
                                        return (
                                            <tr
                                                key={item.id}
                                                className="border-b border-border transition-colors duration-200 hover:bg-muted/30"
                                                role="row"
                                            >
                                                <td className="px-4 py-3 text-center text-muted-foreground text-xs font-medium">
                                                    {rowNumber}
                                                </td>
                                                <td className="max-w-[300px] px-4 py-3 text-left">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/contents/${item.id}`)}
                                                        className="flex w-full items-center gap-3 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
                                                        aria-label={`Buka ${item.title}`}
                                                    >
                                                        {item.thumbnail?.url ? (
                                                            <img
                                                                src={item.thumbnail.url}
                                                                alt=""
                                                                loading="lazy"
                                                                className="h-10 w-10 shrink-0 rounded-md object-cover"
                                                            />
                                                        ) : null}
                                                        <span className="min-w-0">
                                                            <span className="block truncate font-medium group-hover:text-accent">
                                                                {item.title}
                                                            </span>
                                                            <span className="flex flex-wrap gap-1">
                                                                {item.breaking_news_flag ? (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-primary">
                                                                        Breaking
                                                                    </span>
                                                                ) : null}
                                                                {item.editor_pick_flag ? (
                                                                    <span className="text-[10px] font-bold uppercase tracking-wide text-accent">
                                                                        Pilihan Editor
                                                                    </span>
                                                                ) : null}
                                                                {item.published_today ? (
                                                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-success">
                                                                        Terbit hari ini
                                                                    </span>
                                                                ) : null}
                                                                {item.has_pending_schedule ? (
                                                                    <span className="text-[10px] font-semibold uppercase tracking-wide text-warning">
                                                                        Terjadwal
                                                                    </span>
                                                                ) : null}
                                                            </span>
                                                        </span>
                                                    </button>
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {item.category?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3 text-muted-foreground">
                                                    {item.author?.name ?? '—'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <StatusBadge status={item.status} />
                                                </td>
                                                <td
                                                    className="px-4 py-3 text-xs text-muted-foreground"
                                                    title={formatDate(item.updated_at, false)}
                                                >
                                                    {relativeTime(item.updated_at)}
                                                </td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => navigate(`/contents/${item.id}`)}
                                                        >
                                                            Buka
                                                        </Button>
                                                        {can.delete ? (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="text-destructive hover:text-destructive"
                                                                onClick={() => handleDelete(item)}
                                                            >
                                                                Hapus
                                                            </Button>
                                                        ) : null}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <Pagination data={contents} />
            <ConfirmDialog dialog={deleteConfirm.dialog} />
        </>
    );
}
