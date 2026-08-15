import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from './AuthLayout';

export default function ForgotPassword({ status }: { status?: string }) {
    const { data, setData, post, processing, errors } = useForm({ email: '' });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/forgot-password');
    };

    return (
        <AuthLayout>
            <Head title="Lupa Kata Sandi" />

            <h1 className="font-display text-2xl font-bold text-foreground">Lupa kata sandi</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">
                Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi.
            </p>

            {status && <p className="mb-4 text-sm text-success">{status}</p>}

            <form onSubmit={submit} className="space-y-4">
                <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                        id="email"
                        type="email"
                        value={data.email}
                        autoComplete="username"
                        onChange={(e) => setData('email', e.target.value)}
                    />
                    <FieldError error={errors.email} />
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    Kirim tautan reset
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                Ingat kata sandi?{' '}
                <Link href="/login" className="text-accent">
                    Kembali ke masuk
                </Link>
            </p>
        </AuthLayout>
    );
}
