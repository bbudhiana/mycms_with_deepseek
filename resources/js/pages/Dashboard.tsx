import React from 'react';
import { Head, router } from '@inertiajs/react';
import { ArrowUpRight, CalendarClock, CheckCircle2, FileEdit, Plus, Activity, FileText } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { StatusBadge, formatDate } from '@/components/status-badge';
import { ActivityTimeline, type ActivityEntry } from '@/components/activity-timeline';
import { EditorialFunnel, type FunnelStage } from '@/components/editorial-funnel';
import { UpcomingPublications, type UpcomingItem } from '@/components/upcoming-publications';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { Breadcrumbs } from '@/components/ui/breadcrumb';

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
    funnel,
    upcoming,
    isEditor,
    recentContents,
    recentActivity,
    can,
}: {
    metrics: {
        published_today: number;
        published_yesterday: number;
        pending_review: number;
        scheduled_next_24h: number;
        drafts_updated_week: number;
        drafts_updated_prior_week: number;
    };
    funnel: Record<'draft' | 'review' | 'approved' | 'published' | 'archived', number>;
    upcoming: UpcomingItem[];
    isEditor: boolean;
    recentContents: RecentContent[];
    recentActivity: ActivityEntry[];
    can: {
        manageUser: boolean;
        createContent: boolean;
        approveContent: boolean;
        publishContent: boolean;
    };
}) {
    const navigate = (href: string) => {
        router.visit(href);
    };

    const publishedDelta = metrics.published_today - metrics.published_yesterday;
    const draftsDelta = metrics.drafts_updated_week - metrics.drafts_updated_prior_week;

    const funnelStages: FunnelStage[] = [
        { key: 'draft', label: 'Draft', count: funnel.draft, tone: 'draft' },
        { key: 'review', label: 'Review', count: funnel.review, tone: 'review' },
        { key: 'approved', label: 'Disetujui', count: funnel.approved, tone: 'approved' },
        { key: 'published', label: 'Terbit', count: funnel.published, tone: 'published' },
        { key: 'archived', label: 'Arsip', count: funnel.archived, tone: 'archived' },
    ];

    return (
        <>
            <Head title="Dashboard" />
            <PageHeader
                eyebrow="Editorial Dashboard"
                title={isEditor ? 'Ringkasan Ruang Redaksi' : 'Selamat datang di Ruang Redaksi'}
                description={
                    isEditor
                        ? 'Gambaran pipeline editorial, jadwal publikasi, dan aktivitas terkini.'
                        : 'Ringkasan aktivitas editorial dan tugas Anda hari ini.'
                }
                actions={
                    can.createContent ? (
                        <Button onClick={() => navigate('/contents/create')}>
                            <Plus className="h-4 w-4" /> Konten Baru
                        </Button>
                    ) : (
                        <Button variant="outline" onClick={() => navigate('/review')}>
                            Lihat Antrean Review
                        </Button>
                    )
                }
            />
            <Breadcrumbs items={[{ label: 'Dashboard' }]} className="mb-6" />

            <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <MetricCard
                    icon={CheckCircle2}
                    tone="success"
                    label="Terbit Hari Ini"
                    value={metrics.published_today}
                    hint="Konten yang rilis sekarang"
                    delta={publishedDelta}
                    deltaLabel="vs kemarin"
                />
                <MetricCard
                    icon={FileEdit}
                    tone="warning"
                    label="Menunggu Review"
                    value={metrics.pending_review}
                    hint="Konten dalam antrean editor"
                    onClick={can.approveContent ? () => navigate('/review') : undefined}
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
                    delta={draftsDelta}
                    deltaLabel="vs pekan lalu"
                />
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
                <SectionCard
                    className="lg:col-span-2"
                    title="Alur Editorial"
                    description={
                        isEditor ? 'Distribusi status konten dan titik tersendat.' : 'Status konten Anda saat ini.'
                    }
                    action={
                        <Button variant="ghost" size="sm" onClick={() => navigate('/contents')}>
                            Semua Konten <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    }
                >
                    <EditorialFunnel stages={funnelStages} />
                </SectionCard>

                <SectionCard
                    title="Publikasi Mendatang"
                    description="5 jadwal terbit terdekat."
                    action={
                        <Button variant="ghost" size="sm" onClick={() => navigate('/contents')}>
                            Kelola <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    }
                >
                    <UpcomingPublications items={upcoming} />
                </SectionCard>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
                <SectionCard
                    title="Konten Terbaru"
                    description="10 konten terakhir yang diperbarui."
                    action={
                        <Button variant="ghost" size="sm" onClick={() => navigate('/contents')}>
                            Semua Konten <ArrowUpRight className="h-4 w-4" />
                        </Button>
                    }
                >
                    {recentContents.length === 0 ? (
                        <EmptyState
                            icon={FileText}
                            title="Belum ada konten"
                            description="Mulai tulis draft pertama Anda untuk memulai alur editorial."
                            action={
                                can.createContent ? (
                                    <Button variant="outline" onClick={() => navigate('/contents/create')}>
                                        <Plus className="h-4 w-4" /> Tulis Konten
                                    </Button>
                                ) : undefined
                            }
                        />
                    ) : (
                        <ul className="divide-y divide-border">
                            {recentContents.map((c) => (
                                <li key={c.id}>
                                    <Button
                                        onClick={() => navigate(`/contents/${c.id}`)}
                                        className="w-full justify-start text-left py-3 transition-colors duration-200 hover:bg-muted/40 -mx-2 px-2 rounded-md"
                                        variant="ghost"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <p className="truncate text-body-sm font-medium group-hover:text-foreground transition-colors">
                                                {c.title}
                                                {c.editor_pick_flag ? (
                                                    <span className="ml-2 rounded bg-accent/10 px-1.5 py-0.5 text-caption text-accent">
                                                        PILIHAN EDITOR
                                                    </span>
                                                ) : null}
                                                {c.breaking_news_flag ? (
                                                    <span className="ml-2 rounded bg-primary/10 px-1.5 py-0.5 text-caption text-primary">
                                                        BREAKING
                                                    </span>
                                                ) : null}
                                            </p>
                                            <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-caption text-muted-foreground">
                                                <span>{c.author?.name ?? 'Tanpa penulis'}</span>
                                                <span aria-hidden>·</span>
                                                <span>{c.category?.name ?? 'Tanpa kategori'}</span>
                                                <span aria-hidden>·</span>
                                                <span>{formatDate(c.updated_at, true)}</span>
                                            </p>
                                        </div>
                                        <StatusBadge status={c.status} announce={false} />
                                    </Button>
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
