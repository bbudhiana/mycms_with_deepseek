import React from 'react';
import { formatDate } from '@/components/status-badge';

export interface ActivityEntry {
    id: number;
    action: string;
    description?: string;
    created_at?: string;
    user?: { id: number; name: string } | null;
}

const actionLabel: Record<string, string> = {
    'content.created': 'Membuat konten',
    'content.updated': 'Memperbarui konten',
    'content.submitted': 'Mengirim konten',
    'content.approved': 'Menyetujui konten',
    'content.rejected': 'Menolak konten',
    'content.request_changes': 'Meminta revisi',
    'content.published': 'Mempublikasikan',
    'content.scheduled': 'Menjadwalkan',
    'content.scheduled_published': 'Publikasi terjadwal',
    'content.schedule_cancelled': 'Membatalkan jadwal',
    'content.unpublished': 'Menarik publikasi',
    'content.archived': 'Mengarsipkan konten',
    'content.deleted': 'Menghapus konten',
    'media.uploaded': 'Mengunggah media',
    'media.updated': 'Memperbarui media',
    'media.deleted': 'Menghapus media',
    'category.created': 'Membuat kategori',
    'category.updated': 'Memperbarui kategori',
    'category.deleted': 'Menghapus kategori',
    'tag.created': 'Membuat tag',
    'tag.updated': 'Memperbarui tag',
    'tag.deleted': 'Menghapus tag',
    'user.created': 'Membuat user',
    'user.updated': 'Memperbarui user',
    'user.deleted': 'Menghapus user',
    'user.activated': 'Mengaktifkan user',
    'user.deactivated': 'Menonaktifkan user',
    'user.role_changed': 'Mengubah role',
    'address.created': 'Menambahkan alamat',
    'address.updated': 'Memperbarui alamat',
    'address.deleted': 'Menghapus alamat',
};

export function ActivityTimeline({ activities }: { activities: ActivityEntry[] }) {
    if (!activities || activities.length === 0) {
        return <p className="py-6 text-center text-sm text-muted-foreground">Belum ada aktivitas.</p>;
    }

    return (
        <ol className="relative space-y-5 border-l border-border pl-5">
            {activities.map((entry) => (
                <li key={entry.id} className="relative">
                    <span
                        className="absolute -left-[25px] top-1.5 h-2.5 w-2.5 rounded-full border-2 border-background bg-primary ring-1 ring-primary/30"
                        aria-hidden
                    />
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-sm">
                        <span className="font-medium">{entry.user?.name ?? 'Sistem'}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{actionLabel[entry.action] ?? entry.action}</span>
                    </div>
                    {entry.description ? (
                        <p className="mt-0.5 text-sm text-muted-foreground">{entry.description}</p>
                    ) : null}
                    <p className="mt-0.5 text-xs text-muted-foreground/70">{formatDate(entry.created_at)}</p>
                </li>
            ))}
        </ol>
    );
}
