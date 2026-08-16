import { useRef, useState } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Upload, Trash2, CheckCircle2, CircleAlert, CalendarDays, BadgeCheck, Clock } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/page-header';
import { SettingsNav } from '@/components/settings-nav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Textarea, FieldError } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { ConfirmDialog, useConfirmDialog } from '@/components/confirm-dialog';
import { formatDate } from '@/components/status-badge';
import { relativeTime } from '@/components/content-row-card';
import { cn } from '@/lib/utils';

interface UserRole {
    id: number;
    name: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    job_title?: string | null;
    bio?: string | null;
    profile_photo_url?: string | null;
    email_verified_at?: string | null;
    created_at?: string | null;
    last_login_at?: string | null;
    roles?: UserRole[];
    addresses?: unknown[];
}

interface Props {
    user: User;
}

export default function SettingsProfile({ user }: Props) {
    const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);
    const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
    const photoRef = useRef<HTMLInputElement>(null);
    const photoDeleteConfirm = useConfirmDialog();

    const profileForm = useForm({
        name: user.name,
        email: user.email,
        job_title: user.job_title ?? '',
        bio: user.bio ?? '',
    });

    const photoForm = useForm({ photo: null as File | null });

    const photoUrl = user.profile_photo_url ?? null;
    const verified = Boolean(user.email_verified_at);
    const roles = user.roles ?? [];

    const submitProfile = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.patch('/settings/profile', { preserveScroll: true });
    };

    const onSelectPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setPendingPhoto(file);
        setPreviewPhoto(URL.createObjectURL(file));
        e.target.value = '';
    };

    const savePhoto = () => {
        if (!pendingPhoto) return;
        photoForm.setData('photo', pendingPhoto);
        photoForm.post('/settings/profile-photo', {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setPreviewPhoto(null);
                setPendingPhoto(null);
            },
        });
    };

    const cancelPhoto = () => {
        setPreviewPhoto(null);
        setPendingPhoto(null);
    };

    const confirmDeletePhoto = () => {
        photoDeleteConfirm.confirm({
            title: 'Hapus foto profil',
            description: 'Foto profil Anda akan dihapus dan diganti dengan inisial nama.',
            confirmLabel: 'Hapus',
            onConfirm: () =>
                photoForm.delete('/settings/profile-photo', {
                    preserveScroll: true,
                    onSuccess: () => {
                        setPreviewPhoto(null);
                        setPendingPhoto(null);
                    },
                }),
        });
    };

    const displayedPhoto = previewPhoto ?? photoUrl;
    const initials = user.name
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0]?.toUpperCase())
        .join('');

    const displayName = profileForm.data.name.trim() || '…';
    const displayJobTitle = profileForm.data.job_title.trim();
    const displayBio = profileForm.data.bio.trim();

    return (
        <>
            <Head title="Profil" />
            <PageHeader eyebrow="Pengaturan" title="Profil" description="Kelola informasi akun dan foto profil Anda." />

            <SettingsNav />

            <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                <div className="min-w-0 space-y-5">
                    <SectionCard
                        title="Informasi Profil"
                        description="Perbarui nama, email, jabatan, dan bio yang tampil pada profil Anda."
                        action={
                            profileForm.isDirty ? (
                                <Badge tone="warning" className="gap-1">
                                    <CircleAlert className="h-3 w-3" />
                                    Belum tersimpan
                                </Badge>
                            ) : undefined
                        }
                    >
                        <form onSubmit={submitProfile} className="space-y-4">
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <Label htmlFor="name">Nama</Label>
                                    <Input
                                        id="name"
                                        value={profileForm.data.name}
                                        onChange={(e) => profileForm.setData('name', e.target.value)}
                                    />
                                    <FieldError error={profileForm.errors.name} />
                                </div>
                                <div>
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={profileForm.data.email}
                                        onChange={(e) => profileForm.setData('email', e.target.value)}
                                    />
                                    {profileForm.data.email !== user.email ? (
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Mengganti email akan mengirim ulang verifikasi dan menandai email sebagai
                                            belum diverifikasi.
                                        </p>
                                    ) : null}
                                    <FieldError error={profileForm.errors.email} />
                                </div>
                            </div>
                            <div>
                                <Label htmlFor="job-title">Jabatan</Label>
                                <Input
                                    id="job-title"
                                    value={profileForm.data.job_title}
                                    onChange={(e) => profileForm.setData('job_title', e.target.value)}
                                />
                                <FieldError error={profileForm.errors.job_title} />
                            </div>
                            <div>
                                <div className="flex items-baseline justify-between gap-2">
                                    <Label htmlFor="bio">Bio</Label>
                                    <span className="text-xs tabular-nums text-muted-foreground">
                                        {profileForm.data.bio.length} karakter
                                    </span>
                                </div>
                                <Textarea
                                    id="bio"
                                    maxLength={65535}
                                    value={profileForm.data.bio}
                                    onChange={(e) => profileForm.setData('bio', e.target.value)}
                                />
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Bio ini tampil di byline artikel Anda.
                                </p>
                                <FieldError error={profileForm.errors.bio} />
                            </div>
                            <div className="flex justify-end">
                                <Button type="submit" disabled={profileForm.processing}>
                                    {profileForm.processing ? 'Menyimpan…' : 'Simpan Profil'}
                                </Button>
                            </div>
                        </form>
                    </SectionCard>

                    <SectionCard
                        title="Foto Profil"
                        description="Unggah atau hapus foto yang ditampilkan pada akun Anda."
                        action={
                            photoUrl && !pendingPhoto ? (
                                <Button
                                    type="button"
                                    variant="destructive"
                                    size="sm"
                                    disabled={photoForm.processing}
                                    onClick={confirmDeletePhoto}
                                >
                                    <Trash2 className="h-4 w-4" />
                                    Hapus
                                </Button>
                            ) : undefined
                        }
                    >
                        <div className="flex items-center gap-5">
                            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-muted text-2xl font-semibold text-muted-foreground">
                                {displayedPhoto ? (
                                    <img src={displayedPhoto} alt="Foto profil" className="h-full w-full object-cover" />
                                ) : (
                                    initials
                                )}
                            </div>
                            <div className="flex flex-col items-start gap-2">
                                {pendingPhoto ? (
                                    <>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                size="sm"
                                                disabled={photoForm.processing}
                                                onClick={savePhoto}
                                            >
                                                <CheckCircle2 className="h-4 w-4" />
                                                Simpan Foto
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                disabled={photoForm.processing}
                                                onClick={cancelPhoto}
                                            >
                                                Batal
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Pratinjau foto baru — simpan untuk mengganti.
                                        </p>
                                    </>
                                ) : (
                                    <>
                                        <input
                                            ref={photoRef}
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={onSelectPhoto}
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={() => photoRef.current?.click()}
                                            disabled={photoForm.processing}
                                        >
                                            <Upload className="h-4 w-4" />
                                            Pilih Foto
                                        </Button>
                                        <p className="text-xs text-muted-foreground">JPG, PNG, atau WebP. Maksimal 1MB.</p>
                                    </>
                                )}
                                <FieldError error={photoForm.errors.photo} />
                            </div>
                        </div>
                    </SectionCard>
                </div>

                <aside className="space-y-5">
                    <SectionCard
                        title="Pratinjau Byline"
                        description="Identitas Anda saat tampil di bawah artikel."
                    >
                        <article className="rounded-lg border border-border bg-background p-4">
                            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                                Contoh tampilan
                            </p>
                            <p className="font-display text-sm font-semibold leading-snug">
                                Judul berita akan tampil di bagian ini
                            </p>
                            <div className="mt-3 flex items-start gap-2.5 border-t border-border pt-3">
                                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-[10px] font-semibold text-muted-foreground">
                                    {displayedPhoto ? (
                                        <img src={displayedPhoto} alt="" className="h-full w-full object-cover" />
                                    ) : (
                                        initials
                                    )}
                                </div>
                                <div className="min-w-0 text-xs">
                                    <p className="font-medium text-foreground">
                                        Oleh {displayName}
                                        {displayJobTitle ? <span className="text-muted-foreground"> · {displayJobTitle}</span> : null}
                                    </p>
                                    <p className="mt-0.5 line-clamp-2 text-muted-foreground/80">
                                        {displayBio || 'Bio Anda akan tampil di sini.'}
                                    </p>
                                </div>
                            </div>
                        </article>
                    </SectionCard>

                    <SectionCard title="Konteks Akun" description="Ringkasan status akun Anda di sistem.">
                        <dl className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <BadgeCheck className="h-4 w-4" />
                                    Status email
                                </dt>
                                <dd>
                                    <Badge tone={verified ? 'success' : 'warning'} className="gap-1">
                                        {verified ? 'Terverifikasi' : 'Belum verifikasi'}
                                    </Badge>
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <CalendarDays className="h-4 w-4" />
                                    Bergabung
                                </dt>
                                <dd className="text-sm font-medium">{formatDate(user.created_at, true)}</dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <Clock className="h-4 w-4" />
                                    Terakhir login
                                </dt>
                                <dd className="text-sm font-medium">
                                    {user.last_login_at ? relativeTime(user.last_login_at) : 'Belum pernah login'}
                                </dd>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                                <dt className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <BadgeCheck className="h-4 w-4" />
                                    Peran
                                </dt>
                                <dd className="flex flex-wrap justify-end gap-1">
                                    {roles.length > 0 ? (
                                        roles.map((role) => (
                                            <Badge key={role.id} tone="default" className="capitalize">
                                                {role.name.replace(/_/g, ' ')}
                                            </Badge>
                                        ))
                                    ) : (
                                        <span className="text-sm text-muted-foreground">—</span>
                                    )}
                                </dd>
                            </div>
                        </dl>
                        {!verified && (
                            <p className={cn('mt-3 rounded-md bg-warning/10 p-2 text-xs text-warning')}>
                                Verifikasi email Anda agar akses penuh ke sistem aktif.
                            </p>
                        )}
                    </SectionCard>
                </aside>
            </div>

            <ConfirmDialog dialog={photoDeleteConfirm.dialog} />
        </>
    );
}