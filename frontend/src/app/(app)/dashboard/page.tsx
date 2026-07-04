'use client';
import { useEffect, useMemo, useState } from 'react';
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
  KPIS, SERIES, PIPELINE, SALES_BY_PRODUCT, CAMPAIGN_CONVERSION,
} from '@/lib/mock';
import { useClients } from '@/lib/clients-store';
import { useComprobantesStore } from '@/lib/comprobantes-store';
import { useTiendaSettings } from '@/lib/tienda-settings-store';
import { api, getUser } from '@/lib/api';
import { formatARS, formatNumber, initials } from '@/lib/utils';

const PIPE_COLORS: Record<string, string> = {
  NUEVO_LEAD: '#38BDF8', CONTACTADO: '#7C5CFC', INTERESADO: '#F59E0B',
  NEGOCIANDO: '#F59E0B', ESPERANDO_RESPUESTA: '#94A3B8',
  VENTA_CERRADA: '#10B981', VENTA_PERDIDA: '#F43F5E',
};
const STAGE_LABEL: Record<string, string> = {
  NUEVO_LEAD: 'Nuevo lead', CONTACTADO: 'Contactado', INTERESADO: 'Interesado',
  NEGOCIANDO: 'Negociando', ESPERANDO_RESPUESTA: 'Esperando',
  VENTA_CERRADA: 'Cerrada', VENTA_PERDIDA: 'Perdida',
};

