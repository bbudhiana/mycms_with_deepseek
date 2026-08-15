import React, { useEffect, useMemo, useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { toast } from 'sonner';
import {
    LayoutDashboard,
    FileText,
    NotebookPen,
    Image as ImageIcon,
    FolderTree,
    Tags,
    Users,
    ShieldCheck,
    BookOpenText,
    Menu,
    X,
    LogOut,
    CircleUserRound,
    Newspaper,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SidebarProvider, useSidebar } from '@/lib/sidebar-context';

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    active: (path: string) => boolean;
}

interface NavGroup {
    section: string;
    items: NavItem[];
}

export function AppLayout({ children }: { children: React.ReactNode }) {
    const page = usePage();
    const permissions = useMemo(() => new Set(page.props.auth?.user?.permissions ?? []), [page.props.auth?.user]);

    useEffect(() => {
        const flash = page.props.flash ?? {};
        if (flash.success) toast.success(flash.success);
        if (flash.error) toast.error(flash.error);
        if (flash.info) toast.info(flash.info);
    }, [page.props.flash]);

    const nav: NavGroup[] = useMemo(
        () => [
            {
                section: 'Editorial',
                items: [
                    {
                        label: 'Dashboard',
                        href: '/dashboard',
                        icon: LayoutDashboard,
                        active: (p: string) => p === '/dashboard',
                    },
                    {
                        label: 'Konten',
                        href: '/contents',
                        icon: FileText,
                        active: (p: string) => p.startsWith('/contents'),
                    },
                    ...(permissions.has('approve_content')
                        ? [
                              {
                                  label: 'Review',
                                  href: '/review',
                                  icon: NotebookPen,
                                  active: (p: string) => p.startsWith('/review'),
                              },
                          ]
                        : []),
                ],
            },
            {
                section: 'Perpustakaan',
                items: [
                    { label: 'Media', href: '/media', icon: ImageIcon, active: (p: string) => p.startsWith('/media') },
                    {
                        label: 'Kategori',
                        href: '/categories',
                        icon: FolderTree,
                        active: (p: string) => p.startsWith('/categories'),
                    },
                    { label: 'Tag', href: '/tags', icon: Tags, active: (p: string) => p.startsWith('/tags') },
                ],
            },
            {
                section: 'Administrasi',
                items: [
                    ...(permissions.has('manage_user')
                        ? [
                              {
                                  label: 'Users',
                                  href: '/users',
                                  icon: Users,
                                  active: (p: string) => p.startsWith('/users'),
                              },
                          ]
                        : []),
                    ...(permissions.has('change_role') || permissions.has('manage_user')
                        ? [
                              {
                                  label: 'Roles & Izin',
                                  href: '/roles',
                                  icon: ShieldCheck,
                                  active: (p: string) => p.startsWith('/roles'),
                              },
                          ]
                        : []),
                    {
                        label: 'API Docs',
                        href: '/api-docs',
                        icon: BookOpenText,
                        active: (p: string) => p.startsWith('/api-docs'),
                    },
                ],
            },
        ],
        [permissions],
    );

    return (
        <SidebarProvider>
            <div className="flex min-h-screen">
                <DashboardSidebar nav={nav} />
                <div className="flex min-w-0 flex-1 flex-col">
                    <MobileHeader />
                    <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
                        <div className="mx-auto w-full max-w-7xl">{children}</div>
                    </main>
                </div>
            </div>
        </SidebarProvider>
    );
}

function DashboardSidebar({ nav }: { nav: NavGroup[] }) {
    const { isOpen, setOpen } = useSidebar();
    const pathname = window.location.pathname;

    return (
        <>
            {isOpen ? (
                <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} aria-hidden />
            ) : null}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#171a1f] text-white transition-transform lg:static lg:translate-x-0 lg:border-r lg:border-border',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                )}
            >
                <div className="flex items-center gap-3 border-b border-white/10 px-5 py-4">
                    <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
                        <Newspaper className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div className="leading-tight">
                        <p className="font-display text-lg font-bold tracking-tight">MyNews</p>
                        <p className="text-[11px] uppercase tracking-widest text-white/50">Editorial CMS</p>
                    </div>
                    <button
                        className="ml-auto rounded-md p-1 text-white/60 hover:bg-white/10 lg:hidden"
                        onClick={() => setOpen(false)}
                        aria-label="Tutup menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="h-1 w-full bg-primary" aria-hidden />

                <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
                    {nav.map((group) => (
                        <div key={group.section}>
                            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
                                {group.section}
                            </p>
                            <ul className="space-y-0.5">
                                {group.items.map((item) => {
                                    const Icon = item.icon;
                                    const active = item.active(pathname);
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                className={cn(
                                                    'flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors',
                                                    active
                                                        ? 'bg-white/10 text-white'
                                                        : 'text-white/70 hover:bg-white/5 hover:text-white',
                                                )}
                                                onClick={() => setOpen(false)}
                                            >
                                                <Icon className="h-4 w-4" strokeWidth={1.75} />
                                                {item.label}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>

                <div className="border-t border-white/10 p-3">
                    <SidebarUserCard />
                </div>
            </aside>
        </>
    );
}

function MobileHeader() {
    const { setOpen } = useSidebar();
    const page = usePage();
    const user = page.props.auth?.user;

    return (
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
            <Button variant="ghost" size="iconSm" onClick={() => setOpen(true)} aria-label="Buka menu">
                <Menu className="h-5 w-5" />
            </Button>
            <p className="font-display text-xl font-bold">MyNews</p>
            <span className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
                {user?.name?.slice(0, 2) ?? 'U'}
            </span>
        </header>
    );
}

function SidebarUserCard() {
    const page = usePage();
    const user = page.props.auth?.user;
    const [open, setOpen] = useState(false);

    if (!user) return null;

    const initials = user.name
        .split(' ')
        .map((w: string) => w[0])
        .join('')
        .slice(0, 2)
        .toUpperCase();

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors hover:bg-white/5"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold uppercase">
                    {initials}
                </span>
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{user.name}</span>
                    <span className="block truncate text-xs capitalize text-white/50">{user.roles?.[0] ?? ''}</span>
                </span>
            </button>

            {open ? (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} aria-hidden />
                    <div className="absolute bottom-full left-0 z-20 mb-2 w-full overflow-hidden rounded-md border border-border bg-background text-foreground shadow-lg">
                        <Link
                            href="/settings/profile"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted"
                        >
                            <CircleUserRound className="h-4 w-4" /> Profil & Keamanan
                        </Link>
                        <button
                            onClick={() => router.post('/logout')}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-muted"
                        >
                            <LogOut className="h-4 w-4" /> Keluar
                        </button>
                    </div>
                </>
            ) : null}
        </div>
    );
}
