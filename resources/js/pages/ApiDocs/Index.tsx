import { useEffect, useMemo, useRef, useState } from 'react';
import { Head } from '@inertiajs/react';
import {
    ShieldCheck,
    KeyRound,
    Server,
    BookOpenText,
    Search,
    X,
    Copy,
    Check,
    ChevronDown,
    Lock,
    Send,
    ThumbsUp,
    Rocket,
    CalendarClock,
    Archive,
    Inbox,
} from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/feedback';
import { cn } from '@/lib/utils';

interface Endpoint {
    method: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
    path: string;
    description: string;
    permission: string | null;
    params: Array<{ name: string; type: string; description: string }>;
    body: Array<{ name: string; type: string; required: boolean; description: string }>;
    response: string | null;
    status: number[];
    notes: string[];
}

interface Group {
    name: string;
    slug: string;
    endpoints: Endpoint[];
}

interface FlowStep {
    label: string;
    method: Endpoint['method'];
    path: string;
    description: string;
}

interface Props {
    groups: Group[];
    flow: FlowStep[];
}

const METHOD_TONES: Record<Endpoint['method'], string> = {
    GET: 'bg-success/10 text-success',
    POST: 'bg-primary/10 text-primary',
    PATCH: 'bg-warning/10 text-warning',
    PUT: 'bg-warning/10 text-warning',
    DELETE: 'bg-destructive/10 text-destructive',
};

const FLOW_ICONS: Record<string, React.ElementType> = {
    'Kirim untuk review': Send,
    'Setujui atau tolak': ThumbsUp,
    Terbitkan: Rocket,
    Jadwalkan: CalendarClock,
    Arsipkan: Archive,
};

