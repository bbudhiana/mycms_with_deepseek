import * as React from 'react';
import {
    Bold,
    Italic,
    Underline,
    List,
    ListOrdered,
    Quote,
    Link2,
    Heading2,
    ImagePlus,
    Clock,
    Loader2,
    CheckCircle2,
    AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    onRequestImage?: () => void;
    minHeight?: number;
    readOnly?: boolean;
    onAutosave?: (html: string) => Promise<void>;
    autosaveDelay?: number;
}

function stripHtml(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
}

function countWords(text: string): number {
    if (!text.trim()) return 0;
    return text.split(/\s+/).filter(Boolean).length;
}

function estimateReadTime(wordCount: number): string {
    const wordsPerMinute = 200;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return minutes <= 1 ? '< 1 menit' : `${minutes} menit`;
}

export function RichTextEditor({
    value,
    onChange,
    onRequestImage,
    minHeight = 320,
    readOnly = false,
    onAutosave,
    autosaveDelay = 2000,
}: RichTextEditorProps) {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const toolbarRef = React.useRef<HTMLDivElement>(null);
    const [focused, setFocused] = React.useState(false);
    const [toolbarStuck, setToolbarStuck] = React.useState(false);
    const [autosaveStatus, setAutosaveStatus] = React.useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
    const autosaveTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

    const plainText = React.useMemo(() => stripHtml(value), [value]);
    const wordCount = React.useMemo(() => countWords(plainText), [plainText]);
    const readTime = React.useMemo(() => estimateReadTime(wordCount), [wordCount]);

    const exec = (command: string, arg?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, arg);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleScroll = () => {
        if (!toolbarRef.current || !editorRef.current) return;
        const toolbarRect = toolbarRef.current.getBoundingClientRect();
        const editorRect = editorRef.current.getBoundingClientRect();
        const isStuck = toolbarRect.top <= editorRect.top;
        setToolbarStuck(isStuck);
    };

    const triggerAutosave = React.useCallback(() => {
        if (!onAutosave) return;

        if (autosaveTimerRef.current) {
            clearTimeout(autosaveTimerRef.current);
        }

        setAutosaveStatus('saving');
        autosaveTimerRef.current = setTimeout(async () => {
            try {
                await onAutosave(value);
                setAutosaveStatus('saved');
                setTimeout(() => setAutosaveStatus('idle'), 2000);
            } catch {
                setAutosaveStatus('error');
                setTimeout(() => setAutosaveStatus('idle'), 3000);
            }
        }, autosaveDelay);
    }, [onAutosave, value, autosaveDelay]);

    React.useEffect(() => {
        if (onAutosave && value.trim()) {
            triggerAutosave();
        }

        return () => {
            if (autosaveTimerRef.current) {
                clearTimeout(autosaveTimerRef.current);
            }
        };
    }, [value, triggerAutosave, onAutosave]);

    // Initialize / sync the contentEditable element from the controlled value.
    // Skip when the user is actively editing, so we never clobber their input.
    React.useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (el === document.activeElement) return;
        if (el.innerHTML !== value) {
            el.innerHTML = value;
        }
    }, [value]);

    if (readOnly) {
        return (
            <div
                className="rounded-md border border-input bg-muted/40 px-3 py-2 text-sm"
                dangerouslySetInnerHTML={{ __html: value }}
            />
        );
    }

    const buttons: Array<[string, string, React.ReactNode]> = [
        ['bold', 'Tebal', <Bold key="b" className="h-4 w-4" />],
        ['italic', 'Miring', <Italic key="i" className="h-4 w-4" />],
        ['underline', 'Garis bawah', <Underline key="u" className="h-4 w-4" />],
    ];

    return (
        <div className="overflow-hidden rounded-md border border-input bg-card shadow-sm focus-within:ring-2 focus-within:ring-ring">
            <div
                ref={toolbarRef}
                className={cn(
                    'flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5',
                    'sticky top-0 z-10',
                    toolbarStuck && 'shadow-sm bg-card/95 backdrop-blur-sm border-b border-border',
                )}
                onScroll={handleScroll}
            >
                <ToolButton label="Heading 2" onClick={() => exec('formatBlock', 'h3')}>
                    <Heading2 className="h-4 w-4" />
                </ToolButton>
                <ToolButton label="Daftar berurutan" onClick={() => exec('insertUnorderedList')}>
                    <List className="h-4 w-4" />
                </ToolButton>
                <ToolButton label="Daftar bernomor" onClick={() => exec('insertOrderedList')}>
                    <ListOrdered className="h-4 w-4" />
                </ToolButton>
                <ToolButton label="Kutipan" onClick={() => exec('formatBlock', 'blockquote')}>
                    <Quote className="h-4 w-4" />
                </ToolButton>
                <ToolButton
                    label="Link"
                    onClick={() => {
                        const url = window.prompt('URL tautan:');
                        if (url) exec('createLink', url);
                    }}
                >
                    <Link2 className="h-4 w-4" />
                </ToolButton>
                {onRequestImage ? (
                    <ToolButton label="Sisipkan gambar" onClick={onRequestImage}>
                        <ImagePlus className="h-4 w-4" />
                    </ToolButton>
                ) : null}

                <span className="mx-1 h-5 w-px bg-border" aria-hidden />
                {buttons.map(([cmd, label, icon]) => (
                    <ToolButton key={cmd} label={label} onClick={() => exec(cmd)}>
                        {icon}
                    </ToolButton>
                ))}
            </div>

            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={(e) => onChange((e.currentTarget as HTMLDivElement).innerHTML)}
                onFocus={() => setFocused(true)}
                onBlur={() => setFocused(false)}
                onScroll={handleScroll}
                className={cn(
                    'prose-room min-h-[320px] w-full overflow-y-auto px-4 py-3 text-sm focus:outline-none transition-shadow duration-200',
                    focused && 'ring-2 ring-ring',
                )}
                style={{ minHeight }}
                data-placeholder="Mulai menulis artikel di sini…"
            />

            <div className="flex items-center justify-between border-t border-border bg-muted/40 px-4 py-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {readTime} baca
                    </span>
                    <span className="flex items-center gap-1">
                        <span aria-hidden="true">·</span>
                        {wordCount} kata
                    </span>
                </div>
                {onAutosave && (
                    <div className="flex items-center gap-1.5" aria-live="polite">
                        {autosaveStatus === 'saving' && (
                            <>
                                <Loader2 className="h-3 w-3 animate-spin text-primary" aria-hidden="true" />
                                <span>Menyimpan...</span>
                            </>
                        )}
                        {autosaveStatus === 'saved' && (
                            <>
                                <CheckCircle2 className="h-3 w-3 text-success" aria-hidden="true" />
                                <span>Tersimpan</span>
                            </>
                        )}
                        {autosaveStatus === 'error' && (
                            <>
                                <AlertCircle className="h-3 w-3 text-destructive" aria-hidden="true" />
                                <span>Gagal menyimpan</span>
                            </>
                        )}
                        {autosaveStatus === 'idle' && <span className="text-muted-foreground/60">Siap simpan</span>}
                    </div>
                )}
            </div>
        </div>
    );
}

function ToolButton({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            type="button"
            title={label}
            aria-label={label}
            onClick={onClick}
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-muted hover:text-foreground cursor-pointer"
        >
            {children}
        </button>
    );
}

export { RichTextEditor as default };
