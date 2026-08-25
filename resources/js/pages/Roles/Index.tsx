import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { ShieldCheck, Users, Plus, Pencil, Trash2, Check, Minus, Lock, KeyRound, EyeOff } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { MetricCard } from '@/components/metric-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/controls';
import { EmptyState } from '@/components/ui/feedback';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { cn } from '@/lib/utils';

interface Permission {
    id: number;
    name: string;
    label: string;
    group: string;
    critical: boolean;
}

interface RolePermission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: RolePermission[];
    users_count: number;
    protected: boolean;
}

interface Can {
    changeRole: boolean;
    manageUser: boolean;
}

interface Stats {
    totalRoles: number;
    totalPermissions: number;
    busiestRole: { name: string; users_count: number } | null;
    rarestPermission: { name: string; label: string; roles_count: number } | null;
}

interface Props {
    roles: Role[];
    permissions: Permission[];
    permissionGroups: string[];
    stats: Stats;
    can: Can;
}

const formatRoleName = (name: string) =>
    name
        .split(/[_\s]+/)
        .filter(Boolean)
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');

export default function RolesIndex({ roles, permissions, permissionGroups, stats, can }: Props) {
    const [highlightedRoleId, setHighlightedRoleId] = useState<number | null>(null);
    const [dialog, setDialog] = useState<{ mode: 'create' } | { mode: 'edit'; role: Role } | null>(null);
    const deleteConfirm = useConfirmDialog();

    const permissionByLabel = new Map(permissions.map((p) => [p.name, p]));
    const grouped = permissionGroups
        .map((group) => ({
            name: group,
            permissions: permissions.filter((p) => p.group === group),
        }))
        .filter((group) => group.permissions.length > 0);

    const navigateToUsers = (roleName: string) => router.visit(`/users?role=${roleName}`);

    const confirmDelete = (role: Role) => {
        deleteConfirm.confirm({
            title: 'Hapus peran',
            description: `Hapus peran "${formatRoleName(role.name)}"? Tindakan ini tidak dapat dibatalkan.`,
            confirmVariant: 'destructive',
            onConfirm: () => router.delete(`/roles/${role.id}`),
        });
    };

    const permissionBadges = (role: Role) => (
        <div className="flex flex-wrap gap-1.5">
            {role.permissions.length === 0 && (
                <span className="text-sm text-muted-foreground">Tidak ada izin</span>
            )}
            {role.permissions.map((p) => {
                const meta = permissionByLabel.get(p.name);

                return (
                    <Badge key={p.id} tone={meta?.critical ? 'warning' : 'default'} title={p.name}>
                        {meta?.label ?? p.name}
                    </Badge>
                );
            })}
        </div>
    );

    const roleActions = (role: Role) => {
        if (!can.changeRole || role.protected) return null;

        return (
            <div className="flex gap-1">
                <Button
                    type="button"
                    variant="ghost"
                    size="iconSm"
                    onClick={() => setDialog({ mode: 'edit', role })}
                    aria-label={`Edit peran ${formatRoleName(role.name)}`}
                >
                    <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                    type="button"
                    variant="ghost"
                    size="iconSm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => confirmDelete(role)}
                    disabled={role.users_count > 0}
                    title={
                        role.users_count > 0
                            ? 'Peran yang masih dipakai tidak bisa dihapus'
                            : `Hapus peran ${formatRoleName(role.name)}`
                    }
                    aria-label={`Hapus peran ${formatRoleName(role.name)}`}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </Button>
            </div>
        );
    };

    const userBadge = (role: Role) => (
        <button
            type="button"
            onClick={() => navigateToUsers(role.name)}
            title={`Lihat pengguna berperan ${formatRoleName(role.name)}`}
            className="focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded"
        >
            <Badge tone="default" className="gap-1 tabular-nums transition-colors duration-200 hover:border-primary/40 hover:text-primary">
                <Users className="h-3 w-3" />
                {role.users_count} pengguna
            </Badge>
        </button>
    );

    const hasAnyRoles = roles.length > 0;

    return (
        <>
            <Head title="Peran & Izin" />
            <PageHeader
                eyebrow="Akses"
                title="Peran & Izin"
                description="Ringkasan peran yang tersedia beserta izin dan jumlah penggunanya."
                actions={
                    can.changeRole ? (
                        <Button type="button" onClick={() => setDialog({ mode: 'create' })}>
                            <Plus className="h-4 w-4" />
                            Tambah Peran
                        </Button>
                    ) : undefined
                }
            />

            <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <MetricCard label="Total Peran" value={stats.totalRoles} icon={ShieldCheck} hint="Seluruh peran terdaftar" />
                <MetricCard label="Total Izin" value={stats.totalPermissions} icon={KeyRound} tone="accent" hint="Seluruh izin di sistem" />
                <MetricCard
                    label="Peran Terpadat"
                    value={stats.busiestRole?.users_count ?? 0}
                    icon={Users}
                    tone="success"
                    hint={stats.busiestRole ? `Terbanyak: ${formatRoleName(stats.busiestRole.name)}` : 'Belum ada pengguna'}
                />
                <MetricCard
                    label="Izin Tersepi"
                    value={stats.rarestPermission?.roles_count ?? 0}
                    icon={EyeOff}
                    tone="warning"
                    hint={stats.rarestPermission ? `Paling sedikit: ${stats.rarestPermission.label}` : 'Belum ada izin'}
                />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => (
                    <Card key={role.id} className="flex flex-col">
                        <div className="flex items-start justify-between gap-3 p-5 pb-0">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <div>
                                    <h3 className="font-display text-base font-semibold">{formatRoleName(role.name)}</h3>
                                    {role.protected && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-warning">
                                            <Lock className="h-3 w-3" />
                                            Peran dilindungi
                                        </span>
                                    )}
                                </div>
                            </div>
                            {userBadge(role)}
                        </div>
                        <div className="flex flex-1 flex-col p-5">
                            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                                Izin ({role.permissions.length})
                            </p>
                            {permissionBadges(role)}
                            <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                                <span className="text-xs text-muted-foreground">
                                    {role.protected ? 'Tidak dapat diubah' : 'Dapat diubah'}
                                </span>
                                {roleActions(role)}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="mt-8">
                <div className="mb-3 flex items-baseline justify-between gap-3">
                    <h2 className="font-display text-lg font-semibold">Matriks Izin</h2>
                    <p className="hidden text-xs text-muted-foreground sm:block">
                        Klik nama peran untuk menyorot kolomnya.
                    </p>
                </div>
                {!hasAnyRoles ? (
                    <EmptyState
                        icon={ShieldCheck}
                        title="Belum ada peran"
                        description="Buat peran pertama untuk mulai mengatur akses redaksi."
                        action={
                            can.changeRole ? (
                                <Button type="button" onClick={() => setDialog({ mode: 'create' })}>
                                    <Plus className="h-4 w-4" />
                                    Tambah Peran
                                </Button>
                            ) : undefined
                        }
                    />
                ) : (
                    <Card className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-border">
                                    <th className="sticky left-0 z-20 bg-card px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                        Izin
                                    </th>
                                    {roles.map((role) => {
                                        const isHighlighted = highlightedRoleId === role.id;

                                        return (
                                            <th
                                                key={role.id}
                                                className={cn(
                                                    'min-w-[130px] px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide transition-colors duration-200',
                                                    isHighlighted ? 'bg-primary/10 text-primary' : 'text-muted-foreground',
                                                )}
                                            >
                                                <button
                                                    type="button"
                                                    onClick={() => setHighlightedRoleId(isHighlighted ? null : role.id)}
                                                    aria-pressed={isHighlighted}
                                                    className={cn(
                                                        'inline-flex items-center gap-1 rounded px-1.5 py-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                                                        isHighlighted && 'ring-1 ring-primary/30',
                                                    )}
                                                    title={
                                                        isHighlighted
                                                            ? 'Sembunyikan penyorotan'
                                                            : `Sorot peran ${formatRoleName(role.name)}`
                                                    }
                                                >
                                                    {formatRoleName(role.name)}
                                                    {role.protected && <Lock className="h-3 w-3" />}
                                                </button>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody>
                                {grouped.map((group) => (
                                    <PermissionGroupRows
                                        key={group.name}
                                        group={group}
                                        roles={roles}
                                        highlightedRoleId={highlightedRoleId}
                                    />
                                ))}
                            </tbody>
                        </table>
                    </Card>
                )}
                {hasAnyRoles && permissions.length === 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">Belum ada izin yang terdaftar.</p>
                )}
            </div>

            <ConfirmDialog dialog={deleteConfirm.dialog} />

            {dialog && (
                <RoleDialog
                    key={dialog.mode === 'edit' ? dialog.role.id : 'create'}
                    mode={dialog.mode}
                    role={dialog.mode === 'edit' ? dialog.role : null}
                    permissions={permissions}
                    permissionGroups={permissionGroups}
                    onClose={() => setDialog(null)}
                />
            )}
        </>
    );
}

function PermissionGroupRows({
    group,
    roles,
    highlightedRoleId,
}: {
    group: { name: string; permissions: Permission[] };
    roles: Role[];
    highlightedRoleId: number | null;
}) {
    return (
        <>
            <tr className="border-b border-border bg-muted/40">
                <td className="sticky left-0 z-10 bg-muted/40 px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {group.name}
                </td>
                <td colSpan={roles.length} className="px-4 py-2 text-left text-xs text-muted-foreground/60">
                    {group.permissions.length} izin
                </td>
            </tr>
            {group.permissions.map((permission) => (
                <tr key={permission.id} className="border-b border-border transition-colors duration-200 hover:bg-muted/30">
                    <td className="sticky left-0 z-10 bg-card px-4 py-2.5 transition-colors duration-200 group-hover:bg-muted/30">
                        <span className="flex items-center gap-2">
                            {permission.critical && (
                                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-warning" title="Izin berisiko tinggi" />
                            )}
                            <span className="font-medium">{permission.label}</span>
                        </span>
                    </td>
                    {roles.map((role) => {
                        const granted = role.permissions.some((p) => p.id === permission.id);
                        const isHighlighted = highlightedRoleId === role.id;

                        return (
                            <td
                                key={role.id}
                                className={cn(
                                    'px-4 py-2.5 text-center transition-colors duration-200',
                                    isHighlighted && 'bg-primary/5',
                                )}
                            >
                                {granted ? (
                                    <span
                                        className={cn(
                                            'inline-flex h-6 w-6 items-center justify-center rounded-full',
                                            permission.critical
                                                ? 'bg-warning/10 text-warning'
                                                : 'bg-success/10 text-success',
                                        )}
                                    >
                                        <Check className="h-4 w-4" />
                                    </span>
                                ) : (
                                    <Minus className="mx-auto h-4 w-4 text-muted-foreground/40" />
                                )}
                            </td>
                        );
                    })}
                </tr>
            ))}
        </>
    );
}

function RoleDialog({
    mode,
    role,
    permissions,
    permissionGroups,
    onClose,
}: {
    mode: 'create' | 'edit';
    role: Role | null;
    permissions: Permission[];
    permissionGroups: string[];
    onClose: () => void;
}) {
    const isEdit = mode === 'edit';
    const form = useForm({
        name: role?.name ?? '',
        permissions: role?.permissions.map((p) => p.name) ?? ['login'],
    });

    const grouped = permissionGroups
        .map((group) => ({
            name: group,
            permissions: permissions.filter((p) => p.group === group),
        }))
        .filter((group) => group.permissions.length > 0);

    const togglePermission = (name: string) => {
        form.setData(
            'permissions',
            form.data.permissions.includes(name)
                ? form.data.permissions.filter((n) => n !== name)
                : [...form.data.permissions, name],
        );
    };

    const toggleGroup = (group: { name: string; permissions: Permission[] }, checked: boolean | 'indeterminate') => {
        const names = group.permissions.map((p) => p.name);
        const hasAll = names.every((n) => form.data.permissions.includes(n));

        form.setData(
            'permissions',
            checked === true || (checked === 'indeterminate' && !hasAll)
                ? [...new Set([...form.data.permissions, ...names])]
                : form.data.permissions.filter((n) => !names.includes(n)),
        );
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEdit && role) {
            form.patch(`/roles/${role.id}`);
        } else {
            form.post('/roles');
        }
    };

    return (
        <Dialog open onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{isEdit ? `Edit Peran · ${formatRoleName(role!.name)}` : 'Tambah Peran'}</DialogTitle>
                    <DialogDescription>
                        {isEdit
                            ? 'Ubah nama dan atur izin untuk peran ini.'
                            : 'Buat peran baru dan tentukan izin yang dimilikinya.'}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={submit} className="mt-4 space-y-4">
                    <div>
                        <Label htmlFor="role-name">Nama Peran</Label>
                        <Input
                            id="role-name"
                            value={form.data.name}
                            onChange={(e) => form.setData('name', e.target.value)}
                            placeholder="mis. reporter"
                            className="mt-1"
                        />
                        <FieldError error={form.errors.name} />
                    </div>

                    <div>
                        <div className="mb-2 flex items-center justify-between">
                            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                                Izin ({form.data.permissions.length} dipilih)
                            </p>
                            {form.errors.permissions && <FieldError error={form.errors.permissions} />}
                        </div>
                        <div className="space-y-4 rounded-lg border border-border bg-muted/20 p-4">
                            {grouped.map((group) => {
                                const selectedCount = group.permissions.filter((p) =>
                                    form.data.permissions.includes(p.name),
                                ).length;
                                const allSelected = selectedCount === group.permissions.length;
                                const someSelected = selectedCount > 0 && !allSelected;

                                return (
                                    <div key={group.name}>
                                        <label className="mb-1.5 flex cursor-pointer items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                            <Checkbox
                                                checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                                                onCheckedChange={(checked) => toggleGroup(group, checked)}
                                            />
                                            {group.name}
                                            <span className="tabular-nums opacity-60">{selectedCount}</span>
                                        </label>
                                        <div className="grid gap-x-4 gap-y-1.5 sm:grid-cols-2">
                                            {group.permissions.map((permission) => (
                                                <label
                                                    key={permission.id}
                                                    className="flex cursor-pointer items-start gap-2 rounded px-1 py-0.5 text-sm transition-colors duration-150 hover:bg-muted"
                                                >
                                                    <Checkbox
                                                        checked={form.data.permissions.includes(permission.name)}
                                                        onCheckedChange={() => togglePermission(permission.name)}
                                                    />
                                                    <span className="leading-snug">
                                                        {permission.label}
                                                        {permission.critical && (
                                                            <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-warning align-middle" />
                                                        )}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={onClose}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={form.processing}>
                            {isEdit ? 'Simpan Perubahan' : 'Buat Peran'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}