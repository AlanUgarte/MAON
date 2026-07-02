import * as React from 'react';
import { cn } from '@/lib/utils';

type Tone = 'primary' | 'emerald' | 'amber' | 'rose' | 'sky' | 'muted';
const tones: Record<Tone, string> = {
  primary: 'bg-primary/12 text-primary',
  emerald: 'bg-emerald/12 text-emerald',
  amber: 'bg-amber/15 text-amber',
  rose: 'bg-rose/12 text-rose',
  sky: 'bg-sky/12 text-sky',
  muted: 'bg-surface-2 text-muted',
};

export function Badge({
  tone = 'muted', className, dot, children, ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-5',
        tones[tone], className,
      )}
      {...props}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}
