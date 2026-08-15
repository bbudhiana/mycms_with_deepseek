import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from './AuthLayout';

export default function ConfirmPassword() {
    const { data, setData, post, processing, errors } = useForm({ password: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/user/confirm-password');
    };

    return (
        <AuthLayout>
            <Head title="Konfirmasi Kata Sandi" />

            <h1 className="font-display text-2xl font-bold text-foreground">Konfirmasi kata sandi</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
                Demi keamanan, konfirmasikan kata sandi Anda untuk melanjutkan.
            </p>

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="password">Kata sandi</Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        autoComplete="current-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <FieldError error={errors.password} />
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    Konfirmasi
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link href="/" className="text-accent">
                    Kembali ke beranda
                </Link>
            </p>
        </AuthLayout>
    );
}
