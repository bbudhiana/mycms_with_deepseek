import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import AuthLayout from './AuthLayout';

type Props = {
    request?: {
        email?: string;
        token: string;
    };
};

export default function ResetPassword({ request }: Props) {
    const { data, setData, post, processing, errors, reset } = useForm({
        token: request?.token ?? '',
        email: request?.email ?? '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/reset-password', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AuthLayout>
            <Head title="Reset Kata Sandi" />

            <h1 className="font-display text-2xl font-bold text-foreground">Atur ulang kata sandi</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">Buat kata sandi baru untuk akun Anda.</p>

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

                <div>
                    <Label htmlFor="password">Kata sandi baru</Label>
                    <Input
                        id="password"
                        type="password"
                        value={data.password}
                        autoComplete="new-password"
                        onChange={(e) => setData('password', e.target.value)}
                    />
                    <FieldError error={errors.password} />
                </div>

                <div>
                    <Label htmlFor="password_confirmation">Konfirmasi kata sandi</Label>
                    <Input
                        id="password_confirmation"
                        type="password"
                        value={data.password_confirmation}
                        autoComplete="new-password"
                        onChange={(e) => setData('password_confirmation', e.target.value)}
                    />
                    <FieldError error={errors.password_confirmation} />
                </div>

                <Button type="submit" className="w-full" disabled={processing}>
                    Reset kata sandi
                </Button>
            </form>

            <p className="mt-6 text-center text-sm text-muted-foreground">
                <Link href="/login" className="text-accent">
                    Kembali ke masuk
                </Link>
            </p>
        </AuthLayout>
    );
}
