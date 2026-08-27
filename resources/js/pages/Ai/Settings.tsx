import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import { KeyRound, Image as ImageIcon, Save } from 'lucide-react';
import { PageHeader, SectionCard } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, FieldError } from '@/components/ui/field';
import { Switch } from '@/components/ui/controls';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

interface AiSettings {
    base_url: string;
    api_key: string | null;
    model: string;
    provider: string;
    temperature: number;
    max_tokens: number;
    image_enabled: boolean;
    image_provider: string;
    image_endpoint_url: string | null;
    image_api_key: string | null;
    has_image_api_key: boolean;
    has_api_key: boolean;
}

interface AiSettingsForm {
    base_url: string;
    api_key: string;
    model: string;
    provider: string;
    temperature: number;
    max_tokens: number;
    image_enabled: boolean;
    image_provider: string;
    image_endpoint_url: string;
    image_api_key: string;
}

export default function AiSettingsPage({ settings }: { settings: AiSettings | null }) {
    const { data, setData, put, errors, processing } = useForm<AiSettingsForm>({
        base_url: settings?.base_url ?? '',
        api_key: '',
        model: settings?.model ?? 'gpt-4o-mini',
        provider: settings?.provider ?? 'openai-compatible',
        temperature: settings?.temperature ?? 0.7,
        max_tokens: settings?.max_tokens ?? 8192,
        image_enabled: settings?.image_enabled ?? false,
        image_provider: settings?.image_provider ?? 'custom',
        image_endpoint_url: settings?.image_endpoint_url ?? '',
        image_api_key: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        put('/ai/settings');
    };

    return (
        <>
            <Head title="Pengaturan AI" />
            <PageHeader
                eyebrow="Integrasi AI"
                title="Pengaturan AI"
                description="Arahkan meja kerja ke endpoint apa pun yang kompatibel dengan OpenAI — OpenAI, Ollama, proxy lokal, apa pun yang berbicara protokol chat-completions."
            />

            <form onSubmit={submit} className="space-y-5">
                <SectionCard
                    title="Provider"
                    description="Endpoint chat-completions dan kredensial akses."
                    action={<KeyRound className="h-4 w-4 text-muted-foreground" />}
                >
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="sm:col-span-2">
                            <Label htmlFor="base_url">URL Dasar</Label>
                            <Input
                                id="base_url"
                                value={data.base_url}
                                onChange={(e) => setData('base_url', e.target.value)}
                                placeholder="https://api.openai.com/v1"
                            />
                            <FieldError error={errors.base_url} />
                        </div>
                        <div>
                            <Label htmlFor="provider">Penyedia</Label>
                            <Input id="provider" value={data.provider} disabled />
                            <FieldError error={errors.provider} />
                        </div>
                        <div>
                            <Label htmlFor="api_key">API Key</Label>
                            <Input
                                id="api_key"
                                type="password"
                                value={data.api_key}
                                onChange={(e) => setData('api_key', e.target.value)}
                                placeholder={
                                    settings?.has_api_key ? '•••••••• (biarkan kosong untuk mempertahankan)' : 'sk-...'
                                }
                            />
                            <FieldError error={errors.api_key} />
                        </div>
                        <div>
                            <Label htmlFor="model">Model</Label>
                            <Input
                                id="model"
                                value={data.model}
                                onChange={(e) => setData('model', e.target.value)}
                                placeholder="gpt-4o-mini"
                            />
                            <FieldError error={errors.model} />
                        </div>
                        <div>
                            <Label htmlFor="temperature">Temperatur</Label>
                            <Input
                                id="temperature"
                                type="number"
                                step="0.1"
                                min={0}
                                max={2}
                                value={data.temperature}
                                onChange={(e) => setData('temperature', parseFloat(e.target.value) || 0)}
                            />
                            <FieldError error={errors.temperature} />
                        </div>
                        <div>
                            <Label htmlFor="max_tokens">Token Maks</Label>
                            <Input
                                id="max_tokens"
                                type="number"
                                min={1}
                                value={data.max_tokens}
                                onChange={(e) => setData('max_tokens', parseInt(e.target.value) || 0)}
                            />
                            <FieldError error={errors.max_tokens} />
                        </div>
                    </div>
                </SectionCard>

                <SectionCard
                    title="Gambar Otomatis"
                    description="Cari & unduh gambar sesuai topik untuk featured image konten."
                    action={<ImageIcon className="h-4 w-4 text-muted-foreground" />}
                >
                    <div className="flex items-center justify-between rounded-lg border border-border p-3">
                        <div>
                            <p className="text-sm font-medium">Gambar otomatis</p>
                            <p className="text-xs text-muted-foreground">
                                Jika aktif, AI mencari gambar sesuai topik di internet, mengunduhnya, lalu
                                menjadikannya featured image. Jika nonaktif, featured image dikosongkan (editor
                                pilih manual).
                            </p>
                        </div>
                        <Switch
                            checked={data.image_enabled}
                            onCheckedChange={(v) => setData('image_enabled', v)}
                        />
                    </div>

                    {data.image_enabled && (
                        <div className="mt-4 space-y-4">
                            <div>
                                <Label>Sumber Gambar</Label>
                                <Select
                                    value={data.image_provider}
                                    onValueChange={(v) => setData('image_provider', v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="pexels">Pexels</SelectItem>
                                        <SelectItem value="unsplash">Unsplash</SelectItem>
                                        <SelectItem value="custom">Endpoint Kustom</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    Pexels & Unsplash: gunakan API key untuk mencari foto sesuai topik.
                                    Endpoint Kustom: pakai URL API pencarian gambar Anda sendiri.
                                </p>
                                <FieldError error={errors.image_provider} />
                            </div>

                            {data.image_provider === 'pexels' || data.image_provider === 'unsplash' ? (
                                <div>
                                    <Label htmlFor="image_api_key">
                                        {data.image_provider === 'unsplash' ? 'Unsplash Access Key' : 'Pexels API Key'}
                                    </Label>
                                    <Input
                                        id="image_api_key"
                                        type="password"
                                        value={data.image_api_key}
                                        onChange={(e) => setData('image_api_key', e.target.value)}
                                        placeholder={
                                            settings?.has_image_api_key
                                                ? '•••••••• (biarkan kosong untuk mempertahankan)'
                                                : data.image_provider === 'unsplash'
                                                    ? 'Paste Access Key dari unsplash.com/developers'
                                                    : 'Paste API key dari pexels.com/api'
                                        }
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Key disimpan terenkripsi di database. Pakai Unsplash jika ingin
                                        variasi foto lebih beragam dari fotografer independen.
                                    </p>
                                    <FieldError error={errors.image_api_key} />
                                </div>
                            ) : (
                                <div>
                                    <Label htmlFor="image_endpoint_url">Search Image Endpoint URL</Label>
                                    <Input
                                        id="image_endpoint_url"
                                        value={data.image_endpoint_url}
                                        onChange={(e) => setData('image_endpoint_url', e.target.value)}
                                        placeholder="https://image-api.example.com/search"
                                    />
                                    <p className="mt-1 text-xs text-muted-foreground">
                                        Endpoint pencarian gambar di internet. Harus mengembalikan URL gambar
                                        sesuai kueri topik.
                                    </p>
                                    <FieldError error={errors.image_endpoint_url} />
                                </div>
                            )}
                        </div>
                    )}
                </SectionCard>

                <div className="flex justify-end gap-2">
                    <Button type="submit" disabled={processing}>
                        <Save className="h-4 w-4" />
                        {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
                    </Button>
                </div>
            </form>
        </>
    );
}
