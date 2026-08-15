import { Badge } from '@/components/ui/badge';

const statusConfig: Record<
    string,
    { label: string; tone: 'draft' | 'review' | 'approved' | 'published' | 'archived' }
> = {
    draft: { label: 'Draft', tone: 'draft' },
    review: { label: 'Menunggu Review', tone: 'review' },
    approved: { label: 'Disetujui', tone: 'approved' },
    published: { label: 'Terbit', tone: 'published' },
    archived: { label: 'Diarsip', tone: 'archived' },
};

export function StatusBadge({
    status,
    className,
    announce = true,
}: {
    status: string;
    className?: string;
    announce?: boolean;
}) {
    const config = statusConfig[status] ?? { label: status ?? 'Tidak Dikenal', tone: 'default' as const };

    return (
        <Badge
            tone={config.tone}
            className={className}
            role={announce ? 'status' : undefined}
            aria-atomic={announce ? 'true' : undefined}
            aria-live={announce ? 'polite' : undefined}
        >
            {config.label}
        </Badge>
    );
}

export function formatDate(date?: string | null, short = false) {
    if (!date) return '—';
    const d = new Date(date);
    if (Number.isNaN(d.getTime())) return '—';

    return short
        ? d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
        : d.toLocaleString('id-ID', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
          });
}

export function formatBytes(bytes?: number | null) {
    if (!bytes) return '0 B';
    const units = ['B', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
