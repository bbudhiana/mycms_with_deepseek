import type { ReactNode } from 'react';
import { Newspaper } from 'lucide-react';
import { Link } from '@inertiajs/react';

export default function AuthLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen bg-background">
            <aside className="hidden w-1/2 flex-col justify-between bg-[#171a1f] p-12 lg:flex">
                <Link href="/" className="group flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                        <Newspaper className="h-5 w-5" />
                    </span>
                    <span className="font-display text-2xl font-bold text-white leading-none">MyNews</span>
                </Link>

                <div className="max-w-md">
                    <div className="mb-8 h-px w-16 bg-primary" />
                    <p className="text-3xl font-semibold leading-tight text-white">
                        Ruang redaksi yang tenang untuk cerita yang besar.
                    </p>
                    <p className="mt-4 text-[11px] uppercase tracking-widest text-white/50">Editorial CMS</p>
                </div>
            </aside>

            <main className="flex flex-1 items-center justify-center px-6 py-12">
                <div className="w-full max-w-sm mx-auto">
                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                            <Newspaper className="h-5 w-5" />
                        </span>
                        <span className="font-display text-2xl font-bold text-foreground leading-none">MyNews</span>
                    </div>
                    <div className="rounded-xl border border-border bg-card p-8 shadow-sm">{children}</div>
                </div>
            </main>
        </div>
    );
}
