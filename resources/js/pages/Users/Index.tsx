import { useEffect, useRef, useState } from 'react';
import { Head, router, useForm, usePage } from '@inertiajs/react';
import { Plus, Search, X, Pencil, Trash2, Power, Users as UsersIcon, UserCheck, UserX, MailWarning, Newspaper } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/feedback';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { relativeTime } from '@/components/content-row-card';
import { formatDate } from '@/components/status-badge';
import { cn } from '@/lib/utils';

interface RoleRef {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    job_title?: string | null;
    is_active: boolean;
    email_verified_at?: string | null;
    profile_photo_url?: string | null;
    roles: RoleRef[];
    contents_count: number;
    published_author_count: number;
    reviews_count: number;
    contents_max_updated_at?: string | null;
    last_login_at?: string | null;
}

interface Paginator {
    data: User[];
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
    role?: string;
    status?: string;
    verified?: string;
    sort?: string;
}

interface Stats {
    total: number;
    active: number;
    inactive: number;
    unverified: number;
}

interface Can {
    manage: boolean;
    changeRole: boolean;
}

interface Props {
    users: Paginator;
    filters: Filters;
    stats: Stats;
    roles: RoleRef[];
    can: Can;
}

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');
}

export default function UsersIndex({ users, filters, stats, roles, can }: Props) {
    const { auth } = usePage().props as unknown as { auth: { user: { id: number } } };
    const currentUserId = auth?.user?.id;

    const [search, setSearch] = useState(filters.search ?? '');
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search ?? '');
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const deleteConfirm = useConfirmDialog();
    const toggleForm = useForm({ activate: false });

    const sort = filters.sort ?? 'name';
    const status = filters.status ?? 'all';
    const verified = filters.verified ?? 'all';

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
            '/users',
            { ...filters, search: debouncedSearch || undefined },
            { preserveState: true, replace: true },
        );
    }, [debouncedSearch]);

    const applyFilters = (patch: Record<string, string | undefined>) => {
        router.get('/users', { ...filters, ...patch }, { preserveState: true, replace: true });
    };

    const submitToggle = (user: User) => {
        toggleForm.setData('activate', !user.is_active);
        toggleForm.post(`/users/${user.id}/toggle-active`, { preserveScroll: true });
    };

    const toggleActive = (user: User) => {
        if (user.is_active) {
            deleteConfirm.confirm({
                title: 'Nonaktifkan pengguna',
                description: `Hentikan akses "${user.name}"? Pengguna tidak dapat masuk ke sistem sampai diaktifkan kembali.`,
                confirmLabel: 'Nonaktifkan',
                onConfirm: () => submitToggle(user),
            });
        } else {
            submitToggle(user);
        }
    };

    const confirmDelete = (user: User) => {
        const contentNote =
            user.contents_count > 0
                ? `Akun ini penulis ${user.contents_count} konten — konten akan tetap ada tanpa byline.`
                : 'Tidak ada konten yang terkait dengan akun ini.';

        deleteConfirm.confirm({
            title: 'Hapus pengguna',
            description: `Hapus akun "${user.name}" secara permanen? ${contentNote}`,
            onConfirm: () => router.delete(`/users/${user.id}`),
        });
    };

    const rows = (users.data as User[]) ?? [];

    const contributionText = (user: User) => {
        const parts = [
            `${user.published_author_count} terbit`,
            `${user.contents_count - user.published_author_count} draft`,
        ];
        if (user.reviews_count > 0) parts.push(`${user.reviews_count} review`);

        return parts.join(' · ');
    };

    const lastContributed = (user: User) => {
        if (!user.contents_max_updated_at) {
            return <span className="text-muted-foreground/50">Belum berkontribusi</span>;
        }

        return (
            <span className="text-xs text-muted-foreground" title={formatDate(user.contents_max_updated_at, false)}>
                {relativeTime(user.contents_max_updated_at)}
            </span>
        );
    };

    const lastLogin = (user: User) => {
        if (!user.last_login_at) {
            return <span className="text-muted-foreground/50">Belum pernah login</span>;
        }

        return (
            <span className="text-xs text-muted-foreground" title={formatDate(user.last_login_at, false)}>
                {relativeTime(user.last_login_at)}
            </span>
        );
    };

    const avatar = (user: User) => {
        if (user.profile_photo_url) {
            return (
                <img
                    src={user.profile_photo_url}
                    alt=""
                    loading="lazy"
                    className="h-9 w-9 shrink-0 rounded-full object-cover"
                />
            );
        }

        return (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                {initials(user.name)}
            </div>
        );
    };

    const actionButtons = (user: User) => {
        if (!(can.manage || can.changeRole)) return null;
        const isSelf = user.id === currentUserId;

        return (
            <div className="flex justify-end gap-1">
                <Button variant="ghost" size="iconSm" onClick={() => router.visit(`/users/${user.id}`)} aria-label={`Edit ${user.name}`}>
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                {!isSelf && (
                    <Button
                        variant="ghost"
                        size="iconSm"
                        onClick={() => toggleActive(user)}
                        disabled={toggleForm.processing}
                        title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        aria-label={user.is_active ? `Nonaktifkan ${user.name}` : `Aktifkan ${user.name}`}
                    >
                        <Power
                            className={cn('h-3.5 w-3.5', !user.is_active && 'text-success')}
                        />
                    </Button>
                )}
                {!isSelf && can.manage && (
                    <Button
                        variant="ghost"
                        size="iconSm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => confirmDelete(user)}
                        aria-label={`Hapus ${user.name}`}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                )}
            </div>
        );
    };

    const kpiCards = [
        {
            key: 'total',
            label: 'Total Pengguna',
            value: stats.total,
            icon: UsersIcon,
            active: status === 'all' && verified === 'all',
            onClick: () => applyFilters({ status: undefined, verified: undefined }),
            hint: 'Seluruh akun',
        },
        {
            key: 'active',
            label: 'Aktif',
            value: stats.active,
            icon: UserCheck,
            tone: 'success' as const,
            active: status === 'active',
            onClick: () => applyFilters({ status: 'active', verified: undefined }),
            hint: 'Dapat masuk ke sistem',
        },
        {
            key: 'inactive',
            label: 'Nonaktif',
            value: stats.inactive,
            icon: UserX,
            tone: 'warning' as const,
            active: status === 'inactive',
            onClick: () => applyFilters({ status: 'inactive', verified: undefined }),
            hint: 'Akses dihentikan',
        },
        {
            key: 'unverified',
            label: 'Belum Verifikasi',
            value: stats.unverified,
            icon: MailWarning,
            active: verified === 'no',
            onClick: () => applyFilters({ verified: 'no', status: undefined }),
            hint: 'Email belum dikonfirmasi',
        },
    ];

    return (
        <>
            <Head title="Pengguna" />
            <PageHeader
                eyebrow="Akses"
                title="Pengguna"
                description="Kelola akun, peran, dan kontribusi pengguna di sistem."
                actions={
                    can.manage ? (
                        <Button onClick={() => router.visit('/users/create')}>
                            <Plus className="h-4 w-4" />
                            Tambah User
                        </Button>
                    ) : undefined
                }
            />

            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                {kpiCards.map((card) => (
                    <MetricCard
                        key={card.key}
                        label={card.label}
                        value={card.value}
                        icon={card.icon}
                        tone={card.tone}
                        hint={card.hint}
                        active={card.active}
                        onClick={card.onClick}
                    />
                ))}
            </div>

            <div className="mb-4 flex flex-col gap-3 lg:flex-row lg:items-center">
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="pl-9 pr-9"
                        placeholder="Cari nama atau email..."
                        aria-label="Cari nama atau email"
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

                <Select value={sort} onValueChange={(v) => applyFilters({ sort: v })}>
                    <SelectTrigger className="w-full sm:w-[200px]" aria-label="Urutkan pengguna">
                        <SelectValue placeholder="Urutkan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="name">Nama</SelectItem>
                        <SelectItem value="created">Terbaru dibuat</SelectItem>
                        <SelectItem value="contributions">Terbanyak kontribusi</SelectItem>
                        <SelectItem value="login">Terbaru login</SelectItem>
                    </SelectContent>
                </Select>

                <Select
                    value={filters.role ?? 'all'}
                    onValueChange={(v) => applyFilters({ role: v === 'all' ? undefined : v })}
                >
                    <SelectTrigger className="w-full sm:w-40" aria-label="Filter peran">
                        <SelectValue placeholder="Semua peran" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Peran</SelectItem>
                        {roles.map((r) => (
                            <SelectItem key={r.id} value={r.name}>
                                {r.name}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(filters.search ||
                    (filters.role && filters.role !== 'all') ||
                    (filters.status && filters.status !== 'all') ||
                    (filters.verified && filters.verified !== 'all')) && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => applyFilters({})}>
                        <X className="h-4 w-4" />
                        Reset
                    </Button>
                )}
            </div>

            {rows.length === 0 ? (
                <EmptyState
                    icon={MailWarning}
                    title={stats.total === 0 ? 'Belum ada pengguna' : 'Tidak ada hasil'}
                    description={
                        stats.total === 0
                            ? 'Buat pengguna pertama untuk mulai mengelola tim.'
                            : 'Tidak ada pengguna yang cocok dengan pencarian atau filter.'
                    }
                    action={
                        stats.total === 0 && can.manage ? (
                            <Button type="button" onClick={() => router.visit('/users/create')}>
                                <Plus className="h-4 w-4" />
                                Tambah User
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <>
                    <div className="space-y-3 md:hidden">
                        {rows.map((user) => {
                            const isSelf = user.id === currentUserId;
                            return (
                                <Card key={user.id} className="p-4">
                                    <div className="flex items-start gap-3">
                                        {avatar(user)}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">
                                                        {user.name}
                                                        {isSelf && (
                                                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                                                (Anda)
                                                            </span>
                                                        )}
                                                    </p>
                                                    {user.job_title ? (
                                                        <p className="truncate text-xs text-muted-foreground">{user.job_title}</p>
                                                    ) : null}
                                                </div>
                                                {actionButtons(user)}
                                            </div>
                                            <div className="mt-2 flex flex-wrap items-center gap-2">
                                                <Badge tone={user.is_active ? 'success' : 'destructive'}>
                                                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                                                </Badge>
                                                {!user.email_verified_at ? (
                                                    <Badge tone="warning">Email belum diverifikasi</Badge>
                                                ) : null}
                                                {user.roles.map((r) => (
                                                    <Badge key={r.id} tone="default">
                                                        {r.name}
                                                    </Badge>
                                                ))}
                                            </div>
                                            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
                                                {contributionText(user)}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Terakhir berkontribusi: {lastContributed(user)}
                                            </p>
                                            <p className="mt-0.5 text-xs text-muted-foreground">
                                                Terakhir login: {lastLogin(user)}
                                            </p>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>

                    <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm" role="grid">
                                <thead>
                                    <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        <th scope="col" className="px-4 py-3 font-semibold">
                                            Nama
                                        </th>
                                        <th scope="col" className="hidden px-4 py-3 font-semibold md:table-cell">
                                            Email
                                        </th>
                                        <th scope="col" className="hidden px-4 py-3 font-semibold sm:table-cell">
                                            Peran
                                        </th>
                                        <th scope="col" className="px-4 py-3 font-semibold">
                                            Kontribusi
                                        </th>
                                        <th scope="col" className="hidden px-4 py-3 font-semibold xl:table-cell">
                                            Terakhir berkontribusi
                                        </th>
                                        <th scope="col" className="hidden px-4 py-3 font-semibold xl:table-cell">
                                            Terakhir login
                                        </th>
                                        <th scope="col" className="px-4 py-3 font-semibold">
                                            Status
                                        </th>
                                        {(can.manage || can.changeRole) && (
                                            <th scope="col" className="px-4 py-3 text-right font-semibold">
                                                Aksi
                                            </th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rows.map((user) => {
                                        const isSelf = user.id === currentUserId;
                                        return (
                                            <tr
                                                key={user.id}
                                                className="border-b border-border transition-colors duration-200 hover:bg-muted/30"
                                            >
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-3">
                                                        {avatar(user)}
                                                        <div className="min-w-0">
                                                            <p className="truncate font-medium">
                                                                {user.name}
                                                                {isSelf && (
                                                                    <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                                                        (Anda)
                                                                    </span>
                                                                )}
                                                            </p>
                                                            {user.job_title ? (
                                                                <p className="truncate text-xs text-muted-foreground">
                                                                    {user.job_title}
                                                                </p>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                                                    {user.email}
                                                </td>
                                                <td className="hidden px-4 py-3 sm:table-cell">
                                                    <div className="flex flex-wrap gap-1">
                                                        {user.roles.map((r) => (
                                                            <Badge key={r.id} tone="default">
                                                                {r.name}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <p className="text-xs tabular-nums">
                                                        <span className="font-semibold text-success">
                                                            {user.published_author_count}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {' '}
                                                            terbit · {user.contents_count - user.published_author_count} draft
                                                        </span>
                                                    </p>
                                                    {user.reviews_count > 0 ? (
                                                        <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                                                            {user.reviews_count} review
                                                        </p>
                                                    ) : null}
                                                </td>
                                                <td className="hidden px-4 py-3 xl:table-cell">{lastContributed(user)}</td>
                                                <td className="hidden px-4 py-3 xl:table-cell">{lastLogin(user)}</td>
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col items-start gap-1">
                                                        <Badge tone={user.is_active ? 'success' : 'destructive'}>
                                                            {user.is_active ? 'Aktif' : 'Nonaktif'}
                                                        </Badge>
                                                        {!user.email_verified_at ? (
                                                            <Badge tone="warning">Belum verifikasi</Badge>
                                                        ) : null}
                                                    </div>
                                                </td>
                                                {(can.manage || can.changeRole) && (
                                                    <td className="px-4 py-3">{actionButtons(user)}</td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            <Pagination data={users} />
            <ConfirmDialog dialog={deleteConfirm.dialog} />
        </>
    );
}