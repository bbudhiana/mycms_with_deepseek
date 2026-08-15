import { useState } from 'react';
import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import { Plus, Search, RefreshCw, Pencil, Trash2, Power, Mail } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/feedback';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
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
    roles: RoleRef[];
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
}

interface Can {
    manage: boolean;
    changeRole: boolean;
}

interface Props {
    users: Paginator;
    filters: Filters;
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

export default function UsersIndex({ users, filters, roles, can }: Props) {
    const { auth } = usePage().props as unknown as { auth: { user: { id: number } } };
    const currentUserId = auth?.user?.id;

    const [search, setSearch] = useState(filters.search ?? '');
    const [role, setRole] = useState(filters.role ?? 'all');
    const [status, setStatus] = useState(filters.status ?? 'all');
    const deleteConfirm = useConfirmDialog();
    const toggleForm = useForm({ activate: false });

    const applyFilters = (next: { search?: string; role?: string; status?: string }) => {
        router.get('/users', next, { preserveState: true, replace: true });
    };

    const toggleActive = (user: User) => {
        toggleForm.setData('activate', !user.is_active);
        toggleForm.post(`/users/${user.id}/toggle-active`, { preserveScroll: true });
    };

    return (
        <>
            <Head title="Pengguna" />
            <PageHeader
                eyebrow="Akses"
                title="Pengguna"
                description="Kelola akun, peran, dan status pengguna di sistem."
                actions={
                    can.manage ? (
                        <Button asChild>
                            <Link href="/users/create">
                                <Plus className="h-4 w-4" />
                                Tambah User
                            </Link>
                        </Button>
                    ) : undefined
                }
            />

            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                <div className="relative flex-1 sm:max-w-xs">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && applyFilters({ search, role, status })}
                        placeholder="Cari nama atau email..."
                        className="pl-9"
                    />
                </div>
                <Select
                    value={role}
                    onValueChange={(v) => {
                        setRole(v);
                        applyFilters({ search, role: v, status });
                    }}
                >
                    <SelectTrigger className="w-full sm:w-40">
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
                <Select
                    value={status}
                    onValueChange={(v) => {
                        setStatus(v);
                        applyFilters({ search, role, status: v });
                    }}
                >
                    <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Semua status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">Semua Status</SelectItem>
                        <SelectItem value="active">Aktif</SelectItem>
                        <SelectItem value="inactive">Nonaktif</SelectItem>
                    </SelectContent>
                </Select>
                {(filters.search ||
                    (filters.role && filters.role !== 'all') ||
                    (filters.status && filters.status !== 'all')) && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => applyFilters({})}>
                        <RefreshCw className="h-4 w-4" />
                        Reset
                    </Button>
                )}
            </div>

            {users.data.length === 0 ? (
                <EmptyState
                    icon={Mail}
                    title="Tidak ada pengguna"
                    description="Tidak ada pengguna yang cocok dengan pencarian atau filter."
                />
            ) : (
                <Card className="overflow-hidden">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    Nama
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground md:table-cell">
                                    Email
                                </th>
                                <th className="hidden px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground sm:table-cell">
                                    Peran
                                </th>
                                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    Status
                                </th>
                                {(can.manage || can.changeRole) && (
                                    <th className="px-4 py-3 text-right text-xs uppercase tracking-wide text-muted-foreground">
                                        Aksi
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody>
                            {users.data.map((user) => {
                                const isSelf = user.id === currentUserId;
                                return (
                                    <tr key={user.id} className="border-b border-border hover:bg-muted/40">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-3">
                                                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                                                    {initials(user.name)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium">
                                                        {user.name}
                                                        {isSelf && (
                                                            <span className="ml-1.5 text-xs font-normal text-muted-foreground">
                                                                (Anda)
                                                            </span>
                                                        )}
                                                    </p>
                                                    {user.job_title && (
                                                        <p className="truncate text-xs text-muted-foreground">
                                                            {user.job_title}
                                                        </p>
                                                    )}
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
                                            <Badge tone={user.is_active ? 'success' : 'destructive'}>
                                                <span
                                                    className={cn(
                                                        'h-1.5 w-1.5 rounded-full',
                                                        user.is_active ? 'bg-current' : 'bg-current',
                                                    )}
                                                />
                                                {user.is_active ? 'Aktif' : 'Nonaktif'}
                                            </Badge>
                                        </td>
                                        {(can.manage || can.changeRole) && (
                                            <td className="px-4 py-3">
                                                <div className="flex justify-end gap-1">
                                                    <Button asChild variant="ghost" size="iconSm">
                                                        <Link href={`/users/${user.id}`}>
                                                            <Pencil className="h-3.5 w-3.5" />
                                                        </Link>
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="iconSm"
                                                        onClick={() => toggleActive(user)}
                                                        disabled={toggleForm.processing}
                                                        title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                    >
                                                        <Power
                                                            className={cn(
                                                                'h-3.5 w-3.5',
                                                                !user.is_active && 'text-success',
                                                            )}
                                                        />
                                                    </Button>
                                                    {!isSelf && can.manage && (
                                                        <Button
                                                            variant="ghost"
                                                            size="iconSm"
                                                            className="text-destructive hover:text-destructive"
                                                            onClick={() =>
                                                                deleteConfirm.confirm({
                                                                    title: 'Hapus pengguna',
                                                                    description: `Hapus akun "${user.name}" secara permanen?`,
                                                                    onConfirm: () => router.delete(`/users/${user.id}`),
                                                                })
                                                            }
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    )}
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
            <Pagination data={users} />
        </>
    );
}
