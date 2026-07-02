'use client';
import { useState } from 'react';
import {
  Users, TrendingUp, DollarSign, Target, Receipt, Clock,
  Flame, ArrowUpRight, ChevronRight, Pencil, Sparkles,
} from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { StatCard } from '@/components/app/stat-card';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScoreGauge } from '@/components/app/score-gauge';
import { LeadsAreaChart, ProductBarChart } from '@/components/app/charts';
import { StatusBadge } from '@/components/app/status-badge';
import {
  KPIS, SERIES, PIPELINE, SALES_BY_PRODUCT, CAMPAIGN_CONVERSION, CLIENTS,
} from '@/lib/mock';
import { formatARS, formatNumber, initials } from '@/lib/utils';

const PIPE_COLORS: Record<string, string> = {
  NUEVO_LEAD: '#38BDF8', CONTACTADO: '#7C5CFC', INTERESADO: '#F59E0B',
  NEGOCIANDO: '#F59E0B', ESPERANDO_RESPUESTA: '#94A3B8',
  VENTA_CERRADA: '#10B981', VENTA_PERDIDA: '#F43F5E',
};

export default function DashboardPage() {
  const hot = [...CLIENTS].sort((a, b) => b.leadScore - a.leadScore).slice(0, 4);
  const topLead = hot[0];
  const maxPipe = Math.max(...PIPELINE.map((p) => p.count));

  // Resumen financiero: el gasto en publicidad lo carga el usuario a mano.
  const facturado = 4218500;
  const costoProductos = 1560000;
  const [adSpend, setAdSpend] = useState(380000);
  const neta = facturado - costoProductos - adSpend;
  const roas = adSpend > 0 ? facturado / adSpend : 0;

  return (
    <>
      <Topbar title="Dashboard" subtitle="Miércoles 17 de junio · resumen de hoy" />
      <main className="flex-1 space-y-6 p-5 lg:p-7">
        {/* KPIs */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Leads hoy" value={formatNumber(KPIS.leadsToday)} icon={Users} tone="primary" trend={12} hint={`${KPIS.leadsWeek} esta semana`} />
          <StatCard label="Ventas hoy" value={formatARS(KPIS.salesToday)} icon={DollarSign} tone="emerald" trend={8} hint={`${KPIS.salesTodayCount} operaciones`} />
          <StatCard label="Conversión general" value={`${KPIS.conversion}%`} icon={Target} tone="amber" trend={3} hint="leads → ventas" />
          <StatCard label="Ticket promedio" value={formatARS(KPIS.avgTicket)} icon={Receipt} tone="sky" trend={-2} />
        </section>

        {/* Resumen financiero */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen financiero · junio</CardTitle>
            <Badge tone="muted">editás el gasto de publicidad a mano</Badge>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="rounded-2xl border border-line/10 bg-surface-2/40 p-4">
                <div className="text-xs text-muted">Facturado</div>
                <div className="mt-1.5 font-display text-xl font-bold tnum text-emerald">{formatARS(facturado)}</div>
                <div className="mt-0.5 text-[11px] text-muted">{KPIS.salesMonthCount} ventas</div>
              </div>
              <div className="rounded-2xl border border-line/10 bg-surface-2/40 p-4">
                <div className="text-xs text-muted">Costo de productos</div>
                <div className="mt-1.5 font-display text-xl font-bold tnum text-content">{formatARS(costoProductos)}</div>
                <div className="mt-0.5 text-[11px] text-muted">automático</div>
              </div>
              <div className="rounded-2xl border border-amber/30 bg-amber/8 p-4">
                <div className="flex items-center gap-1 text-xs text-amber"><Pencil className="h-3 w-3" /> Gastos en publicidad</div>
                <div className="mt-1.5 flex items-center gap-1">
                  <span className="font-display text-xl font-bold text-amber">$</span>
                  <input
                    type="number"
                    value={adSpend}
                    onChange={(e) => setAdSpend(Number(e.target.value) || 0)}
                    className="w-full border-0 border-b border-dashed border-amber/50 bg-transparent p-0 font-display text-xl font-bold tnum text-amber focus:outline-none"
                  />
                </div>
                <div className="mt-0.5 text-[11px] text-amber">Meta Ads · lo cargás vos</div>
              </div>
              <div className="rounded-2xl border border-primary/30 bg-primary/8 p-4">
                <div className="text-xs text-primary">Ganancia neta</div>
                <div className="mt-1.5 font-display text-xl font-bold tnum text-primary">{formatARS(neta)}</div>
                <div className="mt-0.5 text-[11px] text-muted">facturado − costos − ads</div>
              </div>
              <div className="rounded-2xl border border-emerald/30 bg-emerald/8 p-4">
                <div className="text-xs text-emerald">ROAS</div>
                <div className="mt-1.5 font-display text-xl font-bold tnum text-emerald">{roas.toFixed(1).replace('.', ',')}x</div>
                <div className="mt-0.5 text-[11px] text-muted">retorno por $ invertido</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Gráficos + score destacado */}
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader>
              <div>
                <CardTitle>Leads y ventas</CardTitle>
                <p className="mt-0.5 text-xs text-muted">Últimos 14 días</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-full bg-primary" /> Leads</span>
                <span className="flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-full bg-emerald" /> Ventas</span>
              </div>
            </CardHeader>
            <CardContent className="pt-2">
              <LeadsAreaChart data={SERIES} />
            </CardContent>
          </Card>

          {/* Lead más caliente · destaca el medidor de firma */}
          <Card className="relative overflow-hidden">
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary/10 blur-3xl" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Flame className="h-4 w-4 text-amber" /> Lead más caliente</CardTitle>
              <Badge tone="amber" dot>en vivo</Badge>
            </CardHeader>
            <CardContent className="flex flex-col items-center pt-1">
              <ScoreGauge value={topLead.leadScore} />
              <div className="mt-4 text-center">
                <div className="font-display text-base font-semibold text-content">{topLead.firstName} {topLead.lastName}</div>
                <div className="text-xs text-muted">{topLead.product}</div>
              </div>
              <div className="mt-3 w-full rounded-xl border border-line/10 bg-surface-2/50 p-3">
                <div className="mb-1 flex items-center gap-1.5 text-[11px] font-medium text-primary">
                  <Target className="h-3 w-3" /> Próxima acción sugerida
                </div>
                <p className="text-[13px] text-content">Cerrar venta y pedir datos de envío.</p>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Pipeline */}
        <Card>
          <CardHeader>
            <CardTitle>Pipeline comercial</CardTitle>
            <a href="/clientes" className="flex items-center gap-1 text-xs text-primary hover:underline">Ver clientes <ChevronRight className="h-3 w-3" /></a>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-7">
              {PIPELINE.map((p) => (
                <div key={p.stage} className="rounded-2xl border border-line/10 bg-surface-2/40 p-3.5 transition hover:border-primary/20">
                  <div className="font-display text-2xl font-bold tnum text-content">{p.count}</div>
                  <div className="mt-0.5 mb-2 truncate text-[11px] text-muted">{p.label}</div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-line/10">
                    <div className="h-full rounded-full" style={{ width: `${(p.count / maxPipe) * 100}%`, background: PIPE_COLORS[p.stage] }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Productos + campañas + sin seguimiento */}
        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <Card>
            <CardHeader><CardTitle>Ventas por producto</CardTitle><Badge tone="emerald">este mes</Badge></CardHeader>
            <CardContent className="pt-2"><ProductBarChart data={SALES_BY_PRODUCT} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Conversión por campaña</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-1">
              {CAMPAIGN_CONVERSION.map((c) => (
                <div key={c.campaign}>
                  <div className="mb-1 flex items-center justify-between text-xs">
                    <span className="truncate text-content">{c.campaign}</span>
                    <span className="tnum font-semibold text-emerald">{c.conversion}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-line/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-primary to-emerald" style={{ width: `${c.conversion * 2.4}%` }} />
                  </div>
                  <div className="mt-1 text-[11px] text-muted">{c.leads} leads · {c.sales} ventas</div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber" /> Requieren atención</CardTitle>
              <Badge tone="rose">{KPIS.withoutFollowUp}</Badge>
            </CardHeader>
            <CardContent className="space-y-2.5 pt-1">
              {hot.map((c) => (
                <div key={c.id} className="flex items-center gap-3 rounded-xl border border-line/10 bg-surface-2/40 p-2.5 transition hover:border-primary/20">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-sky/80 text-[11px] font-bold text-white">
                    {initials(`${c.firstName} ${c.lastName}`)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium text-content">{c.firstName} {c.lastName}</div>
                    <div className="truncate text-[11px] text-muted">{c.product}</div>
                  </div>
                  <div className="text-right">
                    <div className="tnum font-display text-sm font-bold text-content">{c.leadScore}</div>
                    <StatusBadge stage={c.stage} />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </section>
      </main>
    </>
  );
}