export default function ApiDocsIndex({ groups, flow }: Props) {
    const baseUrl = `${window.location.origin}`;
    const [search, setSearch] = useState('');
    const [debounced, setDebounced] = useState('');
    const [method, setMethod] = useState<'all' | Endpoint['method']>('all');
    const [expanded, setExpanded] = useState<Set<string>>(new Set());
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => setDebounced(search), 300);
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, [search]);

    const query = debounced.trim().toLowerCase();

    const filteredGroups = useMemo(
        () =>
            groups
                .map((group) => ({
                    ...group,
                    endpoints: group.endpoints.filter(
                        (ep) =>
                            (method === 'all' || ep.method === method) &&
                            (query === '' ||
                                ep.path.toLowerCase().includes(query) ||
                                ep.description.toLowerCase().includes(query) ||
                                (ep.permission ?? '').toLowerCase().includes(query)),
                    ),
                }))
                .filter((group) => group.endpoints.length > 0),
        [groups, method, query],
    );

    const totalEndpoints = useMemo(() => groups.reduce((sum, g) => sum + g.endpoints.length, 0), [groups]);

    const toggleEndpoint = (key: string) => {
        setExpanded((prev) => {
            const next = new Set(prev);
            if (next.has(key)) {
                next.delete(key);
            } else {
                next.add(key);
            }
            return next;
        });
    };

    const openEndpoint = (step: FlowStep) => {
        const key = `${step.method} ${step.path}`;
        setExpanded((prev) => new Set(prev).add(key));
        requestAnimationFrame(() => {
            document
                .querySelector(`[data-endpoint="${key}"]`)
                ?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    };

    const methodChips: Array<{ value: 'all' | Endpoint['method']; label: string }> = [
        { value: 'all', label: 'Semua' },
        { value: 'GET', label: 'GET' },
        { value: 'POST', label: 'POST' },
        { value: 'PATCH', label: 'PATCH' },
        { value: 'DELETE', label: 'DELETE' },
    ];

    const hasResults = filteredGroups.length > 0;

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
                            Mulai Cepat
                        </CardTitle>
                    </CardHeader>
                    <div className="space-y-4 p-6 pt-0 text-sm">
                        <p className="text-muted-foreground">
                            API ini memperlihatkan sumber daya utama pada sistem CMS: <strong>pengguna</strong>,{' '}
                            <strong>kategori</strong>, <strong>tag</strong>, <strong>media</strong>, dan{' '}
                            <strong>konten</strong> lengkap dengan alur <em>workflow</em> dan <em>publikasi</em>.
                            Seluruh endpoint berada di belakang autentikasi{' '}
                            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">auth:sanctum</code> dan verifikasi
                            email <code className="rounded bg-muted px-1.5 py-0.5 text-xs">verified</code>.
                        </p>

                        <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Base URL
                            </p>
                            <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 p-3">
                                <Server className="h-4 w-4 shrink-0 text-muted-foreground" />
                                <code className="min-w-0 flex-1 truncate text-sm">{baseUrl}</code>
                                <CopyButton text={baseUrl} label="Salin base URL" />
                            </div>
                        </div>

                        <div className="grid gap-4 lg:grid-cols-2">
                            <CodeBlock title="Membuat token" code={tokenTinker} copyLabel="Salin perintah tinker" />
                            <CodeBlock title="Memanggil API dengan curl" code={curlExample(baseUrl)} copyLabel="Salin contoh curl" />
                        </div>
                    </div>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <KeyRound className="h-4 w-4 text-primary" />
                            Autentikasi
                        </CardTitle>
                    </CardHeader>
                    <div className="p-6 pt-0 text-sm text-muted-foreground">
                        <p className="mb-3">
                            Gunakan Laravel Sanctum. Buat <em>personal access token</em> untuk akun Anda, lalu sertakan
                            pada setiap permintaan.
                        </p>
                        <CodeBlock
                            title="Header otorisasi"
                            code={'Authorization: Bearer <token>'}
                            copyLabel="Salin header"
                        />
                    </div>
                </Card>

                <Card className="border-primary/20 bg-gradient-to-br from-primary/[0.04] to-transparent">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-primary" />
                            Alur Penerbitan
                        </CardTitle>
                    </CardHeader>
                    <div className="p-6 pt-0">
                        <p className="mb-4 text-sm text-muted-foreground">
                            Siklus hidup konten dari draft hingga arsip. Klik tahap untuk melihat endpoint terkait.
                        </p>
                        <ol className="flex flex-col gap-3 lg:flex-row lg:items-stretch lg:gap-0">
                            {flow.map((step, index) => {
                                const Icon = FLOW_ICONS[step.label] ?? Send;

                                return (
                                    <li key={step.path} className="flex flex-1 items-stretch gap-3 lg:flex-col">
                                        <button
                                            type="button"
                                            onClick={() => openEndpoint(step)}
                                            className="group flex flex-1 items-start gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors duration-200 hover:border-primary/40 hover:bg-primary/[0.03] lg:flex-col lg:gap-2"
                                        >
                                            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                                                <Icon className="h-4 w-4" />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="flex items-center gap-2">
                                                    <span className="font-medium">{step.label}</span>
                                                    <MethodBadge method={step.method} />
                                                </span>
                                                <span className="mt-0.5 block truncate font-mono text-xs text-muted-foreground">
                                                    {step.path}
                                                </span>
                                                <span className="mt-0.5 hidden text-xs text-muted-foreground/80 sm:block">
                                                    {step.description}
                                                </span>
                                            </span>
                                        </button>
                                        {index < flow.length - 1 && (
                                            <span
                                                aria-hidden="true"
                                                className="mx-auto my-1 hidden w-px flex-1 bg-border lg:mx-2 lg:my-0 lg:mt-2 lg:w-auto lg:self-stretch"
                                            />
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    </div>
                </Card>

                <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
                    <div className="relative flex-1 sm:max-w-xs">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="pl-9 pr-9"
                            placeholder="Cari endpoint..."
                            aria-label="Cari endpoint"
                        />
                        {search ? (
                            <button
                                type="button"
                                onClick={() => setSearch('')}
                                aria-label="Bersihkan pencarian"
                                className="absolute right-2.5 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        ) : null}
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {methodChips.map((chip) => (
                            <button
                                key={chip.value}
                                type="button"
                                onClick={() => setMethod(chip.value)}
                                aria-pressed={method === chip.value}
                                className={cn(
                                    'inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors duration-200 cursor-pointer',
                                    method === chip.value
                                        ? 'border-primary/40 bg-primary/10 text-primary'
                                        : 'border-border text-muted-foreground hover:border-primary/30 hover:text-foreground',
                                )}
                            >
                                {chip.label}
                            </button>
                        ))}
                    </div>
                    <p className="text-xs text-muted-foreground lg:ml-auto lg:pr-1">
                        {filteredGroups.reduce((n, g) => n + g.endpoints.length, 0)} dari {totalEndpoints} endpoint
                    </p>
                </div>

                <div className="grid gap-6 lg:grid-cols-[220px_1fr] lg:items-start">
                    <aside className="hidden lg:block">
                        <nav className="sticky top-24 space-y-1" aria-label="Daftar isi">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                                Daftar Isi
                            </p>
                            {filteredGroups.map((group) => (
                                <a
                                    key={group.slug}
                                    href={`#${group.slug}`}
                                    className="flex items-center justify-between gap-2 rounded-md px-2 py-1.5 text-sm text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground"
                                >
                                    <span className="truncate">{group.name}</span>
                                    <span className="tabular-nums text-xs opacity-60">{group.endpoints.length}</span>
                                </a>
                            ))}
                            {!hasResults && (
                                <p className="px-2 py-1.5 text-xs text-muted-foreground">Tidak ada grup.</p>
                            )}
                        </nav>
                    </aside>

                    <div className="min-w-0 space-y-5">
                        {!hasResults ? (
                            <EmptyState
                                icon={Inbox}
                                title="Tidak ada endpoint"
                                description="Tidak ada endpoint yang cocok dengan filter Anda."
                                action={
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setSearch('');
                                            setMethod('all');
                                        }}
                                    >
                                        <X className="h-4 w-4" />
                                        Reset filter
                                    </Button>
                                }
                            />
                        ) : (
                            filteredGroups.map((group) => (
                                <section key={group.slug} id={group.slug} className="scroll-mt-24">
                                    <Card>
                                        <CardHeader>
                                            <div className="flex items-center justify-between gap-2">
                                                <CardTitle>{group.name}</CardTitle>
                                                <Badge tone="default" className="tabular-nums">
                                                    {group.endpoints.length} endpoint
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <div className="pb-2">
                                            {group.endpoints.map((ep) => {
                                                const key = `${ep.method} ${ep.path}`;
                                                const isOpen = expanded.has(key);

                                                return (
                                                    <EndpointRow
                                                        key={key}
                                                        ep={ep}
                                                        baseUrl={baseUrl}
                                                        open={isOpen}
                                                        onToggle={() => toggleEndpoint(key)}
                                                    />
                                                );
                                            })}
                                        </div>
                                    </Card>
                                </section>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}

function MethodBadge({ method }: { method: Endpoint['method'] }) {
    return (
        <span
            className={cn(
                'inline-flex w-14 shrink-0 items-center justify-center rounded-md border px-1.5 py-0.5 font-mono text-xs font-bold',
                METHOD_TONES[method],
            )}
        >
            {method}
        </span>
    );
}

function EndpointRow({
    ep,
    baseUrl,
    open,
    onToggle,
}: {
    ep: Endpoint;
    baseUrl: string;
    open: boolean;
    onToggle: () => void;
}) {
    return (
        <div className="border-b border-border last:border-b-0">
            <div className="flex items-center gap-2 px-4 py-2.5">
                <button
                    type="button"
                    onClick={onToggle}
                    aria-expanded={open}
                    data-endpoint={`${ep.method} ${ep.path}`}
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-md -mx-1 px-1 py-1 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-ring hover:bg-muted/40"
                >
                    <MethodBadge method={ep.method} />
                    <code className="min-w-0 flex-1 truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                        {ep.path}
                    </code>
                    <span className="hidden min-w-0 flex-1 truncate text-sm text-muted-foreground sm:block">
                        {ep.description}
                    </span>
                    <ChevronDown
                        className={cn('h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200', open && 'rotate-180')}
                    />
                </button>
                <CopyButton text={`${baseUrl}${ep.path}`} label="Salin URL endpoint" />
            </div>

            {open && (
                <div className="space-y-4 border-t border-border bg-muted/20 px-4 py-4">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Detail</span>
                        {ep.permission && (
                            <Badge tone="default" className="gap-1">
                                <Lock className="h-3 w-3" />
                                Izin: {ep.permission}
                            </Badge>
                        )}
                        {ep.status.map((code) => <StatusBadge key={code} code={code} />)}
                    </div>

                    {ep.notes.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {ep.notes.map((note) => (
                                <span key={note} className="inline-flex items-center gap-1 rounded-md bg-warning/10 px-2 py-1 text-xs text-warning">
                                    {note}
                                </span>
                            ))}
                        </div>
                    )}

                    {ep.params.length > 0 && (
                        <FieldTable title="Parameter query" rows={ep.params} required={false} />
                    )}

                    {ep.body.length > 0 && (
                        <FieldTable title="Body request" rows={ep.body} required />
                    )}

                    {ep.response && <JsonBlock title="Contoh respons" code={ep.response} />}
                </div>
            )}
        </div>
    );
}

function StatusBadge({ code }: { code: number }) {
    const tone = code < 300 ? 'success' : code === 404 ? 'warning' : 'default';

    return (
        <Badge tone={tone} className="tabular-nums">
            {code}
        </Badge>
    );
}

function FieldTable({
    title,
    rows,
    required,
}: {
    title: string;
    rows: Array<{ name: string; type: string; description: string } & { required?: boolean }>;
    required?: boolean;
}) {
    return (
        <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
            <div className="overflow-x-auto rounded-lg border border-border bg-card">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                            <th className="px-3 py-2 font-semibold">Nama</th>
                            <th className="px-3 py-2 font-semibold">Tipe</th>
                            {required ? <th className="px-3 py-2 font-semibold">Wajib</th> : null}
                            <th className="px-3 py-2 font-semibold">Deskripsi</th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row) => (
                            <tr key={row.name} className="border-b border-border last:border-0">
                                <td className="px-3 py-2">
                                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{row.name}</code>
                                </td>
                                <td className="px-3 py-2 text-xs text-muted-foreground">{row.type}</td>
                                {required ? (
                                    <td className="px-3 py-2">
                                        <Badge tone={row.required ? 'destructive' : 'default'}>
                                            {row.required ? 'wajib' : 'opsional'}
                                        </Badge>
                                    </td>
                                ) : null}
                                <td className="px-3 py-2 text-muted-foreground">{row.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function JsonBlock({ title, code }: { title: string; code: string }) {
    const nodes = useMemo(() => {
        const parts = code.split(/(?="[\w.]+":)/);

        return parts.map((part, index) => {
            const match = part.match(/^("[\w.]+":)/);

            if (!match) {
                return <span key={index} className="text-background/80">{part}</span>;
            }

            return (
                <span key={index}>
                    <span className="text-[#93c5fd]">{match[1]}</span>
                    <span className="text-background/80">{part.slice(match[1].length)}</span>
                </span>
            );
        });
    }, [code]);

    return (
        <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
            <pre className="overflow-x-auto rounded-lg bg-foreground p-4 font-mono text-xs leading-relaxed">
                {nodes}
            </pre>
        </div>
    );
}

function CodeBlock({ title, code, copyLabel }: { title: string; code: string; copyLabel: string }) {
    return (
        <div>
            <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</p>
                <CopyButton text={code} label={copyLabel} />
            </div>
            <pre className="overflow-x-auto rounded-lg bg-foreground p-4 font-mono text-xs leading-relaxed">
                <code className="text-background/80">{code}</code>
            </pre>
        </div>
    );
}

function CopyButton({ text, label, className }: { text: string; label: string; className?: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
        }
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    };

    return (
        <button
            type="button"
            onClick={copy}
            aria-label={label}
            title={copied ? 'Tersalin' : 'Salin'}
            className={cn(
                'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors duration-200 cursor-pointer',
                'hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                copied && 'text-success hover:text-success',
                className,
            )}
        >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        </button>
    );
}

const tokenTinker = `php artisan tinker

$user = App\\Models\\User::find(1);
$user->createToken('api-access')->accessToken;`;

const curlExample = (baseUrl: string) => `curl -X GET "${baseUrl}/api/contents" \\
  -H "Authorization: Bearer <token>" \\
  -H "Accept: application/json"`;