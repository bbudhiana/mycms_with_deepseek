import * as React from 'react';
import { Link, usePage } from '@inertiajs/react';
import { ChevronRight, Home, FileText, Users, ShieldCheck, Image, FolderTree, Tags, Settings, BookOpenText, LayoutDashboard, NotebookPen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BreadcrumbItem {
    label: string;
    href?: string;
    icon?: React.ElementType;
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[];
    className?: string;
    maxItems?: number;
}

const routeIcons: Record<string, React.ElementType> = {
    '/dashboard': LayoutDashboard,
    '/contents': FileText,
    '/contents/create': FileText,
    '/review': NotebookPen,
    '/users': Users,
    '/roles': ShieldCheck,
    '/media': Image,
    '/categories': FolderTree,
    '/tags': Tags,
    '/settings': Settings,
    '/settings/profile': Settings,
    '/settings/security': Settings,
    '/settings/appearance': Settings,
    '/api-docs': BookOpenText,
};

function getIconForPath(path: string): React.ElementType | undefined {
    if (routeIcons[path]) return routeIcons[path];
    const basePath = path.split('/')[1];
    if (basePath && routeIcons[`/${basePath}`]) return routeIcons[`/${basePath}`];
    return undefined;
}

export function Breadcrumbs({ items, className, maxItems = 5 }: BreadcrumbsProps) {
    const allItems = React.useMemo(() => {
        const baseItems: BreadcrumbItem[] = [
            { label: 'Beranda', href: '/dashboard', icon: Home },
        ];

        if (items.length > 0) {
            return [...baseItems, ...items];
        }

        return baseItems;
    }, [items]);

    const visibleItems = React.useMemo(() => {
        if (allItems.length <= maxItems) return allItems;

        return [
            allItems[0],
            { label: '...', href: undefined },
            ...allItems.slice(-(maxItems - 1)),
        ];
    }, [allItems, maxItems]);

    return (
        <nav
            className={cn('flex items-center gap-1.5 text-sm', className)}
            aria-label="Breadcrumb"
        >
            <ol className="flex items-center gap-1.5 flex-wrap" role="list">
                {visibleItems.map((item, index) => {
                    const isLast = index === visibleItems.length - 1;
                    const Icon = item.icon ?? getIconForPath(item.href ?? '');

                    if (item.label === '...') {
                        return (
                            <li key="ellipsis" className="flex items-center text-muted-foreground" aria-hidden="true">
                                <span className="px-1">…</span>
                            </li>
                        );
                    }

                    return (
                        <li key={item.href ?? item.label} className="flex items-center gap-1.5">
                            {!isLast && index > 0 && (
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/50" aria-hidden="true" />
                            )}
                            {item.href && !isLast ? (
                                <Link
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors duration-150',
                                        'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md px-1.5 py-0.5 -mx-1.5'
                                    )}
                                >
                                    {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                                    <span>{item.label}</span>
                                </Link>
                            ) : (
                                <span
                                    className={cn(
                                        'flex items-center gap-1.5 font-medium text-foreground',
                                        isLast && 'truncate max-w-[200px]'
                                    )}
                                    aria-current={isLast ? 'page' : undefined}
                                >
                                    {Icon && <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
                                    <span>{item.label}</span>
                                </span>
                            )}
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}

export function useBreadcrumbs() {
    const page = usePage();
    const currentPath = page.url;

    const generateBreadcrumbs = (): BreadcrumbItem[] => {
        const segments = currentPath.split('/').filter(Boolean);
        const breadcrumbs: BreadcrumbItem[] = [];

        let currentPathBuild = '';
        segments.forEach((segment: string, index: number) => {
            currentPathBuild += `/${segment}`;
            const isLast = index === segments.length - 1;

            let label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
            const routeLabels: Record<string, string> = {
                'dashboard': 'Dashboard',
                'contents': 'Konten',
                'create': 'Buat Baru',
                'review': 'Review',
                'users': 'Pengguna',
                'roles': 'Peran & Izin',
                'media': 'Media',
                'categories': 'Kategori',
                'tags': 'Tag',
                'settings': 'Pengaturan',
                'profile': 'Profil',
                'security': 'Keamanan',
                'appearance': 'Tampilan',
                'api-docs': 'API Docs',
                'addresses': 'Alamat',
            };

            label = routeLabels[segment] ?? label;

            if (!isLast) {
                breadcrumbs.push({ label, href: currentPathBuild });
            } else {
                breadcrumbs.push({ label });
            }
        });

        return breadcrumbs;
    };

    return { items: generateBreadcrumbs() };
}