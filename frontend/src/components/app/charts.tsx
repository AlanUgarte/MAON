'use client';
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from 'recharts';
import { formatARS } from '@/lib/utils';

const AXIS = { fontSize: 11, fill: 'rgb(148 163 184)' };

function ChartTooltip({ active, payload, label, money }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-line/15 bg-surface px-3 py-2 text-xs shadow-card">
      <div className="mb-1 font-medium text-content">{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2 text-muted">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
          <span className="capitalize">{p.name}:</span>
          <span className="font-semibold text-content">
            {money ? formatARS(p.value) : p.value}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LeadsAreaChart({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <AreaChart data={data} margin={{ top: 10, right: 6, left: -18, bottom: 0 }}>
        <defs>
          <linearGradient id="gLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#56682B" stopOpacity={0.35} />
            <stop offset="100%" stopColor="#56682B" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gSales" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4E7D2C" stopOpacity={0.3} />
            <stop offset="100%" stopColor="#4E7D2C" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.12)" vertical={false} />
        <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={false} interval={1} />
        <YAxis tick={AXIS} tickLine={false} axisLine={false} width={36} />
        <Tooltip content={<ChartTooltip />} cursor={{ stroke: 'rgb(124 92 252 / 0.3)' }} />
        <Area type="monotone" dataKey="leads" name="leads" stroke="#56682B" strokeWidth={2.5} fill="url(#gLeads)" />
        <Area type="monotone" dataKey="sales" name="ventas" stroke="#4E7D2C" strokeWidth={2.5} fill="url(#gSales)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function ProductBarChart({ data }: { data: { product: string; quantity: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} layout="vertical" margin={{ top: 0, right: 12, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgb(148 163 184 / 0.1)" horizontal={false} />
        <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} />
        <YAxis type="category" dataKey="product" tick={{ ...AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
        <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgb(124 92 252 / 0.06)' }} />
        <Bar dataKey="quantity" name="unidades" radius={[0, 6, 6, 0]} barSize={18}>
          {data.map((_, i) => (
            <Cell key={i} fill={i === 0 ? '#56682B' : 'rgb(124 92 252 / 0.45)'} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function MiniSales({ data }: { data: any[] }) {
  return (
    <ResponsiveContainer width="100%" height={56}>
      <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="mini" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#4E7D2C" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#4E7D2C" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="sales" stroke="#4E7D2C" strokeWidth={2} fill="url(#mini)" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
