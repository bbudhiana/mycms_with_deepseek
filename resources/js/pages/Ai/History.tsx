import React from 'react';
import { Head, router } from '@inertiajs/react';
import { FileText, Clock, FileCheck, FileX2 } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/feedback';
import { Input } from '@/components/ui/input';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { StatusBadge, formatDate } from '@/components/status-badge';

interface HistoryItem {
    id: number;
    status: string;
    error_message: string | null;
    generated_at: string | null;
    content: { id: number; title: string; status: string } | null;
    schedule: { id: number; name: string } | null;
}

interface Paginator {
    data: HistoryItem[];
    links: { url: string | null; label: string; active: boolean }[];
    current_page: number;
    last_page: number;
    total: number;
    from: number | null;
    to: number | null;
    per_page: number;
}

interface Stats {
    total: number;
    last: string | null;
    perStatus: Record<string, number>;
}

const historyTone: Record<string, 'default' | 'success' | 'destructive'> = {
    draft: 'default',
    published: 'success',
    failed: 'destructive',
};

export default function AiHistoryPage({
    history,
    filters,
    statuses,
    stats,
}: {
    history: Paginator;
    filters: { status?: string; search?: string; sort?: string };
    statuses: { value: string; label: string }[];
    stats: Stats;
}) {
    const applyFilter = (key: string, value: string) => {
        router.get('/ai/history', { ...filters, [key]: value || undefined }, { preserveState: true, replace: true });
    };

    const totalDraft = stats.perStatus.draft ?? 0;
    const totalPublished = stats.perStatus.published ?? 0;
    const totalFailed = stats.perStatus.failed ?? 0;

    return (
        <>
            <Head title="Riwayat Autopilot" />
            <PageHeader
                eyebrow="Integrasi AI"
                title="Riwayat Autopilot"
                description="Daftar draf yang disusun autopilot — apa yang berhasil/gagal, apa yang sudah terbit."
            />

            <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <MetricCard label="Total Draft" value={stats.total} icon={FileText} hint="Total konten dari autopilot" />
                <MetricCard
                    label="Terakhir Disusun"
                    value={stats.last ? new Date(stats.last).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : '—'}
                    icon={Clock}
                    hint={stats.last ? formatDate(stats.last) : 'Belum ada'}
                />
                <MetricCard label="Draft" value={totalDraft} icon={FileCheck} tone="warning" hint="Menunggu review editor" />
                <MetricCard label="Terbit" value={totalPublished} icon={FileCheck} tone="success" hint="Auto-terbit langsung" />
            </div>

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                    placeholder="Cari judul..."
                    defaultValue={filters.search ?? ''}
                    onChange={(e) => applyFilter('search', e.target.value)}
                    className="sm:max-w-xs"
                />
                <Select
                    value={filters.status ?? 'all'}
                    onValueChange={(v) => applyFilter('status', v === 'all' ? '' : v)}
                >
                    <SelectTrigger className="sm:w-44">
                        <SelectValue />
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
            </div>

            {history.data.length === 0 ? (
                <EmptyState
                    icon={FileText}
                    title="Belum ada riwayat"
                    description="Setelah autopilot berjalan, daftar konten yang disusun akan muncul di sini."
                />
            ) : (
                <div className="space-y-2">
                    {history.data.map((item) => (
                        <div
                            key={item.id}
                            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm"
                        >
                            <div className="min-w-0">
                                <p className="truncate font-medium">{item.content?.title ?? 'Konten dihapus'}</p>
                                <p className="mt-0.5 text-xs text-muted-foreground">
                                    {item.schedule?.name ?? 'Jadwal dihapus'}
                                    {item.generated_at ? ` · ${formatDate(item.generated_at)}` : ''}
                                </p>
                                {item.error_message && (
                                    <p className="mt-1 text-xs text-destructive">{item.error_message}</p>
                                )}
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                <Badge tone={historyTone[item.status] ?? 'default'}>
                                    {item.status === 'draft' && 'Draft'}
                                    {item.status === 'published' && 'Terbit'}
                                    {item.status === 'failed' && 'Gagal'}
                                </Badge>
                                {item.content && <StatusBadge status={item.content.status} announce={false} />}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {history.last_page > 1 && (
                <Pagination data={history} />
            )}
        </>
    );
}
