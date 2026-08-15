import { Head } from '@inertiajs/react';
import { ShieldCheck, Users, Check, Minus } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

interface Permission {
    id: number;
    name: string;
}

interface Role {
    id: number;
    name: string;
    permissions: Permission[];
    users_count: number;
}

interface Can {
    changeRole: boolean;
    manageUser: boolean;
}

interface Props {
    roles: Role[];
    permissions: Permission[];
    can: Can;
}

export default function RolesIndex({ roles, permissions }: Props) {
    return (
        <>
            <Head title="Peran & Izin" />
            <PageHeader
                eyebrow="Akses"
                title="Peran & Izin"
                description="Ringkasan peran yang tersedia beserta izin dan jumlah penggunanya."
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {roles.map((role) => (
                    <Card key={role.id} className="flex flex-col">
                        <div className="flex items-start justify-between gap-3 p-5 pb-0">
                            <div className="flex items-center gap-2">
                                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                    <ShieldCheck className="h-4 w-4" />
                                </div>
                                <h3 className="font-display text-base font-semibold capitalize">{role.name}</h3>
                            </div>
                            <Badge tone="default" className="gap-1">
                                <Users className="h-3 w-3" />
                                {role.users_count} pengguna
                            </Badge>
                        </div>
                        <div className="p-5">
                            <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                                Izin ({role.permissions.length})
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                                {role.permissions.map((p) => (
                                    <Badge key={p.id} tone="default">
                                        {p.name}
                                    </Badge>
                                ))}
                                {role.permissions.length === 0 && (
                                    <span className="text-sm text-muted-foreground">Tidak ada izin</span>
                                )}
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="mt-8">
                <h2 className="mb-3 font-display text-lg font-semibold">Matriks Izin</h2>
                <Card className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border">
                                <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                    Izin
                                </th>
                                {roles.map((role) => (
                                    <th
                                        key={role.id}
                                        className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                                    >
                                        {role.name}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {permissions.map((permission) => (
                                <tr key={permission.id} className="border-b border-border hover:bg-muted/40">
                                    <td className="px-4 py-2.5 font-medium">
                                        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                            {permission.name}
                                        </code>
                                    </td>
                                    {roles.map((role) => {
                                        const granted = role.permissions.some((p) => p.id === permission.id);
                                        return (
                                            <td key={role.id} className="px-4 py-2.5 text-center">
                                                {granted ? (
                                                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-success/10 text-success">
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
                        </tbody>
                    </table>
                </Card>
                {permissions.length === 0 && (
                    <p className="mt-3 text-sm text-muted-foreground">Belum ada izin yang terdaftar.</p>
                )}
            </div>
        </>
    );
}
