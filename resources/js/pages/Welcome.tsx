import { Head, Link } from '@inertiajs/react';
import { Newspaper } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Welcome() {
    return (
        <div className="flex min-h-screen flex-col bg-background">
            <Head title="MyNews" />

            <nav className="flex items-center justify-between border-b border-border px-6 py-4">
                <span className="flex items-center gap-2">
                    <span className="flex h-8 w-8 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                        <Newspaper className="h-4 w-4" />
                    </span>
                    <span className="font-display text-xl font-bold text-foreground leading-none">MyNews</span>
                </span>
            </nav>

            <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-20 text-center">
                <span className="mb-6 h-px w-12 bg-primary" />

                <h1 className="font-display text-5xl font-bold leading-tight text-foreground sm:text-6xl">
                    Ruang redaksi
                    <br />
                    <span className="text-primary">untuk cerita besar.</span>
                </h1>

                <p className="mt-6 max-w-xl text-base text-muted-foreground sm:text-lg">
                    Kelola konten editorial dengan tenang dan fokus. Tulis, kurasi, dan terbitkan dengan alur kerja yang
                    rapi.
                </p>

                <div className="mt-10 flex flex-col items-center gap-4">
                    <Link href="/login">
                        <Button variant="default" size="lg" className="px-8">
                            Masuk ke CMS
                        </Button>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                        Demo roles: <span className="font-medium text-foreground">Editor</span> ·{' '}
                        <span className="font-medium text-foreground">Penulis</span> ·{' '}
                        <span className="font-medium text-foreground">Reviewer</span>
                    </p>
                </div>
            </main>

            <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
                MyNews Editorial CMS
            </footer>
        </div>
    );
}
