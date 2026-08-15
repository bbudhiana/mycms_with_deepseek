import { Head, useForm } from '@inertiajs/react';
import { KeyRound, ShieldCheck, Fingerprint, Plus, Trash2 } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { useConfirmDialog, ConfirmDialog } from '@/components/confirm-dialog';

interface Props {
    twoFactorEnabled: boolean;
    hasPasskeys: boolean;
}

export default function SettingsSecurity({ twoFactorEnabled, hasPasskeys }: Props) {
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const twoFactorForm = useForm({});
    const twoFactorConfirm = useConfirmDialog();

    const submitPassword = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.post('/user/password', { preserveScroll: true });
    };

    const handleTwoFactor = () => {
        if (twoFactorEnabled) {
            twoFactorConfirm.confirm({
                title: 'Nonaktifkan autentikasi dua faktor',
                description: 'Pastikan akun Anda aman sebelum menonaktifkan 2FA.',
                confirmLabel: 'Nonaktifkan',
                onConfirm: () => twoFactorForm.delete('/user/two-factor-authentication'),
            });
        } else {
            twoFactorForm.post('/user/two-factor-authentication');
        }
    };

    return (
        <>
            <Head title="Keamanan" />
            <PageHeader
                eyebrow="Pengaturan"
                title="Keamanan"
                description="Kelola kata sandi dan metode autentikasi akun Anda."
            />

            <div className="space-y-5">
                <SectionCard
                    title="Kata Sandi"
                    description="Perbarui kata sandi Anda secara berkala untuk menjaga keamanan."
                >
                    <form onSubmit={submitPassword} className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="current-password">Kata Sandi Saat Ini</Label>
                                <Input
                                    id="current-password"
                                    type="password"
                                    autoComplete="current-password"
                                    value={passwordForm.data.current_password}
                                    onChange={(e) => passwordForm.setData('current_password', e.target.value)}
                                />
                                <FieldError error={passwordForm.errors.current_password} />
                            </div>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label htmlFor="new-password">Kata Sandi Baru</Label>
                                <Input
                                    id="new-password"
                                    type="password"
                                    autoComplete="new-password"
                                    value={passwordForm.data.password}
                                    onChange={(e) => passwordForm.setData('password', e.target.value)}
                                />
                                <FieldError error={passwordForm.errors.password} />
                            </div>
                            <div>
                                <Label htmlFor="new-password-confirm">Konfirmasi Kata Sandi Baru</Label>
                                <Input
                                    id="new-password-confirm"
                                    type="password"
                                    autoComplete="new-password"
                                    value={passwordForm.data.password_confirmation}
                                    onChange={(e) => passwordForm.setData('password_confirmation', e.target.value)}
                                />
                                <FieldError error={passwordForm.errors.password_confirmation} />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={passwordForm.processing}>
                                <KeyRound className="h-4 w-4" />
                                Perbarui Kata Sandi
                            </Button>
                        </div>
                    </form>
                </SectionCard>

                <SectionCard
                    title="Autentikasi Dua Faktor (2FA)"
                    description="Tambahkan lapisan keamanan ekstra pada akun Anda."
                    action={
                        <Badge tone={twoFactorEnabled ? 'success' : 'default'}>
                            {twoFactorEnabled ? 'Aktif' : 'Nonaktif'}
                        </Badge>
                    }
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                <ShieldCheck className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium">Lindungi akun dengan verifikasi dua langkah</p>
                                <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                                    {twoFactorEnabled
                                        ? 'Autentikasi dua faktor aktif dan melindungi akun Anda.'
                                        : 'Aktifkan autentikasi dua faktor untuk menambah keamanan saat masuk.'}
                                </p>
                            </div>
                        </div>
                        {twoFactorEnabled ? (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={twoFactorForm.processing}
                                onClick={handleTwoFactor}
                            >
                                <Trash2 className="h-4 w-4" />
                                Nonaktifkan
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="sm"
                                disabled={twoFactorForm.processing}
                                onClick={handleTwoFactor}
                            >
                                <Plus className="h-4 w-4" />
                                Aktifkan
                            </Button>
                        )}
                    </div>
                </SectionCard>

                <SectionCard
                    title="Passkey"
                    description="Masuk dengan aman menggunakan biometrik atau kunci keamanan."
                    action={
                        <Badge tone={hasPasskeys ? 'success' : 'default'}>
                            {hasPasskeys ? 'Terdaftar' : 'Belum ada'}
                        </Badge>
                    }
                >
                    <div className="flex items-start gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Fingerprint className="h-4 w-4" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Autentikasi tanpa kata sandi</p>
                            <p className="mt-0.5 max-w-md text-xs text-muted-foreground">
                                {hasPasskeys
                                    ? 'Anda telah mendaftarkan passkey untuk akun ini.'
                                    : 'Pendaftaran passkey belum didukung dari halaman ini. Gunakan alur passkey yang tersedia pada perangkat Anda untuk mendaftar.'}
                            </p>
                        </div>
                    </div>
                </SectionCard>
            </div>

            <ConfirmDialog dialog={twoFactorConfirm.dialog} />
        </>
    );
}
