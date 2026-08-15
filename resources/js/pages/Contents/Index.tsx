import React, { useMemo, useState } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import { Plus, Search, FileText } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { StatusBadge, formatDate } from '@/components/status-badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/feedback';

interface ContentItem {
    id: number;
    title: string;
    slug: string;
    status: string;
    category?: { id: number; name: string } | null;
    author?: { id: number; name: string } | null;
    updated_at?: string;
    published_at?: string | null;
    breaking_news_flag?: boolean;
    editor_pick_flag?: boolean;
}

export default function ContentsIndex({
    contents,
    filters,
    statuses,
    categories,
    can,
}: {
    contents: any;
    filters: { search?: string; status?: string; category?: string };
    statuses: Array<{ value: string; label: string }>;
    categories: Array<{ id: number; name: string }>;
    can: { create: boolean };
}) {
    const [search, setSearch] = useState(filters.search ?? '');

    const apply = useMemo(
        () => () => {
            router.get(
                '/contents',
                { ...filters, search: search || undefined },
                { preserveState: true, replace: true },
            );
        },
        [search, filters],
    );

    return (
        <>
            <Head title="Konten" />
            <PageHeader
                eyebrow="Editorial"
                title="Konten"
                description="Kelola artikel Anda melalui alur editorial dari draft hingga publikasi."
                actions={
                    can.create ? (
                        <Button asChild>
                            <Link href="/contents/create">
                                <Plus className="h-4 w-4" /> Konten Baru
                            </Link>
                        </Button>
                    ) : null
                }
            />

            <div className="mb-4 flex flex-wrap items-center gap-2">
                <div className="relative min-w-[220px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && apply()}
                        className="pl-9"
                        placeholder="Cari judul konten…"
                    />
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
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                {contents.data.length === 0 ? (
                    <EmptyState
                        icon={FileText}
                        title="Tidak ada konten"
                        description="Belum ada konten yang cocok dengan filter Anda."
                        action={
                            can.create ? (
                                <Button asChild variant="outline">
                                    <Link href="/contents/create">
                                        <Plus className="h-4 w-4" /> Konten Baru
                                    </Link>
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    <th className="px-4 py-3 font-semibold">Judul</th>
                                    <th className="px-4 py-3 font-semibold">Kategori</th>
                                    <th className="px-4 py-3 font-semibold">Penulis</th>
                                    <th className="px-4 py-3 font-semibold">Status</th>
                                    <th className="px-4 py-3 font-semibold">Diperbarui</th>
                                    <th className="px-4 py-3 text-right font-semibold">Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {contents.data.map((item: ContentItem) => (
                                    <tr
                                        key={item.id}
                                        className="border-b border-border transition-colors hover:bg-muted/30"
                                    >
                                        <td className="max-w-[300px] px-4 py-3">
                                            <Link href={`/contents/${item.id}`} className="group">
                                                <p className="truncate font-medium group-hover:text-accent">
                                                    {item.title}
                                                    {item.breaking_news_flag ? (
                                                        <span className="ml-1.5 text-[10px] font-bold text-primary">
                                                            BREAKING
                                                        </span>
                                                    ) : null}
                                                </p>
                                            </Link>
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">
                                            {item.category?.name ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-muted-foreground">{item.author?.name ?? '—'}</td>
                                        <td className="px-4 py-3">
                                            <StatusBadge status={item.status} />
                                        </td>
                                        <td className="px-4 py-3 text-xs text-muted-foreground">
                                            {formatDate(item.updated_at, true)}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <Button asChild variant="ghost" size="sm">
                                                <Link href={`/contents/${item.id}`}>Buka</Link>
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Pagination data={contents} />
        </>
    );
}
