import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import AuthLayout from './AuthLayout';

export default function VerifyEmail({ status }: { status?: string }) {
    const resend = useForm({});
    const logout = useForm({});

    return (
        <AuthLayout>
            <Head title="Verifikasi Email" />

            <h1 className="font-display text-2xl font-bold text-foreground">Verifikasi alamat email Anda</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
                Sebelum melanjutkan, periksa email Anda untuk tautan verifikasi. Jika Anda belum menerimanya, kirim
                ulang tautannya di bawah.
            </p>

            {status && <p className="mb-4 text-sm text-success">{status}</p>}

            <div className="mt-6 space-y-3">
                <Button
                    className="w-full"
                    disabled={resend.processing}
                    onClick={() => resend.post('/email/verification-notification')}
                >
                    Kirim ulang email verifikasi
                </Button>
                <Button
                    variant="outline"
                    className="w-full"
                    disabled={logout.processing}
                    onClick={() => logout.post('/logout')}
                >
                    Keluar
                </Button>
            </div>
        </AuthLayout>
    );
}
