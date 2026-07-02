'use client';
import * as React from 'react';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'outline' | 'soft' | 'danger';
type Size = 'sm' | 'md' | 'lg' | 'icon';

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary/90 shadow-[0_6px_20px_-8px_rgb(var(--primary)/0.8)]',
  ghost: 'text-muted hover:text-content hover:bg-surface-2',
  outline: 'border border-line/15 text-content hover:bg-surface-2',
  soft: 'bg-primary/12 text-primary hover:bg-primary/20',
  danger: 'bg-rose/15 text-rose hover:bg-rose/25',
};
const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-sm gap-2',
  icon: 'h-9 w-9',
};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all duration-150 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
        variants[variant], sizes[size], className,
      )}
      {...props}
    />
  ),
);
Button.displayName = 'Button';
