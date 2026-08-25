import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

const pipeline = [
    { id: 'draft', label: 'Draft' },
    { id: 'review', label: 'Menunggu Review' },
    { id: 'approved', label: 'Disetujui' },
    { id: 'published', label: 'Terbit' },
    { id: 'archived', label: 'Arsip' },
];

const pipelineIds = pipeline.map((s) => s.id);

function statusIndex(status: string) {
    const i = pipelineIds.indexOf(status);

    return i === -1 ? 0 : i;
}

export function WorkflowStepper({
    status,
    orientation = 'vertical',
}: {
    status: string;
    orientation?: 'horizontal' | 'vertical';
}) {
    const current = statusIndex(status);
    const vertical = orientation === 'vertical';

    const listClass = cn(vertical ? 'flex flex-col gap-1.5' : 'flex items-center gap-0');

    return (
        <ol className={listClass} aria-label="Alur status editorial">
            {pipeline.map((step, i) => {
                const isDone = i < current;
                const isCurrent = i === current;
                const isLast = i === pipeline.length - 1;

                const icon = isDone ? (
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
                ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                    <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
                );

                const label = (
                    <span
                        className={cn(
                            'text-xs font-medium',
                            isCurrent ? 'text-foreground' : isDone ? 'text-success' : 'text-muted-foreground',
                        )}
                    >
                        {step.label}
                    </span>
                );

                if (vertical) {
                    return (
                        <li key={step.id} className="flex items-stretch gap-2">
                            <span className="flex flex-col items-center" aria-hidden>
                                {icon}
                                {!isLast ? (
                                    <span
                                        className={cn(
                                            'mt-1 w-px flex-1 min-h-3 transition-colors duration-300',
                                            i < current ? 'bg-success' : 'bg-border',
                                        )}
                                    />
                                ) : null}
                            </span>
                            <span className="pb-2.5 pt-0.5">{label}</span>
                        </li>
                    );
                }

                return (
                    <li key={step.id} className="flex items-center">
                        <div className="flex items-center gap-1.5">
                            {icon}
                            {label}
                        </div>
                        {!isLast ? (
                            <span
                                className={cn(
                                    'mx-1.5 h-px w-5 sm:w-8 transition-colors duration-300',
                                    i < current ? 'bg-success' : 'bg-border',
                                )}
                                aria-hidden
                            />
                        ) : null}
                    </li>
                );
            })}
        </ol>
    );
}
