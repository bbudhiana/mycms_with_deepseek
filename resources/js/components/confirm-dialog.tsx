import * as React from 'react';
import { AlertTriangle, CircleCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export interface ConfirmDialogState {
    open: boolean;
    title: string;
    description?: string;
    confirmLabel?: string;
    confirmVariant?: 'destructive' | 'default' | 'primary';
    onConfirm?: () => void;
}

export function useConfirmDialog() {
    const [state, setState] = React.useState<ConfirmDialogState>({ open: false, title: '' });

    const confirm = (opts: Omit<ConfirmDialogState, 'open'>) => setState({ ...opts, open: true });
    const close = React.useCallback(() => setState((s) => ({ ...s, open: false })), []);
    const dialog = React.useMemo(() => ({ ...state, close }), [state, close]);

    return { confirm, dialog };
}

export function ConfirmDialog({ dialog }: { dialog: ConfirmDialogState & { close: () => void } }) {
    const {
        open,
        title,
        description,
        confirmLabel = 'Konfirmasi',
        confirmVariant = 'primary',
        onConfirm,
        close,
    } = dialog;
    const destructive = confirmVariant === 'destructive';
    const Icon = destructive ? AlertTriangle : CircleCheck;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && close()}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <div
                        className={cn(
                            'mb-2 flex h-10 w-10 items-center justify-center rounded-full',
                            destructive ? 'bg-destructive/10' : 'bg-primary/10',
                        )}
                    >
                        <Icon className={cn('h-5 w-5', destructive ? 'text-destructive' : 'text-primary')} />
                    </div>
                    <DialogTitle>{title}</DialogTitle>
                    {description ? <DialogDescription>{description}</DialogDescription> : null}
                </DialogHeader>
                <DialogFooter>
                    <Button type="button" variant="ghost" onClick={close}>
                        Batal
                    </Button>
                    <Button
                        variant={confirmVariant}
                        onClick={() => {
                            close();
                            onConfirm?.();
                        }}
                    >
                        {confirmLabel}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
