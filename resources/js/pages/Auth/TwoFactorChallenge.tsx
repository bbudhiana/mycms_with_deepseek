import { Head, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from './AuthLayout';

export default function TwoFactorChallenge() {
    const { data, setData, post, processing, errors } = useForm({ code: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/two-factor-challenge');
    };

    return (
        <AuthLayout>
            <Head title="Verifikasi Dua Faktor" />

            <h1 className="font-display text-2xl font-bold text-foreground">Verifikasi dua faktor</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">Masukkan kode dari aplikasi autentikasi Anda.</p>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="code">Kode</Label>
                    <Input
                        id="code"
                        inputMode="numeric"
                        autoComplete="one-time-code"
                        value={data.code}
                        onChange={(e) => setData('code', e.target.value)}
                    />
                    <FieldError error={errors.code} />
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    Verifikasi
                </Button>
            </form>
        </AuthLayout>
    );
}
