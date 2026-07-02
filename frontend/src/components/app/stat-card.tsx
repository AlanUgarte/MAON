'use client';
import * as React from 'react';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export function StatCard({
  label, value, icon: Icon, trend, tone = 'primary', hint,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
  trend?: number;
  tone?: 'primary' | 'emerald' | 'amber' | 'rose' | 'sky';
  hint?: string;
}) {
  const toneBg: Record<string, string> = {
    primary: 'bg-primary/12 text-primary',
    emerald: 'bg-emerald/12 text-emerald',
    amber: 'bg-amber/15 text-amber',
    rose: 'bg-rose/12 text-rose',
    sky: 'bg-sky/12 text-sky',
  };
  const up = (trend ?? 0) >= 0;
  return (
    <div className="card group relative overflow-hidden p-5 shadow-card transition-all duration-300 hover:border-primary/25">
      <div className="flex items-start justify-between">
        <div className={cn('flex h-10 w-10 items-center justify-center rounded-xl', toneBg[tone])}>
          <Icon className="h-5 w-5" />
        </div>
        {trend !== undefined && (
          <span className={cn(
            'inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
            up ? 'bg-emerald/12 text-emerald' : 'bg-rose/12 text-rose',
          )}>
            {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <div className="font-display text-2xl font-bold tnum tracking-tight text-content">{value}</div>
        <div className="mt-1 text-[13px] text-muted">{label}</div>
        {hint && <div className="mt-0.5 text-[11px] text-muted/70">{hint}</div>}
      </div>
      <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl transition-opacity duration-300 group-hover:opacity-100 opacity-0" />
    </div>
  );
}
