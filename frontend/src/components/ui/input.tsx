import * as React from 'react';
import { cn } from '@/lib/utils';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'h-9 w-full rounded-xl border border-line/15 bg-surface-2/60 px-3.5 text-sm text-content placeholder:text-muted/70',
        'transition focus:border-primary/50 focus:bg-surface-2 focus:outline-none',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
