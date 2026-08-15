import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

type Variant = 'default' | 'primary' | 'secondary' | 'ghost' | 'destructive' | 'outline' | 'link';
type Size = 'default' | 'sm' | 'lg' | 'icon' | 'iconSm';

const base =
    'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-colors duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:shrink-0 cursor-pointer select-none';

const variants: Record<Variant, string> = {
    default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm',
    primary: 'bg-foreground text-background hover:bg-foreground/90 shadow-sm',
    secondary: 'bg-muted text-foreground hover:bg-muted/70',
    ghost: 'hover:bg-muted text-foreground',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-sm',
    outline: 'border border-input bg-card hover:bg-muted',
    link: 'text-accent underline-offset-4 hover:underline px-0 py-0',
};

const sizes: Record<Size, string> = {
    default: 'h-10 px-4 text-sm',
    sm: 'h-8 px-3 text-xs',
    lg: 'h-11 px-6 text-sm',
    icon: 'h-10 w-10',
    iconSm: 'h-8 w-8',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: Variant;
    size?: Size;
    asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', asChild = false, ...props }, ref) => {
        const Comp = asChild ? Slot : 'button';

        return <Comp className={cn(base, variants[variant], sizes[size], className)} ref={ref as never} {...props} />;
    },
);
Button.displayName = 'Button';

export { Button };
