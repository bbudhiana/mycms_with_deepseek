import { Head } from '@inertiajs/react';
import { ShieldCheck, KeyRound, Link as LinkIcon, Server, BookOpenText } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface User {
    id: number;
    name: string;
    email: string;
}

interface Props {
    user: User;
}

interface Endpoint {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    path: string;
    description: string;
}

interface Group {
    name: string;
    endpoints: Endpoint[];
}

const groups: Group[] = [
    {
        name: 'Pengguna',
        endpoints: [
            { method: 'GET', path: '/api/users', description: 'Daftar pengguna' },
            { method: 'POST', path: '/api/users', description: 'Buat pengguna' },
            { method: 'GET', path: '/api/users/{user}', description: 'Detail pengguna' },
            { method: 'PATCH', path: '/api/users/{user}', description: 'Perbarui pengguna' },
            { method: 'DELETE', path: '/api/users/{user}', description: 'Hapus pengguna' },
            { method: 'PATCH', path: '/api/users/{user}/role', description: 'Ubah peran pengguna' },
            { method: 'POST', path: '/api/users/{user}/activate', description: 'Aktifkan pengguna' },
            { method: 'POST', path: '/api/users/{user}/deactivate', description: 'Nonaktifkan pengguna' },
            { method: 'GET', path: '/api/users/{user}/addresses', description: 'Daftar alamat pengguna' },
            { method: 'POST', path: '/api/users/{user}/addresses', description: 'Tambah alamat pengguna' },
        ],
    },
    {
        name: 'Kategori',
        endpoints: [
            { method: 'GET', path: '/api/categories/tree', description: 'Pohon hierarki kategori' },
            { method: 'GET', path: '/api/categories', description: 'Daftar kategori' },
            { method: 'POST', path: '/api/categories', description: 'Buat kategori' },
            { method: 'GET', path: '/api/categories/{category}', description: 'Detail kategori' },
            { method: 'PATCH', path: '/api/categories/{category}', description: 'Perbarui kategori' },
            { method: 'DELETE', path: '/api/categories/{category}', description: 'Hapus kategori' },
        ],
    },
    {
        name: 'Tag',
        endpoints: [
            { method: 'GET', path: '/api/tags/search', description: 'Cari tag' },
            { method: 'GET', path: '/api/tags', description: 'Daftar tag' },
            { method: 'POST', path: '/api/tags', description: 'Buat tag' },
            { method: 'GET', path: '/api/tags/{tag}', description: 'Detail tag' },
            { method: 'PATCH', path: '/api/tags/{tag}', description: 'Perbarui tag' },
            { method: 'DELETE', path: '/api/tags/{tag}', description: 'Hapus tag' },
        ],
    },
    {
        name: 'Media',
        endpoints: [
            { method: 'GET', path: '/api/media', description: 'Daftar media' },
            { method: 'POST', path: '/api/media', description: 'Unggah media' },
            { method: 'GET', path: '/api/media/{media}', description: 'Detail media' },
            { method: 'PATCH', path: '/api/media/{media}', description: 'Perbarui media (alt text)' },
            { method: 'DELETE', path: '/api/media/{media}', description: 'Hapus media' },
        ],
    },
    {
        name: 'Konten',
        endpoints: [
            { method: 'GET', path: '/api/contents/pending-review', description: 'Konten menunggu review' },
            { method: 'GET', path: '/api/contents/scheduled', description: 'Konten terjadwal' },
            {
                method: 'GET',
                path: '/api/contents/{content}/approval-history',
                description: 'Riwayat persetujuan konten',
            },
            { method: 'GET', path: '/api/contents', description: 'Daftar konten' },
            { method: 'POST', path: '/api/contents', description: 'Buat konten' },
            { method: 'GET', path: '/api/contents/{content}', description: 'Detail konten' },
            { method: 'PATCH', path: '/api/contents/{content}', description: 'Perbarui konten' },
            { method: 'DELETE', path: '/api/contents/{content}', description: 'Hapus konten' },
        ],
    },
    {
        name: 'Konten — Workflow & Publikasi',
        endpoints: [
            { method: 'POST', path: '/api/contents/{content}/submit', description: 'Kirim konten untuk review' },
            { method: 'POST', path: '/api/contents/{content}/approve', description: 'Setujui konten' },
            { method: 'POST', path: '/api/contents/{content}/reject', description: 'Tolak konten' },
            { method: 'POST', path: '/api/contents/{content}/request-changes', description: 'Minta perubahan' },
            { method: 'POST', path: '/api/contents/{content}/publish', description: 'Terbitkan konten' },
            { method: 'POST', path: '/api/contents/{content}/schedule', description: 'Jadwalkan konten' },
            { method: 'POST', path: '/api/contents/{content}/unpublish', description: 'Batalkan publikasi' },
            { method: 'POST', path: '/api/contents/{content}/archive', description: 'Arsipkan konten' },
        ],
    },
];

