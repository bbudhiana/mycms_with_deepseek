import { cn } from '@/lib/utils';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

const pipeline = ['draft', 'review', 'approved', 'published', 'archived'];

function statusIndex(status: string) {
    const i = pipeline.indexOf(status);

    return i === -1 ? 0 : i;
}

export function WorkflowStepper({ status }: { status: string }) {
    const current = statusIndex(status);

    return (
        <ol className="flex items-center gap-0">
            {pipeline.map((step, i) => {
                const isDone = i < current;
                const isCurrent = i === current;
                const isLast = i === pipeline.length - 1;

                return (
                    <li key={step} className="flex items-center">
                        <div className="flex items-center gap-1.5">
                            {isDone ? (
                                <CheckCircle2 className="h-4 w-4 text-success" />
                            ) : isCurrent ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                                <Circle className="h-4 w-4 text-muted-foreground/50" />
                            )}
                            <span
                                className={cn(
                                    'text-xs font-medium capitalize',
                                    isCurrent ? 'text-foreground' : isDone ? 'text-success' : 'text-muted-foreground',
                                )}
                            >
                                {step}
                            </span>
                        </div>
                        {!isLast ? (
                            <span
                                className={cn('mx-1.5 h-px w-5 sm:w-8', i < current ? 'bg-success' : 'bg-border')}
                                aria-hidden
                            />
                        ) : null}
                    </li>
                );
            })}
        </ol>
    );
}
