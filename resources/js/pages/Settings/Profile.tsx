import { useRef } from 'react';
import { Head, useForm } from '@inertiajs/react';
import { Upload, Trash2 } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Textarea, FieldError } from '@/components/ui/field';

interface User {
    id: number;
    name: string;
    email: string;
    job_title?: string | null;
    bio?: string | null;
    profile_photo_url?: string | null;
    addresses?: unknown[];
}

interface Props {
    user: User;
}

export default function SettingsProfile({ user }: Props) {
    const profileForm = useForm({
        name: user.name,
        email: user.email,
        job_title: user.job_title ?? '',
        bio: user.bio ?? '',
    });

    const photoForm = useForm({ photo: null as File | null });
    const photoRef = useRef<HTMLInputElement>(null);

    const photoUrl = (user as { profile_photo_url?: string | null }).profile_photo_url ?? null;

    const submitProfile = (e: React.FormEvent) => {
        e.preventDefault();
        profileForm.patch('/user/profile-information');
    };

    const onSelectPhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        photoForm.setData('photo', file);
        photoForm.post('/settings/profile-photo', { forceFormData: true, preserveScroll: true });
        e.target.value = '';
    };

    return (
        <>
            <Head title="Profil" />
            <PageHeader eyebrow="Pengaturan" title="Profil" description="Kelola informasi akun dan foto profil Anda." />

            <div className="space-y-5">
                <SectionCard
                    title="Informasi Profil"
                    description="Perbarui nama, email, jabatan, dan bio yang tampil pada profil Anda."
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
                            <Label htmlFor="bio">Bio</Label>
                            <Textarea
                                id="bio"
                                value={profileForm.data.bio}
                                onChange={(e) => profileForm.setData('bio', e.target.value)}
                            />
                            <FieldError error={profileForm.errors.bio} />
                        </div>
                        <div className="flex justify-end">
                            <Button type="submit" disabled={profileForm.processing}>
                                Simpan Profil
                            </Button>
                        </div>
                    </form>
                </SectionCard>

                <SectionCard
                    title="Foto Profil"
                    description="Unggah atau hapus foto yang ditampilkan pada akun Anda."
                    action={
                        photoUrl ? (
                            <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                disabled={photoForm.processing}
                                onClick={() => photoForm.delete('/settings/profile-photo', { preserveScroll: true })}
                            >
                                <Trash2 className="h-4 w-4" />
                                Hapus
                            </Button>
                        ) : undefined
                    }
                >
                    <div className="flex items-center gap-5">
                        <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-2xl font-semibold text-muted-foreground">
                            {photoUrl ? (
                                <img src={photoUrl} alt="Foto profil" className="h-full w-full object-cover" />
                            ) : (
                                user.name
                                    .split(' ')
                                    .slice(0, 2)
                                    .map((w) => w[0]?.toUpperCase())
                                    .join('')
                            )}
                        </div>
                        <div className="flex flex-col items-start gap-2">
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
                            <FieldError error={photoForm.errors.photo} />
                        </div>
                    </div>
                </SectionCard>
            </div>
        </>
    );
}
