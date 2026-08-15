import React from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import { ArrowLeft, Save } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Textarea, FieldError } from '@/components/ui/field';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch, Checkbox } from '@/components/ui/controls';
import { Badge } from '@/components/ui/badge';

interface RoleRef {
    id: number;
    name: string;
}

interface Address {
    id: number;
    label?: string | null;
    address_line1: string;
    is_primary: boolean;
}

interface User {
    id: number;
    name: string;
    email: string;
    job_title?: string | null;
    bio?: string | null;
    is_active: boolean;
    roles: RoleRef[];
    addresses?: Address[];
}

interface Props {
    user: User | null;
    roles: RoleRef[];
}

export default function UsersForm({ user, roles }: Props) {
    const isEdit = !!user;
    const form = useForm({
        name: user?.name ?? '',
        email: user?.email ?? '',
        job_title: user?.job_title ?? '',
        bio: user?.bio ?? '',
        is_active: user?.is_active ?? true,
        roles: user?.roles.map((r) => r.name) ?? [],
        password: '',
        password_confirmation: '',
    });

    const toggleRole = (name: string) => {
        const current = form.data.roles;
        form.setData('roles', current.includes(name) ? current.filter((r) => r !== name) : [...current, name]);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!isEdit && !form.data.password) {
            form.setError('password', 'Kata sandi wajib diisi saat membuat pengguna.');
            return;
        }
        if (isEdit && user) {
            form.patch(`/users/${user.id}`);
        } else {
            form.post('/users');
        }
    };

    return (
        <>
            <Head title={isEdit ? 'Edit Pengguna' : 'Tambah Pengguna'} />
            <PageHeader
                eyebrow="Akses"
                title={isEdit ? `Edit ${user?.name}` : 'Tambah Pengguna'}
                description={isEdit ? 'Perbarui informasi akun pengguna.' : 'Buat akun pengguna baru.'}
                actions={
                    <Button asChild variant="ghost" size="sm">
                        <Link href="/users">
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Link>
                    </Button>
                }
            />

            <form onSubmit={submit} className="space-y-5">
                <Card>
                    <CardHeader>
                        <CardTitle>Informasi Dasar</CardTitle>
                        <CardDescription>Data identitas dan profil pengguna.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="name">Nama</Label>
                            <Input
                                id="name"
                                value={form.data.name}
                                onChange={(e) => form.setData('name', e.target.value)}
                            />
                            <FieldError error={form.errors.name} />
                        </div>
                        <div>
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={form.data.email}
                                onChange={(e) => form.setData('email', e.target.value)}
                            />
                            <FieldError error={form.errors.email} />
                        </div>
                        <div>
                            <Label htmlFor="job-title">Jabatan</Label>
                            <Input
                                id="job-title"
                                value={form.data.job_title ?? ''}
                                onChange={(e) => form.setData('job_title', e.target.value)}
                            />
                            <FieldError error={form.errors.job_title} />
                        </div>
                        <div>
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={form.data.bio ?? ''}
                                onChange={(e) => form.setData('bio', e.target.value)}
                            />
                            <FieldError error={form.errors.bio} />
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border p-4">
                            <div>
                                <p className="text-sm font-medium">Akun aktif</p>
                                <p className="text-xs text-muted-foreground">
                                    Pengguna dapat masuk ke sistem saat aktif.
                                </p>
                            </div>
                            <Switch
                                checked={form.data.is_active}
                                onCheckedChange={(v) => form.setData('is_active', !!v)}
                            />
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Peran</CardTitle>
                        <CardDescription>Pilih satu atau lebih peran untuk pengguna ini.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {form.data.roles.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-1.5">
                                {form.data.roles.map((r) => (
                                    <Badge key={r} tone="default">
                                        {r}
                                    </Badge>
                                ))}
                            </div>
                        )}
                        <div className="grid gap-2 sm:grid-cols-2">
                            {roles.map((role) => {
                                const checked = form.data.roles.includes(role.name);
                                return (
                                    <label
                                        key={role.id}
                                        className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3 hover:bg-muted/40"
                                    >
                                        <Checkbox checked={checked} onCheckedChange={() => toggleRole(role.name)} />
                                        <span className="text-sm font-medium capitalize">{role.name}</span>
                                    </label>
                                );
                            })}
                        </div>
                        <FieldError error={form.errors.roles} />
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Kata Sandi</CardTitle>
                        <CardDescription>
                            {isEdit
                                ? 'Kosongkan untuk mempertahankan kata sandi saat ini.'
                                : 'Tetapkan kata sandi untuk akun baru.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label htmlFor="password">
                                Kata Sandi {!isEdit && <span className="text-destructive">*</span>}
                            </Label>
                            <Input
                                id="password"
                                type="password"
                                autoComplete="new-password"
                                value={form.data.password}
                                onChange={(e) => form.setData('password', e.target.value)}
                            />
                            <FieldError error={form.errors.password} />
                        </div>
                        <div>
                            <Label htmlFor="password-confirmation">Konfirmasi Kata Sandi</Label>
                            <Input
                                id="password-confirmation"
                                type="password"
                                autoComplete="new-password"
                                value={form.data.password_confirmation}
                                onChange={(e) => form.setData('password_confirmation', e.target.value)}
                            />
                            <FieldError error={form.errors.password_confirmation} />
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end gap-2">
                    <Button asChild type="button" variant="ghost">
                        <Link href="/users">Batal</Link>
                    </Button>
                    <Button type="submit" disabled={form.processing}>
                        <Save className="h-4 w-4" />
                        {isEdit ? 'Simpan Perubahan' : 'Buat Pengguna'}
                    </Button>
                </div>
            </form>
        </>
    );
}
