import { Head, Link, useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Label, FieldError } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/controls';
import AuthLayout from './AuthLayout';

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login', { onFinish: () => reset('password') });
    };

    return (
        <AuthLayout>
            <Head title="Masuk" />

            <h1 className="font-display text-2xl font-bold text-foreground">Masuk</h1>
            <p className="mt-1 mb-6 text-sm text-muted-foreground">Selamat datang kembali di ruang redaksi.</p>

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

                <label className="flex items-center gap-2 text-sm text-foreground">
                    <Checkbox
                        checked={data.remember}
                        onCheckedChange={(checked) => setData('remember', checked === true)}
                    />
                    Ingat saya
                </label>

                <Button type="submit" className="w-full" disabled={processing}>
                    Masuk
                </Button>
            </form>

            <div className="mt-6 flex items-center justify-between text-sm">
                <Link href="/forgot-password" className="text-accent">
                    Lupa kata sandi?
                </Link>
                <Link href="/register" className="text-accent">
                    Daftar
                </Link>
            </div>
        </AuthLayout>
    );
}
