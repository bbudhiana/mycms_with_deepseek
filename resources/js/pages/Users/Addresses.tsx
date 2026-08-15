import { useState } from 'react';
import { Head, router, useForm } from '@inertiajs/react';
import { ArrowLeft, Plus, Pencil, Trash2, MapPin, Home as HomeIcon } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/field';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/controls';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { EmptyState } from '@/components/ui/feedback';

interface Address {
    id: number;
    label?: string | null;
    address_line1: string;
    address_line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
    is_primary: boolean;
}

interface User {
    id: number;
    name: string;
    addresses: Address[];
}

interface Can {
    manage: boolean;
}

interface Props {
    user: User;
    can: Can;
}

const emptyForm = {
    label: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    postal_code: '',
    country: '',
    is_primary: false,
};

export default function UsersAddresses({ user, can }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editing, setEditing] = useState<Address | null>(null);
    const form = useForm(emptyForm);
    const deleteConfirm = useConfirmDialog();

    const openCreate = () => {
        setEditing(null);
        form.reset();
        form.clearErrors();
        setDialogOpen(true);
    };

    const openEdit = (address: Address) => {
        setEditing(address);
        form.reset();
        form.clearErrors();
        form.setData({
            label: address.label ?? '',
            address_line1: address.address_line1,
            address_line2: address.address_line2 ?? '',
            city: address.city ?? '',
            state: address.state ?? '',
            postal_code: address.postal_code ?? '',
            country: address.country ?? '',
            is_primary: address.is_primary,
        });
        setDialogOpen(true);
    };

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (editing) {
            form.patch(`/users/${user.id}/addresses/${editing.id}`, {
                preserveScroll: true,
                onSuccess: () => setDialogOpen(false),
            });
        } else {
            form.post(`/users/${user.id}/addresses`, {
                preserveScroll: true,
                onSuccess: () => setDialogOpen(false),
            });
        }
    };

    return (
        <>
            <Head title="Alamat" />
            <PageHeader
                eyebrow="Pengguna"
                title={`Alamat ${user.name}`}
                description="Kelola alamat pengguna ini."
                actions={
                    can.manage ? (
                        <Button type="button" onClick={openCreate}>
                            <Plus className="h-4 w-4" />
                            Tambah Alamat
                        </Button>
                    ) : (
                        <Button variant="ghost" size="sm" onClick={() => router.visit('/users')}>
                            <ArrowLeft className="h-4 w-4" />
                            Kembali
                        </Button>
                    )
                }
            />

            {user.addresses.length === 0 ? (
                <EmptyState
                    icon={MapPin}
                    title="Belum ada alamat"
                    description="Tambahkan alamat pertama untuk pengguna ini."
                />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                    {user.addresses.map((address) => (
                        <Card key={address.id} className="flex flex-col">
                            <div className="flex items-start justify-between gap-3 p-5 pb-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                        <HomeIcon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold">{address.label || 'Alamat'}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {[address.city, address.state].filter(Boolean).join(', ') ||
                                                address.country ||
                                                '—'}
                                        </p>
                                    </div>
                                </div>
                                {address.is_primary && <Badge tone="success">Utama</Badge>}
                            </div>
                            <div className="flex-1 px-5 pb-4">
                                <p className="text-sm text-muted-foreground">{address.address_line1}</p>
                                {address.address_line2 && (
                                    <p className="text-sm text-muted-foreground">{address.address_line2}</p>
                                )}
                                <p className="mt-1 text-sm text-muted-foreground">
                                    {[address.city, address.state, address.postal_code, address.country]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                            </div>
                            {can.manage && (
                                <div className="flex justify-end gap-1 border-t border-border p-3">
                                    <Button variant="ghost" size="iconSm" onClick={() => openEdit(address)} aria-label={`Edit alamat ${address.label || address.address_line1}`}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="iconSm"
                                        className="text-destructive hover:text-destructive"
                                        onClick={() =>
                                            deleteConfirm.confirm({
                                                title: 'Hapus alamat',
                                                description: `Hapus alamat "${address.label || address.address_line1}"?`,
                                                onConfirm: () =>
                                                    router.delete(`/users/${user.id}/addresses/${address.id}`),
                                            })
                                        }
                                        aria-label={`Hapus alamat ${address.label || address.address_line1}`}
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit Alamat' : 'Tambah Alamat'}</DialogTitle>
                        <DialogDescription>Lengkapi detail alamat pengguna.</DialogDescription>
                    </DialogHeader>
                    <form onSubmit={submit} className="mt-4 space-y-4">
                        <div>
                            <Label htmlFor="label">Label</Label>
                            <Input
                                id="label"
                                value={form.data.label}
                                onChange={(e) => form.setData('label', e.target.value)}
                                placeholder="cth: Rumah, Kantor"
                            />
                        </div>
                        <div>
                            <Label htmlFor="address1">
                                Alamat Baris 1 <span className="text-destructive">*</span>
                            </Label>
                            <Input
                                id="address1"
                                value={form.data.address_line1}
                                onChange={(e) => form.setData('address_line1', e.target.value)}
                            />
                            <FieldError error={form.errors.address_line1} />
                        </div>
                        <div>
                            <Label htmlFor="address2">Alamat Baris 2</Label>
                            <Input
                                id="address2"
                                value={form.data.address_line2}
                                onChange={(e) => form.setData('address_line2', e.target.value)}
                            />
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="city">Kota</Label>
                                <Input
                                    id="city"
                                    value={form.data.city}
                                    onChange={(e) => form.setData('city', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="state">Provinsi</Label>
                                <Input
                                    id="state"
                                    value={form.data.state}
                                    onChange={(e) => form.setData('state', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="postal">Kode Pos</Label>
                                <Input
                                    id="postal"
                                    value={form.data.postal_code}
                                    onChange={(e) => form.setData('postal_code', e.target.value)}
                                />
                            </div>
                            <div>
                                <Label htmlFor="country">Negara</Label>
                                <Input
                                    id="country"
                                    value={form.data.country}
                                    onChange={(e) => form.setData('country', e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between rounded-lg border border-border p-4">
                            <div>
                                <p className="text-sm font-medium">Alamat utama</p>
                                <p className="text-xs text-muted-foreground">Tandai sebagai alamat utama pengguna.</p>
                            </div>
                            <Switch
                                checked={form.data.is_primary}
                                onCheckedChange={(v) => form.setData('is_primary', !!v)}
                            />
                        </div>
                        <FieldError error={form.errors.is_primary} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                                Batal
                            </Button>
                            <Button type="submit" disabled={form.processing}>
                                {editing ? 'Simpan' : 'Tambah'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog dialog={deleteConfirm.dialog} />
        </>
    );
}
