import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { ArrowUpRight, CalendarClock, CheckCircle2, FileEdit, Plus, Activity } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { StatusBadge, formatDate } from '@/components/status-badge';
import { ActivityTimeline, type ActivityEntry } from '@/components/activity-timeline';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';

interface RecentContent {
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

export default function Dashboard({
    metrics,
    recentContents,
    recentActivity,
    can,
}: {
    metrics: {
        published_today: number;
        pending_review: number;
        scheduled_next_24h: number;
        drafts_updated_week: number;
    };
    recentContents: RecentContent[];
    recentActivity: ActivityEntry[];
    can: {
        manageUser: boolean;
        createContent: boolean;
        approveContent: boolean;
        publishContent: boolean;
    };
}) {
    return (
        <>
            <Head title="Dashboard" />
            <PageHeader
                eyebrow="Editorial Dashboard"
                title="Selamat datang di Ruang Redaksi"
                description="Ringkasan aktivitas editorial dan tugas Anda hari ini."
                actions={
                    can.createContent ? (
                        <Button asChild>
                            <Link href="/contents/create">
                                <Plus className="h-4 w-4" /> Konten Baru
                            </Link>
                        </Button>
                    ) : (
                        <Button asChild variant="outline" onClick={(e) => e.preventDefault()}>
                            <Link href="/review">Lihat Antrean Review</Link>
                        </Button>
                    )
                }
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    icon={CheckCircle2}
                    tone="success"
                    label="Terbit Hari Ini"
                    value={metrics.published_today}
                    hint="Konten yang rilis sekarang"
                />
                <MetricCard
                    icon={FileEdit}
                    tone="warning"
                    label="Menunggu Review"
                    value={metrics.pending_review}
                    hint="Konten dalam antrean editor"
                />
                <MetricCard
                    icon={CalendarClock}
                    tone="accent"
                    label="Terjadwal 24 Jam"
                    value={metrics.scheduled_next_24h}
                    hint="Publikasi mendatang"
                />
                <MetricCard
                    icon={Activity}
                    tone="primary"
                    label="Draft Pekan Ini"
                    value={metrics.drafts_updated_week}
                    hint="Draft yang diperbarui"
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <SectionCard
                    className="lg:col-span-2"
                    title="Konten Terbaru"
                    description="10 konten terakhir yang diperbarui."
                    action={
                        <Button asChild variant="ghost" size="sm">
                            <Link href="/contents">
                                Semua Konten <ArrowUpRight className="h-4 w-4" />
                            </Link>
                        </Button>
                    }
                >
                    {recentContents.length === 0 ? (
                        <EmptyState
                            title="Belum ada konten"
                            description="Mulai tulis draft pertama Anda untuk memulai alur editorial."
                            action={
                                can.createContent ? (
                                    <Button asChild variant="outline">
                                        <Link href="/contents/create">
                                            <Plus className="h-4 w-4" /> Tulis Konten
                                        </Link>
                                    </Button>
                                ) : undefined
                            }
                        />
                    ) : (
                        <ul className="divide-y divide-border">
                            {recentContents.map((c) => (
                                <li key={c.id}>
                                    <Link
                                        href={`/contents/${c.id}`}
                                        className="flex flex-wrap items-center gap-3 py-3 transition-colors hover:bg-muted/40 -mx-2 px-2 rounded-md"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-sm font-medium">
                                                {c.title}
                                                {c.editor_pick_flag ? (
                                                    <span className="ml-2 rounded bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
                                                        PILIHAN EDITOR
                                                    </span>
                                                ) : null}
                                            </p>
                                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
                                                <span>{c.author?.name ?? 'Tanpa penulis'}</span>
                                                <span aria-hidden>·</span>
                                                <span>{c.category?.name ?? 'Tanpa kategori'}</span>
                                                <span aria-hidden>·</span>
                                                <span>{formatDate(c.updated_at, true)}</span>
                                            </p>
                                        </div>
                                        <StatusBadge status={c.status} />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    )}
                </SectionCard>

                <SectionCard title="Aktivitas Terbaru" description="10 aktivitas terakhir di sistem.">
                    <ActivityTimeline activities={recentActivity} />
                </SectionCard>
            </div>
        </>
    );
}
