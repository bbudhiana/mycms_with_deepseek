import { Link, usePage } from '@inertiajs/react';
import { CircleUserRound, ShieldCheck, Monitor } from 'lucide-react';
import { cn } from '@/lib/utils';

const items = [
    { href: '/settings/profile', label: 'Profil', icon: CircleUserRound },
    { href: '/settings/security', label: 'Keamanan', icon: ShieldCheck },
    { href: '/settings/appearance', label: 'Tampilan', icon: Monitor },
];

export function SettingsNav() {
    const { url } = usePage();

    return (
        <nav
            aria-label="Navigasi pengaturan"
            className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-sm"
        >
            {items.map((item) => {
                const Icon = item.icon;
                const active = url === item.href || url.startsWith(`${item.href}/`);

                return (
                    <Link
                        key={item.href}
                        href={item.href}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                            'inline-flex h-9 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors duration-200',
                            active
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                        )}
                    >
                        <Icon className="h-4 w-4" />
                        {item.label}
                    </Link>
                );
            })}
        </nav>
    );
}