export default function DashboardPage() {
  const user = getUser();
  const isVendedor = user?.role === 'VENDEDOR';
  const { clients: allClients } = useClients();
  // Un vendedor solo ve sus propios leads en "Lead más caliente" / "Requieren atención".
  const CLIENTS = isVendedor ? allClients.filter((c) => c.seller === user!.fullName) : allClients;
  const [overview, setOverview] = useState<any | null>(null);
  useEffect(() => { api.overview().then(setOverview).catch(() => setOverview(null)); }, []);
  const [insights, setInsights] = useState<any | null>(null);
  useEffect(() => { api.insights().then(setInsights).catch(() => setInsights(null)); }, []);

  const kpis = overview?.kpis ?? KPIS;
  const pipeline = overview?.pipeline
    ? overview.pipeline.map((p: any) => ({ ...p, label: STAGE_LABEL[p.stage] ?? p.stage }))
    : PIPELINE;
  const series = overview
    ? (overview.leadsByDay as { date: string; value: number }[]).map((d, i) => ({
        date: d.date,
        label: new Date(d.date + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
        leads: d.value,
        sales: overview.salesByDay[i]?.value ?? 0,
      }))
    : SERIES;
  // Para un vendedor, sin datos reales significa "todavía no vendió nada" — no mostrar el mock global.
  const salesByProduct = overview?.salesByProduct?.length ? overview.salesByProduct : (isVendedor ? [] : SALES_BY_PRODUCT);
  const campaignConversion = overview?.conversionByCampaign?.length ? overview.conversionByCampaign : (isVendedor ? [] : CAMPAIGN_CONVERSION);

  const hot = [...CLIENTS].sort((a, b) => b.leadScore - a.leadScore).slice(0, 4);
  const topLead = hot[0];
  const maxPipe = Math.max(...pipeline.map((p: any) => p.count), 1);

  // Resumen financiero: real, a partir del libro de comprobantes emitidos. El gasto en
  // publicidad se sigue cargando a mano (no hay integración con Meta Ads todavía).
  const { comprobantes } = useComprobantesStore();
  const { settings } = useTiendaSettings();
  const [sellerFilter, setSellerFilter] = useState(isVendedor ? user!.fullName : '');
  const sellers = useMemo(
    () => [...new Set(comprobantes.map((c) => c.seller).filter((s) => s && s !== '-'))].sort(),
    [comprobantes],
  );
  const facturasReales = useMemo(
    () => comprobantes.filter((c) => c.sign > 0 && (!sellerFilter || c.seller === sellerFilter)),
    [comprobantes, sellerFilter],
  );
  const [adSpend, setAdSpend] = useState(380000);
  const facturado = facturasReales.reduce((a, c) => a + c.total, 0);
  const ventasCount = facturasReales.length;
  const costoProductos = Math.round(facturado / (1 + settings.margenVenta)); // estimado según el margen configurado
  const neta = facturado - costoProductos - adSpend;
  const roas = adSpend > 0 ? facturado / adSpend : 0;

  return (
    <>
      <Topbar title="Dashboard" subtitle="Miércoles 17 de junio · resumen de hoy" />
      <main className="flex-1 space-y-6 p-5 lg:p-7">
        {/* KPIs */}
        <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Leads hoy" value={formatNumber(kpis.leadsToday)} icon={Users} tone="primary" trend={12} hint={`${kpis.leadsWeek} esta semana`} />
          <StatCard label="Ventas hoy" value={formatARS(kpis.salesToday)} icon={DollarSign} tone="emerald" trend={8} hint={`${kpis.salesTodayCount} operaciones`} />
          <StatCard label="Conversión general" value={`${kpis.conversion}%`} icon={Target} tone="amber" trend={3} hint="leads → ventas" />
          <StatCard label="Ticket promedio" value={formatARS(kpis.avgTicket)} icon={Receipt} tone="sky" trend={-2} />
        </section>

        {/* Resumen financiero */}
        <Card>
          <CardHeader>
            <CardTitle>Resumen financiero · facturación real</CardTitle>
            {isVendedor ? (
              <Badge tone="sky">{user!.fullName}</Badge>
            ) : (
              <select
                value={sellerFilter}
                onChange={(e) => setSellerFilter(e.target.value)}
                className="h-8 rounded-lg border border-line/15 bg-surface px-2.5 text-[12px] font-semibold text-content focus:border-primary/50 focus:outline-none"
              >
                <option value="">Todos los vendedores</option>
                {sellers.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            )}
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              <div className="rounded-2xl border border-line/10 bg-surface-2/40 p-4">
                <div className="text-xs text-muted">Facturado</div>
                <div className="mt-1.5 font-display text-xl font-bold tnum text-emerald">{formatARS(facturado)}</div>
                <div className="mt-0.5 text-[11px] text-muted">{ventasCount} comprobante{ventasCount === 1 ? '' : 's'}</div>
              </div>
              <div className="rounded-2xl border border-line/10 bg-surface-2/40 p-4">
                <div className="text-xs text-muted">Costo de productos</div>
                <div className="mt-1.5 font-display text-xl font-bold tnum text-content">{formatARS(costoProductos)}</div>
                <div className="mt-0.5 text-[11px] text-muted">estimado según margen</div>
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

        {/* Insights de IA */}
        {insights && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Insights de IA</CardTitle>
              {!insights.usedAI && <Badge tone="muted">heurístico</Badge>}
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[13px] font-medium text-content">{insights.headline}</p>
              <ul className="list-disc space-y-1 pl-4 text-[12.5px] text-muted">
                {(insights.findings ?? []).map((f: string, i: number) => <li key={i}>{f}</li>)}
              </ul>
              {(insights.recommendations ?? []).length > 0 && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  {insights.recommendations.map((r: any, i: number) => (
                    <div key={i} className="rounded-xl border border-primary/15 bg-primary/5 p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[12px] font-semibold text-content">{r.title}</span>
                        <Badge tone={r.impact === 'ALTO' ? 'rose' : r.impact === 'MEDIO' ? 'amber' : 'muted'}>{r.impact}</Badge>
                      </div>
                      <p className="mt-1 text-[11.5px] text-muted">{r.detail}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

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
              <LeadsAreaChart data={series} />
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
              <ScoreGauge value={topLead?.leadScore ?? 0} />
              <div className="mt-4 text-center">
                <div className="font-display text-base font-semibold text-content">{topLead ? `${topLead.firstName} ${topLead.lastName}` : 'Sin leads todavía'}</div>
                <div className="text-xs text-muted">{topLead?.product}</div>
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
              {pipeline.map((p: any) => (
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
            <CardContent className="pt-2"><ProductBarChart data={salesByProduct} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Conversión por campaña</CardTitle></CardHeader>
            <CardContent className="space-y-3 pt-1">
              {campaignConversion.map((c: any) => (
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
              <Badge tone="rose">{kpis.withoutFollowUp}</Badge>
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
