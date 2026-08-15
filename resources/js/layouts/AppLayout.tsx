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
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-primary-foreground"
            >
                Lompat ke konten utama
            </a>
            <div className="flex min-h-screen">
                <DashboardSidebar nav={nav} />
                <div className="flex min-w-0 flex-1 flex-col">
                    <MobileHeader />
                    <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
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
    const navListRef = React.useRef<HTMLUListElement>(null);
    const [focusedIndex, setFocusedIndex] = React.useState(-1);

    // Flatten nav items for keyboard navigation
    const flatNavItems = React.useMemo(() => {
        const items: Array<{ href: string; label: string; icon: React.ElementType; active: boolean }> = [];
        nav.forEach((group) => {
            group.items.forEach((item) => {
                items.push({
                    ...item,
                    active: item.active(pathname),
                });
            });
        });
        return items;
    }, [nav, pathname]);

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (!isOpen) return;

        const items = flatNavItems;
        if (items.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setFocusedIndex((prev) => (prev + 1) % items.length);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setFocusedIndex((prev) => (prev - 1 + items.length) % items.length);
                break;
            case 'Home':
                e.preventDefault();
                setFocusedIndex(0);
                break;
            case 'End':
                e.preventDefault();
                setFocusedIndex(items.length - 1);
                break;
            case 'Enter':
            case ' ':
                if (focusedIndex >= 0 && focusedIndex < items.length) {
                    e.preventDefault();
                    const item = items[focusedIndex];
                    router.visit(item.href);
                    setOpen(false);
                }
                break;
            case 'Escape':
                e.preventDefault();
                setOpen(false);
                break;
        }
    };

    // Focus the selected item
    React.useEffect(() => {
        if (focusedIndex >= 0 && navListRef.current) {
            const items = navListRef.current.querySelectorAll('li > a');
            if (items[focusedIndex]) {
                (items[focusedIndex] as HTMLElement).focus();
            }
        }
    }, [focusedIndex]);

    return (
        <>
            {isOpen ? (
                <div
                    className="fixed inset-0 z-30 bg-black/40 transition-opacity duration-200 lg:hidden"
                    onClick={() => setOpen(false)}
                    aria-hidden
                />
            ) : null}

            <aside
                className={cn(
                    'fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-[#171a1f] text-white transition-transform lg:static lg:translate-x-0 lg:border-r lg:border-border',
                    isOpen ? 'translate-x-0' : '-translate-x-full',
                )}
                onKeyDown={handleKeyDown}
                tabIndex={isOpen ? 0 : -1}
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
                        className="ml-auto rounded-md p-1 text-white/60 hover:bg-white/10 transition-colors duration-200 lg:hidden"
                        onClick={() => setOpen(false)}
                        aria-label="Tutup menu"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="h-1 w-full bg-primary" aria-hidden />

                <nav ref={navListRef} className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
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
                                                    'relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors duration-200 before:absolute before:left-0 before:top-1/2 before:h-6 before:w-0.5 before:-translate-y-1/2 before:bg-transparent before:transition-all before:duration-200',
                                                    active
                                                        ? 'bg-white/10 text-white before:bg-primary before:w-1'
                                                        : 'text-white/70 hover:bg-white/5 hover:text-white hover:before:bg-white/20 hover:before:w-1',
                                                    'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-[#171a1f]',
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

    const photoUrl = (user as { profile_photo_url?: string | null }).profile_photo_url ?? null;

    return (
        <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-border bg-card/90 px-4 py-3 backdrop-blur lg:hidden">
            <Button
                variant="ghost"
                size="iconSm"
                onClick={() => setOpen(true)}
                aria-label="Buka menu"
                className="transition-colors duration-200"
            >
                <Menu className="h-5 w-5" />
            </Button>
            <p className="font-display text-xl font-bold">MyNews</p>
            {photoUrl ? (
                <img
                    src={photoUrl}
                    alt={`Foto profil ${user?.name}`}
                    className="ml-auto h-8 w-8 rounded-full object-cover ring-1 ring-border"
                />
            ) : (
                <span className="ml-auto flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-semibold uppercase">
                    {user?.name?.slice(0, 2) ?? 'U'}
                </span>
            )}
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

    const photoUrl = (user as { profile_photo_url?: string | null }).profile_photo_url ?? null;

    return (
        <div className="relative">
            <button
                onClick={() => setOpen((o) => !o)}
                className="flex w-full items-center gap-3 rounded-lg p-2 text-left transition-colors duration-200 hover:bg-white/5"
                aria-expanded={open}
                aria-haspopup="menu"
            >
                {photoUrl ? (
                    <img
                        src={photoUrl}
                        alt={`Foto profil ${user.name}`}
                        className="h-9 w-9 rounded-full object-cover ring-1 ring-white/20"
                    />
                ) : (
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-semibold uppercase">
                        {initials}
                    </span>
                )}
                <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium">{user.name}</span>
                    <span className="block truncate text-xs capitalize text-white/50">{user.roles?.[0] ?? ''}</span>
                </span>
            </button>

            {open ? (
                <>
                    <div
                        className="fixed inset-0 z-10 transition-opacity duration-150"
                        onClick={() => setOpen(false)}
                        aria-hidden
                    />
                    <div className="absolute bottom-full left-0 z-20 mb-2 w-full overflow-hidden rounded-md border border-border bg-background text-foreground shadow-lg animate-in fade-in-0 zoom-in-95 duration-150">
                        <Link
                            href="/settings/profile"
                            onClick={() => setOpen(false)}
                            className="flex items-center gap-2 px-3 py-2 text-sm transition-colors duration-150 hover:bg-muted"
                        >
                            <CircleUserRound className="h-4 w-4" /> Profil & Keamanan
                        </Link>
                        <button
                            onClick={() => router.post('/logout')}
                            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive transition-colors duration-150 hover:bg-muted"
                        >
                            <LogOut className="h-4 w-4" /> Keluar
                        </button>
                    </div>
                </>
            ) : null}
        </div>
    );
}