const methodTone: Record<Endpoint['method'], string> = {
    GET: 'text-success',
    POST: 'text-primary',
    PATCH: 'text-warning',
    PUT: 'text-warning',
    DELETE: 'text-destructive',
};

export default function ApiDocsIndex(_props: Props) {
    const baseUrl = `${window.location.origin}`;

    return (
        <>
            <Head title="Dokumentasi API" />
            <PageHeader
                eyebrow="Pengembang"
                title="Dokumentasi API"
                description="Referensi REST API untuk integrasi eksternal pada sistem CMS."
                actions={
                    <Badge tone="success" className="gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        auth:sanctum · verified
                    </Badge>
                }
            />

            <div className="space-y-5">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BookOpenText className="h-4 w-4 text-primary" />
                            Ringkasan
                        </CardTitle>
                    </CardHeader>
                    <div className="flex flex-col gap-4 p-6 pt-0 text-sm text-muted-foreground">
                        <p>
                            API ini memperlihatkan sumber daya utama pada sistem CMS: <strong>pengguna</strong>,{' '}
                            <strong>kategori</strong>, <strong>tag</strong>, <strong>media</strong>, dan{' '}
                            <strong>konten</strong> lengkap dengan alur <em>workflow</em> dan <em>publikasi</em>.
                            Seluruh endpoint berada di belakang autentikasi{' '}
                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">auth:sanctum</code> dan verifikasi
                            email <code className="rounded bg-muted px-1.5 py-0.5 text-xs">verified</code>.
                        </p>
                    </div>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-primary" />
                            Mendapatkan Token
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-3 p-6 pt-0 text-sm">
                        <p className="text-muted-foreground">
                            Gunakan Laravel Sanctum. Buat <em>personal access token</em> untuk akun Anda, lalu sertakan
                            pada header{' '}
                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">Authorization: Bearer</code>.
                        </p>
                        <div className="rounded-lg border border-border bg-muted/30 p-4">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Membuat token
                            </p>
                            <pre className="overflow-x-auto text-xs leading-relaxed">
                                <code>{`php artisan tinker

$user = App\\Models\\User::find(1);
$user->createToken('api-access')->accessToken;`}</code>
                            </pre>
                        </div>
                    </div>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <LinkIcon className="h-4 w-4 text-primary" />
                            Base URL
                        </CardTitle>
                    </CardHeader>
                    <div className="p-6 pt-0">
                        <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-4">
                            <Server className="h-4 w-4 text-muted-foreground" />
                            <code className="text-sm">{baseUrl}</code>
                        </div>
                    </div>
                </Card>

                {groups.map((group) => (
                    <Card key={group.name}>
                        <CardHeader>
                            <CardTitle>{group.name}</CardTitle>
                        </CardHeader>
                        <div className="overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="border-b border-border">
                                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            Method
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground">
                                            Endpoint
                                        </th>
                                        <th className="hidden px-4 py-3 text-left text-xs uppercase tracking-wide text-muted-foreground sm:table-cell">
                                            Deskripsi
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {group.endpoints.map((ep) => (
                                        <tr
                                            key={ep.method + ep.path}
                                            className="border-b border-border last:border-0 hover:bg-muted/40"
                                        >
                                            <td className="px-4 py-2.5">
                                                <span
                                                    className={cn(
                                                        'font-mono text-xs font-semibold',
                                                        methodTone[ep.method],
                                                    )}
                                                >
                                                    {ep.method}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5">
                                                <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
                                                    {ep.path}
                                                </code>
                                            </td>
                                            <td className="hidden px-4 py-2.5 text-muted-foreground sm:table-cell">
                                                {ep.description}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                ))}
            </div>
        </>
    );
}
