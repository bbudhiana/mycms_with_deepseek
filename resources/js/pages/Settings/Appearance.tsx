import { useState } from 'react';
import { Head } from '@inertiajs/react';
import { Monitor, Sun, Moon, Type, Check } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/page-header';
import { SettingsNav } from '@/components/settings-nav';
import { THEME_KEY, applyTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';

const themeOptions = [
    { id: 'system', label: 'Sistem', description: 'Mengikuti preferensi tema perangkat Anda.', icon: Monitor },
    { id: 'light', label: 'Terang', description: 'Tampilan terang dengan kontras tinggi.', icon: Sun },
    { id: 'dark', label: 'Gelap', description: 'Tampilan gelap yang nyaman di malam hari.', icon: Moon },
];

const fontOptions = [
    { id: 'sm', label: 'Ringkas', size: 'text-sm', description: 'Lebih banyak konten terlihat.' },
    { id: 'base', label: 'Standar', size: 'text-base', description: 'Ukuran default yang seimbang.' },
    { id: 'lg', label: 'Besar', size: 'text-lg', description: 'Lebih mudah dibaca.' },
];

export default function SettingsAppearance() {
    const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) ?? 'system');
    const [fontScale, setFontScale] = useState('base');

    const selectTheme = (id: string) => {
        setTheme(id);
        localStorage.setItem(THEME_KEY, id);
        applyTheme(id);
    };

    return (
        <>
            <Head title="Tampilan" />
            <PageHeader
                eyebrow="Pengaturan"
                title="Tampilan"
                description="Sesuaikan tampilan aplikasi dengan preferensi Anda."
            />

            <SettingsNav />

            <div className="space-y-5">
                <SectionCard
                    title="Tema"
                    description="Pilih skema warna untuk antarmuka. Perubahan langsung diterapkan dan tersimpan di perangkat ini."
                >
                    <div className="grid gap-3 sm:grid-cols-3">
                        {themeOptions.map((opt) => {
                            const Icon = opt.icon;
                            const selected = theme === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => selectTheme(opt.id)}
                                    className={cn(
                                        'relative flex flex-col items-start gap-3 rounded-xl border p-4 text-left transition-colors',
                                        selected ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-muted/40',
                                    )}
                                >
                                    {selected && (
                                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                            <Check className="h-3 w-3" />
                                        </span>
                                    )}
                                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted">
                                        <Icon className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">{opt.label}</p>
                                        <p className="mt-0.5 text-xs text-muted-foreground">{opt.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </SectionCard>

                <SectionCard
                    title="Skala Font"
                    description="Atur ukuran teks antarmuka agar nyaman dibaca."
                    action={<Type className="h-4 w-4 text-muted-foreground" />}
                >
                    <div className="grid gap-3 sm:grid-cols-3">
                        {fontOptions.map((opt) => {
                            const selected = fontScale === opt.id;
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => setFontScale(opt.id)}
                                    className={cn(
                                        'relative flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-colors',
                                        selected ? 'border-primary/50 bg-primary/5' : 'border-border hover:bg-muted/40',
                                    )}
                                >
                                    {selected && (
                                        <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                                            <Check className="h-3 w-3" />
                                        </span>
                                    )}
                                    <p className={cn('font-semibold', opt.size)}>Contoh teks</p>
                                    <p className="text-xs font-medium">{opt.label}</p>
                                    <p className="text-xs text-muted-foreground">{opt.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </SectionCard>

                <SectionCard
                    title="Design Tokens"
                    description="Tampilan ini dibangun menggunakan skala token Tailwind yang konsisten di seluruh aplikasi."
                >
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {[
                            { label: 'Background', swatch: 'bg-background' },
                            { label: 'Foreground', swatch: 'bg-foreground' },
                            { label: 'Primary', swatch: 'bg-primary' },
                            { label: 'Muted', swatch: 'bg-muted' },
                            { label: 'Success', swatch: 'bg-success' },
                            { label: 'Warning', swatch: 'bg-warning' },
                            { label: 'Destructive', swatch: 'bg-destructive' },
                            { label: 'Border', swatch: 'bg-border' },
                        ].map((token) => (
                            <div
                                key={token.label}
                                className="flex items-center gap-3 rounded-lg border border-border p-3"
                            >
                                <span
                                    className={cn('h-8 w-8 shrink-0 rounded-full border border-black/10', token.swatch)}
                                />
                                <span className="text-xs font-medium">{token.label}</span>
                            </div>
                        ))}
                    </div>
                </SectionCard>
            </div>
        </>
    );
}
