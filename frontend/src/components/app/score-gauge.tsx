'use client';
import * as React from 'react';

/**
 * ScoreGauge — elemento de firma del CRM.
 * Medidor circular del Lead Score (0–100) con anillo gradiente iris→emerald.
 * El color y la etiqueta cambian según el rango (caliente / templado / frío).
 */
export function ScoreGauge({
  value,
  size = 132,
  stroke = 10,
  label = true,
}: {
  value: number;
  size?: number;
  stroke?: number;
  label?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  const id = React.useId();

  const tier =
    v >= 70 ? { name: 'Caliente', color: '#4E7D2C' }
    : v >= 45 ? { name: 'Templado', color: '#E08A2B' }
    : { name: 'Frío', color: '#3E7CC4' };

  return (
    <div className="relative inline-flex flex-col items-center" style={{ width: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={`grad-${id}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#56682B" />
            <stop offset="55%" stopColor={tier.color} />
            <stop offset="100%" stopColor={tier.color} />
          </linearGradient>
        </defs>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor" className="text-line/10" strokeWidth={stroke} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={`url(#grad-${id})`} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-3xl font-bold tnum leading-none text-content">{v}</span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-widest text-muted">score</span>
      </div>
      {label && (
        <span
          className="mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: `${tier.color}1f`, color: tier.color }}
        >
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: tier.color }} />
          {tier.name}
        </span>
      )}
    </div>
  );
}

/** Mini-barra de score para listados y tablas. */
export function ScoreBar({ value }: { value: number }) {
  const v = Math.max(0, Math.min(100, value));
  const color = v >= 70 ? '#4E7D2C' : v >= 45 ? '#E08A2B' : '#3E7CC4';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-16 overflow-hidden rounded-full bg-line/10">
        <div className="h-full rounded-full" style={{ width: `${v}%`, background: color }} />
      </div>
      <span className="tnum text-xs font-semibold text-content">{v}</span>
    </div>
  );
}
