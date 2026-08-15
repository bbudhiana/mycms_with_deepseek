import * as React from 'react';
import { Bold, Italic, Underline, List, ListOrdered, Quote, Link2, Heading2, ImagePlus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    onRequestImage?: () => void;
    minHeight?: number;
    readOnly?: boolean;
}

export function RichTextEditor({
    value,
    onChange,
    onRequestImage,
    minHeight = 320,
    readOnly = false,
}: RichTextEditorProps) {
    const editorRef = React.useRef<HTMLDivElement>(null);
    const [focused, setFocused] = React.useState(false);

    const exec = (command: string, arg?: string) => {
        editorRef.current?.focus();
        document.execCommand(command, false, arg);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

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
            <div className="flex flex-wrap items-center gap-1 border-b border-border bg-muted/40 px-2 py-1.5">
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
                className={cn(
                    'prose-room min-h-[320px] w-full overflow-y-auto px-4 py-3 text-sm focus:outline-none',
                    focused && 'ring-0',
                )}
                style={{ minHeight }}
                data-placeholder="Mulai menulis artikel di sini…"
            />
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
            className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
        >
            {children}
        </button>
    );
}

export { RichTextEditor as default };
