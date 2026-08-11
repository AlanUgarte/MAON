'use client';

import { useMemo, useState } from 'react';
import {
  LayoutDashboard, ShoppingCart, Users, Factory, Wallet, TrendingUp, Settings, LayoutGrid,
  Search, Plus, X, Trash2, Download, AlertTriangle, Check, Phone, MapPin, Sparkles,
  Banknote, Landmark, Smartphone, CircleDollarSign, PackageSearch, Inbox, CalendarClock,
  CalendarDays, CalendarRange, History,
} from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { StatCard } from '@/components/app/stat-card';
import { RevenueAreaChart, RevenueBarChart } from '@/components/app/charts';
import { formatARS, formatNumber, initials } from '@/lib/utils';
import { getUser } from '@/lib/api';
import { exportCsv } from '@/lib/export-csv';
import { useSupremasSettings, type SupremasSettings } from '@/lib/supremas-settings-store';
import { useSupremasIngredients } from '@/lib/supremas-ingredients-store';
import { useSupremasBatches } from '@/lib/supremas-batches-store';
import { useSupremasSales, type SupremaSale, type SupremaClientType, type SupremaPaymentMethod } from '@/lib/supremas-sales-store';

const CLIENT_TYPE_LABEL: Record<SupremaClientType, string> = {
  CONSUMIDOR_FINAL: 'Consumidor final', KIOSCO: 'Kiosco', MAYORISTA: 'Mayorista',
};
// Un color fijo por tramo — así se reconoce el tipo de cliente de un vistazo en
// cualquier tabla/lista, sin tener que leer el texto cada vez.
const CLIENT_TYPE_TONE: Record<SupremaClientType, 'sky' | 'amber' | 'emerald'> = {
  CONSUMIDOR_FINAL: 'sky', KIOSCO: 'amber', MAYORISTA: 'emerald',
};
const PAYMENT_LABEL: Record<SupremaPaymentMethod, string> = {
  EFECTIVO: 'Efectivo', TRANSFERENCIA: 'Transferencia', MERCADO_PAGO: 'Mercado Pago', OTRO: 'Otro',
};
const PAYMENT_ICON: Record<SupremaPaymentMethod, typeof Banknote> = {
  EFECTIVO: Banknote, TRANSFERENCIA: Landmark, MERCADO_PAGO: Smartphone, OTRO: CircleDollarSign,
};
const INPUT_CLS = 'h-9 w-full rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]';
const fmtKg = (n: number) => `${n.toLocaleString('es-AR', { maximumFractionDigits: 2 })} kg`;
const fmtDate = (d: string) => new Date(d).toLocaleDateString('es-AR');
const priceForType = (t: SupremaClientType, s: SupremasSettings) =>
  t === 'KIOSCO' ? s.priceKiosco : t === 'MAYORISTA' ? s.priceMayorista : s.priceConsumidorFinal;

function ClientTypeBadge({ type }: { type: SupremaClientType }) {
  return <Badge tone={CLIENT_TYPE_TONE[type]}>{CLIENT_TYPE_LABEL[type]}</Badge>;
}
function PaymentTag({ method }: { method: SupremaPaymentMethod }) {
  const Icon = PAYMENT_ICON[method];
  return <span className="flex items-center gap-1.5 text-[12.5px] text-muted"><Icon className="h-3.5 w-3.5" /> {PAYMENT_LABEL[method]}</span>;
}

// 3 pestañas arriba: Dashboard y Rentabilidad quedan con el estilo compacto de MAON
// (tarjetas/gráficos, igual que el resto del CRM). "Gestión" agrupa Ventas, Clientes,
// Producción, Costos y Configuración en una pantalla propia, con más aire e íconos —
// pensada para entenderse de un vistazo, no para leerse como una planilla.
const FULL_TABS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'gestion', label: 'Gestión', icon: LayoutGrid },
  { key: 'rentabilidad', label: 'Rentabilidad', icon: TrendingUp },
] as const;
type TabKey = (typeof FULL_TABS)[number]['key'];
// Vendedor: solo entra a Gestión (ahí adentro ve solo Ventas/Clientes) — sin dashboard
// ni rentabilidad, que muestran costos y ganancias (punto 24 del pedido).
const VENDEDOR_TABS: TabKey[] = ['gestion'];

export default function SupremasPage() {
  const user = getUser();
  const isVendedor = user?.role === 'VENDEDOR';
  const tabs = isVendedor ? FULL_TABS.filter((t) => VENDEDOR_TABS.includes(t.key)) : FULL_TABS;

  const [tab, setTab] = useState<TabKey>(isVendedor ? 'gestion' : 'dashboard');

  const { settings, save: saveSettings } = useSupremasSettings();
  const { ingredients, costeo, create: createIngredient, update: updateIngredient, remove: removeIngredient } = useSupremasIngredients();
  const { batches, stock, create: createBatch, remove: removeBatch } = useSupremasBatches();
  const { sales, createSale, removeSale } = useSupremasSales();

  const [showNewSale, setShowNewSale] = useState(false);

  return (
    <>
      <Topbar title="Supremas de Pollo" subtitle="Costos, producción, clientes y ventas del negocio de supremas" />
      <main className="flex-1 space-y-5 p-5 lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap rounded-[10px] border border-line/15 bg-surface-2 p-0.5">
            {tabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${tab === t.key ? 'bg-primary text-white' : 'text-muted hover:text-content'}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                </button>
              );
            })}
          </div>
          <Button onClick={() => setShowNewSale(true)}><Plus className="h-4 w-4" /> Nueva venta</Button>
        </div>

        {tab === 'dashboard' && <DashboardTab sales={sales} stock={stock} />}
        {tab === 'gestion' && (
          <GestionTab
            isVendedor={isVendedor}
            sales={sales} onDeleteSale={removeSale}
            batches={batches} stock={stock} settings={settings} onCreateBatch={createBatch} onDeleteBatch={removeBatch}
            ingredients={ingredients} costeo={costeo} onCreateIngredient={createIngredient} onUpdateIngredient={updateIngredient} onDeleteIngredient={removeIngredient}
            onSaveSettings={saveSettings}
          />
        )}
        {tab === 'rentabilidad' && !isVendedor && <RentabilidadTab sales={sales} />}
      </main>

      {showNewSale && (
        <NewSaleModal
          sales={sales}
          settings={settings}
          stock={stock}
          isAdmin={!isVendedor}
          onClose={() => setShowNewSale(false)}
          onCreate={createSale}
        />
      )}
    </>
  );
}

// ------------------------------ Gestión (Ventas/Clientes/Producción/Costos/Config) ------------------------------

const GESTION_SUB_TABS = [
  { key: 'ventas', label: 'Ventas', icon: ShoppingCart },
  { key: 'clientes', label: 'Clientes', icon: Users },
  { key: 'produccion', label: 'Producción', icon: Factory },
  { key: 'costos', label: 'Costos', icon: Wallet },
  { key: 'config', label: 'Configuración', icon: Settings },
] as const;
type GestionKey = (typeof GESTION_SUB_TABS)[number]['key'];
const VENDEDOR_GESTION_TABS: GestionKey[] = ['ventas', 'clientes'];

function GestionTab({
  isVendedor,
  sales, onDeleteSale,
  batches, stock, settings, onCreateBatch, onDeleteBatch,
  ingredients, costeo, onCreateIngredient, onUpdateIngredient, onDeleteIngredient,
  onSaveSettings,
}: {
  isVendedor: boolean;
  sales: SupremaSale[]; onDeleteSale: (id: string) => Promise<void>;
  batches: any[]; stock: { producidoKg: number; vendidoKg: number; stockKg: number }; settings: SupremasSettings;
  onCreateBatch: (dto: any) => Promise<void>; onDeleteBatch: (id: string) => Promise<void>;
  ingredients: any[]; costeo: any; onCreateIngredient: (dto: any) => Promise<void>; onUpdateIngredient: (id: string, dto: any) => Promise<void>; onDeleteIngredient: (id: string) => Promise<void>;
  onSaveSettings: (s: SupremasSettings) => void;
}) {
  const subTabs = isVendedor ? GESTION_SUB_TABS.filter((t) => VENDEDOR_GESTION_TABS.includes(t.key)) : GESTION_SUB_TABS;
  const [sub, setSub] = useState<GestionKey>('ventas');

  const clientesCount = useMemo(() => new Set(sales.map((s) => s.clientId)).size, [sales]);
  // Un dato en vivo en vez del subtítulo fijo — así el menú ya funciona como un mini
  // resumen (cuántas ventas, cuántos clientes, cuánto stock) sin entrar a cada sección.
  const liveDesc: Record<GestionKey, string> = {
    ventas: `${sales.length} venta${sales.length === 1 ? '' : 's'}`,
    clientes: `${clientesCount} cliente${clientesCount === 1 ? '' : 's'}`,
    produccion: `Stock: ${fmtKg(stock.stockKg)}`,
    costos: costeo ? `${formatARS(costeo.costoPorKg)}/kg` : 'Ingredientes y costeo',
    config: 'Precios y ajustes',
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
        {subTabs.map((t) => {
          const Icon = t.icon;
          const active = sub === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setSub(t.key)}
              className={`group flex items-center gap-3 rounded-2xl border p-3.5 text-left transition-all ${active ? 'border-primary/40 bg-primary/8 shadow-[0_6px_20px_-10px_rgb(var(--primary)/0.5)]' : 'border-line/10 bg-surface hover:border-primary/20 hover:bg-surface-2'}`}
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-colors ${active ? 'bg-primary text-white' : 'bg-primary/10 text-primary group-hover:bg-primary/15'}`}>
                <Icon className="h-[18px] w-[18px]" />
              </span>
              <span className="min-w-0">
                <span className={`block truncate text-[13.5px] font-bold ${active ? 'text-primary' : 'text-content'}`}>{t.label}</span>
                <span className="block truncate text-[11px] text-muted">{liveDesc[t.key]}</span>
              </span>
            </button>
          );
        })}
      </div>

      {sub === 'ventas' && <VentasTab sales={sales} isVendedor={isVendedor} onDelete={onDeleteSale} />}
      {sub === 'clientes' && <ClientesTab sales={sales} isVendedor={isVendedor} />}
      {sub === 'produccion' && !isVendedor && (
        <ProduccionTab batches={batches} stock={stock} costeo={costeo} settings={settings} onCreate={onCreateBatch} onDelete={onDeleteBatch} />
      )}
      {sub === 'costos' && !isVendedor && (
        <CostosTab ingredients={ingredients} costeo={costeo} onCreate={onCreateIngredient} onUpdate={onUpdateIngredient} onDelete={onDeleteIngredient} />
      )}
      {sub === 'config' && !isVendedor && <ConfigTab settings={settings} onSave={onSaveSettings} />}
    </div>
  );
}

// ------------------------------ Dashboard ------------------------------

function DashboardTab({ sales, stock }: { sales: SupremaSale[]; stock: { stockKg: number } }) {
  const kpis = useMemo(() => {
    const facturacion = sales.reduce((a, s) => a + s.total, 0);
    const costos = sales.reduce((a, s) => a + s.cost, 0);
    const ganancia = facturacion - costos;
    const margen = facturacion > 0 ? (ganancia / facturacion) * 100 : 0;
    const kg = sales.reduce((a, s) => a + s.kg, 0);
    const clientes = new Set(sales.map((s) => s.clientId)).size;
    return { facturacion, costos, ganancia, margen, kg, clientes };
  }, [sales]);

  const ventasPorDia = useMemo(() => {
    const byDay = new Map<string, { label: string; ventas: number; ganancia: number; ts: number }>();
    for (const s of sales) {
      const dt = new Date(s.fecha);
      const key = dt.toISOString().slice(0, 10);
      const entry = byDay.get(key) ?? { label: dt.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }), ventas: 0, ganancia: 0, ts: dt.getTime() };
      entry.ventas += s.total; entry.ganancia += s.profit;
      byDay.set(key, entry);
    }
    return [...byDay.values()].sort((a, b) => a.ts - b.ts).slice(-30);
  }, [sales]);

  const distribucionTipo = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of sales) map.set(CLIENT_TYPE_LABEL[s.clientType], (map.get(CLIENT_TYPE_LABEL[s.clientType]) ?? 0) + s.kg);
    return [...map.entries()].map(([label, ventas]) => ({ label, ventas })).sort((a, b) => b.ventas - a.ventas);
  }, [sales]);

  const topClientes = useMemo(() => {
    const map = new Map<string, { label: string; ventas: number }>();
    for (const s of sales) {
      const e = map.get(s.clientId) ?? { label: s.clientName, ventas: 0 };
      e.ventas += s.total;
      map.set(s.clientId, e);
    }
    return [...map.values()].sort((a, b) => b.ventas - a.ventas).slice(0, 8);
  }, [sales]);

  return (
    <div className="space-y-5">
      <section className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Facturación" value={formatARS(kpis.facturacion)} icon={Wallet} tone="emerald" />
        <StatCard label="Costos" value={formatARS(kpis.costos)} icon={Factory} tone="amber" />
        <StatCard label="Ganancia" value={formatARS(kpis.ganancia)} icon={TrendingUp} tone="primary" />
        <StatCard label="Margen" value={`${kpis.margen.toFixed(1)}%`} icon={TrendingUp} tone="sky" />
        <StatCard label="Kg vendidos" value={fmtKg(kpis.kg)} icon={ShoppingCart} tone="primary" hint={`Stock actual: ${fmtKg(stock.stockKg)}`} />
        <StatCard label="Clientes" value={formatNumber(kpis.clientes)} icon={Users} tone="sky" />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Facturación por día</CardTitle></CardHeader>
          <CardContent className="pt-2">
            {ventasPorDia.length ? <RevenueAreaChart data={ventasPorDia} dataKey="ventas" /> : <EmptyChart />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Ganancia por día</CardTitle></CardHeader>
          <CardContent className="pt-2">
            {ventasPorDia.length ? <RevenueAreaChart data={ventasPorDia} dataKey="ganancia" /> : <EmptyChart />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Distribución de clientes (kg)</CardTitle></CardHeader>
          <CardContent className="pt-2">
            {distribucionTipo.length ? <RevenueBarChart data={distribucionTipo} /> : <EmptyChart />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Top clientes</CardTitle></CardHeader>
          <CardContent className="pt-2">
            {topClientes.length ? <RevenueBarChart data={topClientes} /> : <EmptyChart />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function EmptyChart() {
  return <div className="py-6 text-center text-[12.5px] text-muted">Sin datos todavía.</div>;
}

// ------------------------------ Ventas ------------------------------

function VentasTab({ sales, isVendedor, onDelete }: { sales: SupremaSale[]; isVendedor: boolean; onDelete: (id: string) => Promise<void> }) {
  const [q, setQ] = useState('');
  const [tipo, setTipo] = useState('');
  const [pago, setPago] = useState('');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      const hay = `${s.clientName} ${s.clientPhone}`.toLowerCase();
      if (q && !hay.includes(q.toLowerCase())) return false;
      if (tipo && s.clientType !== tipo) return false;
      if (pago && s.paymentMethod !== pago) return false;
      const fecha = s.fecha.slice(0, 10);
      if (desde && fecha < desde) return false;
      if (hasta && fecha > hasta) return false;
      return true;
    });
  }, [sales, q, tipo, pago, desde, hasta]);

  const doExport = () => {
    const headers = ['Fecha', 'Cliente', 'Teléfono', 'Tipo', 'Kg', 'Precio/kg', 'Facturación', 'Costo', 'Ganancia', 'Margen %', 'Pago'];
    const rows = filtered.map((s) => [
      fmtDate(s.fecha), s.clientName, s.clientPhone, CLIENT_TYPE_LABEL[s.clientType], s.kg, s.pricePerKg,
      s.total, s.cost, s.profit, s.marginPct.toFixed(1), PAYMENT_LABEL[s.paymentMethod],
    ]);
    exportCsv('supremas-ventas', headers, rows);
  };

  const totalFiltrado = filtered.reduce((a, s) => a + s.total, 0);
  const kgFiltrado = filtered.reduce((a, s) => a + s.kg, 0);
  const hayFiltros = !!(q || tipo || pago || desde || hasta);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line/10 bg-surface p-3.5">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente o teléfono..." className="h-[38px] w-full rounded-[10px] border border-line/15 bg-surface pl-9 pr-3 text-[13px]" />
          </div>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="h-[38px] rounded-[10px] border border-line/15 bg-surface px-2.5 text-[13px] font-semibold">
            <option value="">Todos los tipos</option>
            {Object.entries(CLIENT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select value={pago} onChange={(e) => setPago(e.target.value)} className="h-[38px] rounded-[10px] border border-line/15 bg-surface px-2.5 text-[13px] font-semibold">
            <option value="">Todos los pagos</option>
            {Object.entries(PAYMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-[38px] rounded-[10px] border border-line/15 bg-surface px-2.5 text-[13px]" />
          <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-[38px] rounded-[10px] border border-line/15 bg-surface px-2.5 text-[13px]" />
          <Button variant="outline" size="sm" onClick={doExport}><Download className="h-3.5 w-3.5" /> Exportar</Button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-line/10 pt-3 text-[12.5px] text-muted">
          <span>{hayFiltros ? 'Filtrado' : 'Total'}: <b className="text-content">{filtered.length}</b> venta{filtered.length === 1 ? '' : 's'}</span>
          <span>· <b className="text-content">{fmtKg(kgFiltrado)}</b></span>
          <span>· <b className="text-emerald">{formatARS(totalFiltrado)}</b> facturados</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line/10 bg-surface">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line/10 text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="p-3">Fecha</th><th className="p-3">Cliente</th><th className="p-3">Tipo</th><th className="p-3">Kg</th>
              <th className="p-3">Precio/kg</th><th className="p-3">Facturación</th>
              {!isVendedor && <><th className="p-3">Costo</th><th className="p-3">Ganancia</th><th className="p-3">Margen</th></>}
              <th className="p-3">Pago</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((s) => (
              <tr key={s.id} className="border-b border-line/10 hover:bg-surface-2">
                <td className="p-3 text-muted">{fmtDate(s.fecha)}</td>
                <td className="p-3 font-semibold">{s.clientName}</td>
                <td className="p-3"><ClientTypeBadge type={s.clientType} /></td>
                <td className="p-3">{fmtKg(s.kg)}</td>
                <td className="p-3">{formatARS(s.pricePerKg)}</td>
                <td className="p-3 font-bold">{formatARS(s.total)}</td>
                {!isVendedor && (
                  <>
                    <td className="p-3 text-muted">{formatARS(s.cost)}</td>
                    <td className="p-3 text-emerald">{formatARS(s.profit)}</td>
                    <td className="p-3 text-emerald">{s.marginPct.toFixed(1)}%</td>
                  </>
                )}
                <td className="p-3"><PaymentTag method={s.paymentMethod} /></td>
                <td className="p-3">
                  {!isVendedor && (
                    <button
                      onClick={() => { if (confirm('¿Eliminar esta venta? Esta acción no se puede deshacer.')) onDelete(s.id); }}
                      aria-label="Eliminar" className="rounded-lg p-1.5 text-muted hover:bg-rose/15 hover:text-rose"
                    ><Trash2 className="h-4 w-4" /></button>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr><td colSpan={isVendedor ? 7 : 10} className="p-10 text-center text-muted">
                <Inbox className="mx-auto mb-2 h-8 w-8 opacity-40" />
                {hayFiltros ? 'Ninguna venta coincide con estos filtros.' : 'Todavía no hay ventas cargadas.'}
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------------------ Clientes ------------------------------

interface ClienteAgg {
  clientId: string; name: string; phone: string; address?: string;
  totalCompras: number; kgComprados: number; dineroGastado: number; ultimaCompra: string; ticketPromedio: number;
}

function ClientesTab({ sales, isVendedor }: { sales: SupremaSale[]; isVendedor: boolean }) {
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState<string | null>(null);

  const clientes = useMemo<ClienteAgg[]>(() => {
    const map = new Map<string, ClienteAgg>();
    for (const s of sales) {
      const e = map.get(s.clientId) ?? {
        clientId: s.clientId, name: s.clientName, phone: s.clientPhone, address: s.clientAddress,
        totalCompras: 0, kgComprados: 0, dineroGastado: 0, ultimaCompra: s.fecha, ticketPromedio: 0,
      };
      e.totalCompras += 1; e.kgComprados += s.kg; e.dineroGastado += s.total;
      if (s.fecha > e.ultimaCompra) e.ultimaCompra = s.fecha;
      map.set(s.clientId, e);
    }
    for (const e of map.values()) e.ticketPromedio = e.dineroGastado / e.totalCompras;
    return [...map.values()].sort((a, b) => b.dineroGastado - a.dineroGastado);
  }, [sales]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return clientes;
    return clientes.filter((c) => `${c.name} ${c.phone} ${c.address ?? ''}`.toLowerCase().includes(query));
  }, [clientes, q]);

  const ficha = selected ? clientes.find((c) => c.clientId === selected) : null;
  const historial = selected ? sales.filter((s) => s.clientId === selected).sort((a, b) => (a.fecha < b.fecha ? 1 : -1)) : [];

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.3fr]">
      <div className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nombre, teléfono o dirección..." className="h-[38px] w-full rounded-[10px] border border-line/15 bg-surface pl-9 pr-3 text-[13px]" />
        </div>
        <div className="max-h-[560px] space-y-1.5 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.clientId}
              onClick={() => setSelected(c.clientId)}
              className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${selected === c.clientId ? 'border-primary bg-primary/5' : 'border-line/10 bg-surface hover:bg-surface-2'}`}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky text-[12px] font-bold text-white">{initials(c.name)}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold">{c.name}</span>
                  <span className="shrink-0 font-bold text-emerald">{formatARS(c.dineroGastado)}</span>
                </div>
                <div className="mt-0.5 truncate text-[12px] text-muted">{c.phone} · {fmtKg(c.kgComprados)} · {c.totalCompras} compra{c.totalCompras === 1 ? '' : 's'}</div>
              </div>
            </button>
          ))}
          {!filtered.length && <div className="rounded-xl border border-dashed border-line/15 p-6 text-center text-[13px] text-muted">Sin clientes todavía.</div>}
        </div>
      </div>

      <div>
        {!ficha ? (
          <div className="flex h-full min-h-[300px] items-center justify-center rounded-2xl border border-dashed border-line/15 text-[13px] text-muted">
            Elegí un cliente para ver su ficha.
          </div>
        ) : (
          <Card>
            <CardHeader className="items-start gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky text-[13px] font-bold text-white">{initials(ficha.name)}</span>
              <div className="min-w-0 flex-1">
                <CardTitle>{ficha.name}</CardTitle>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12px] text-muted">
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {ficha.phone}</span>
                  {ficha.address && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {ficha.address}</span>}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
              <div className="grid grid-cols-2 gap-2 text-[13px] sm:grid-cols-4">
                <div className="rounded-xl bg-surface-2 p-3"><div className="text-[11px] text-muted">Compras</div><div className="font-bold">{ficha.totalCompras}</div></div>
                <div className="rounded-xl bg-surface-2 p-3"><div className="text-[11px] text-muted">Kg comprados</div><div className="font-bold">{fmtKg(ficha.kgComprados)}</div></div>
                <div className="rounded-xl bg-surface-2 p-3"><div className="text-[11px] text-muted">Gastado</div><div className="font-bold">{formatARS(ficha.dineroGastado)}</div></div>
                <div className="rounded-xl bg-surface-2 p-3"><div className="text-[11px] text-muted">Ticket promedio</div><div className="font-bold">{formatARS(ficha.ticketPromedio)}</div></div>
              </div>
              <div className="text-[12px] text-muted">Última compra: {fmtDate(ficha.ultimaCompra)}</div>

              <div className="overflow-x-auto rounded-xl border border-line/10">
                <table className="w-full text-[12.5px]">
                  <thead>
                    <tr className="border-b border-line/10 text-left text-[10.5px] uppercase tracking-wide text-muted">
                      <th className="p-2.5">Fecha</th><th className="p-2.5">Kg</th><th className="p-2.5">Precio/kg</th><th className="p-2.5">Total</th>
                      {!isVendedor && <th className="p-2.5">Ganancia</th>}
                      <th className="p-2.5">Pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historial.map((s) => (
                      <tr key={s.id} className="border-b border-line/10">
                        <td className="p-2.5 text-muted">{fmtDate(s.fecha)}</td>
                        <td className="p-2.5">{fmtKg(s.kg)}</td>
                        <td className="p-2.5">{formatARS(s.pricePerKg)}</td>
                        <td className="p-2.5 font-semibold">{formatARS(s.total)}</td>
                        {!isVendedor && <td className="p-2.5 text-emerald">{formatARS(s.profit)}</td>}
                        <td className="p-2.5"><PaymentTag method={s.paymentMethod} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// ------------------------------ Producción ------------------------------

function ProduccionTab({
  batches, stock, costeo, settings, onCreate, onDelete,
}: {
  batches: { id: string; fecha: string; lote: string; kgProducidos: number; costoTotal: number; costoPorKg: number; observaciones?: string }[];
  stock: { producidoKg: number; vendidoKg: number; stockKg: number };
  costeo: { costoTotal: number; produccionKg: number } | null;
  settings: SupremasSettings;
  onCreate: (dto: { fecha?: string; lote?: string; kgProducidos: number; costoTotal: number; observaciones?: string }) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [kg, setKg] = useState(String(settings.produccionBaseKg));
  const [costoTotal, setCostoTotal] = useState(String(costeo?.costoTotal ?? ''));
  const [lote, setLote] = useState('');
  const [obs, setObs] = useState('');
  const [busy, setBusy] = useState(false);

  // Sugerencia automática: si el costeo base cambia (cambió un ingrediente) y el kg
  // sigue siendo el default, el costo sugerido se actualiza solo (punto 33 del pedido).
  const sugerido = costeo && Number(kg) > 0 ? Math.round((costeo.costoTotal / costeo.produccionKg) * Number(kg) * 100) / 100 : null;

  const submit = async () => {
    if (!(Number(kg) > 0) || !(Number(costoTotal) >= 0)) return;
    setBusy(true);
    try {
      await onCreate({ lote: lote.trim() || undefined, kgProducidos: Number(kg), costoTotal: Number(costoTotal), observaciones: obs.trim() || undefined });
      setKg(String(settings.produccionBaseKg)); setCostoTotal(''); setLote(''); setObs('');
    } finally { setBusy(false); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
      <div className="space-y-4">
        <section className="rounded-2xl border border-line/10 bg-surface p-4">
          <div className="flex items-end justify-between">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">Stock actual</div>
              <div className="font-display text-3xl font-extrabold text-primary">{fmtKg(stock.stockKg)}</div>
            </div>
            <div className="text-right text-[12px] text-muted">
              <div>Producido: <b className="text-content">{fmtKg(stock.producidoKg)}</b></div>
              <div>Vendido: <b className="text-content">{fmtKg(stock.vendidoKg)}</b></div>
            </div>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className={`h-full rounded-full transition-all ${stock.stockKg < 0 ? 'bg-rose' : 'bg-primary'}`}
              style={{ width: `${stock.producidoKg > 0 ? Math.min(100, Math.max(0, (stock.stockKg / stock.producidoKg) * 100)) : 0}%` }}
            />
          </div>
        </section>

        <Card>
          <CardHeader><CardTitle>Registrar lote</CardTitle></CardHeader>
          <CardContent className="space-y-2.5 pt-0">
            <input value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Lote (opcional, ej. Lote #002)" className="h-9 w-full rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-muted">Kg producidos</label>
                <input type="number" value={kg} onChange={(e) => setKg(e.target.value)} className="h-9 w-full rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
              </div>
              <div>
                <label className="text-[11px] text-muted">Costo del lote {sugerido != null && <button type="button" onClick={() => setCostoTotal(String(sugerido))} className="text-primary hover:underline">(usar sugerido: {formatARS(sugerido)})</button>}</label>
                <input type="number" value={costoTotal} onChange={(e) => setCostoTotal(e.target.value)} className="h-9 w-full rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
              </div>
            </div>
            {Number(kg) > 0 && Number(costoTotal) > 0 && (
              <div className="text-[12px] text-muted">Costo/kg: <b className="text-content">{formatARS(Number(costoTotal) / Number(kg))}</b></div>
            )}
            <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observaciones" rows={2} className="w-full rounded-[10px] border border-line/15 bg-surface p-2.5 text-[13px]" />
            <Button onClick={submit} disabled={busy} className="w-full">{busy ? 'Guardando…' : 'Registrar lote'}</Button>
          </CardContent>
        </Card>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-line/10 bg-surface">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line/10 text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="p-3">Fecha</th><th className="p-3">Lote</th><th className="p-3">Kg</th><th className="p-3">Costo total</th><th className="p-3">Costo/kg</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {batches.map((b) => (
              <tr key={b.id} className="border-b border-line/10 hover:bg-surface-2">
                <td className="p-3 text-muted">{fmtDate(b.fecha)}</td>
                <td className="p-3 font-semibold">{b.lote}</td>
                <td className="p-3">{fmtKg(b.kgProducidos)}</td>
                <td className="p-3">{formatARS(b.costoTotal)}</td>
                <td className="p-3 font-bold">{formatARS(b.costoPorKg)}</td>
                <td className="p-3">
                  <button onClick={() => { if (confirm('¿Eliminar este lote?')) onDelete(b.id); }} aria-label="Eliminar" className="rounded-lg p-1.5 text-muted hover:bg-rose/15 hover:text-rose"><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {!batches.length && (
              <tr><td colSpan={6} className="p-10 text-center text-muted">
                <PackageSearch className="mx-auto mb-2 h-8 w-8 opacity-40" />
                Sin lotes registrados todavía.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ------------------------------ Costos ------------------------------

function CostosTab({
  ingredients, costeo, onCreate, onUpdate, onDelete,
}: {
  ingredients: { id: string; name: string; purchaseQty: number; unit: string; purchasePrice: number; usedQty: number; supplier?: string; updatedAt: string }[];
  costeo: { ingredientes: { id: string; name: string; costoUtilizado: number }[]; ingredientesCost: number; envaseCost: number; costoTotal: number; produccionKg: number; costoPorKg: number } | null;
  onCreate: (dto: any) => Promise<void>;
  onUpdate: (id: string, dto: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: '', purchaseQty: '', unit: 'kg', purchasePrice: '', usedQty: '', supplier: '' });

  const submit = async () => {
    if (!form.name.trim() || !(Number(form.purchaseQty) > 0) || !(Number(form.purchasePrice) >= 0) || !(Number(form.usedQty) >= 0)) return;
    await onCreate({
      name: form.name.trim(), purchaseQty: Number(form.purchaseQty), unit: form.unit.trim() || 'un',
      purchasePrice: Number(form.purchasePrice), usedQty: Number(form.usedQty), supplier: form.supplier.trim() || undefined,
    });
    setForm({ name: '', purchaseQty: '', unit: 'kg', purchasePrice: '', usedQty: '', supplier: '' });
    setShowNew(false);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.6fr_1fr]">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[15px] font-bold">Ingredientes</div>
            <div className="text-[12px] text-muted">Lo que compras para cada lote — tocá un valor para editarlo.</div>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {ingredients.map((i) => (
            <IngredientCard key={i.id} ingredient={i} onUpdate={onUpdate} onDelete={onDelete} />
          ))}
          <button
            onClick={() => setShowNew(true)}
            className="flex min-h-[168px] flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line/20 text-muted transition hover:border-primary/40 hover:text-primary"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10"><Plus className="h-5 w-5" /></span>
            <span className="text-[13px] font-semibold">Agregar ingrediente</span>
          </button>
          {!ingredients.length && (
            <div className="col-span-full rounded-2xl border border-dashed border-line/15 p-6 text-center text-muted">Sin ingredientes cargados todavía.</div>
          )}
        </div>
      </div>

      <Card className="h-fit lg:sticky lg:top-5">
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" /> Costeo del lote base</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          {costeo ? (
            <>
              <div className="space-y-2 text-[13px]">
                {costeo.ingredientes.map((ing: any) => (
                  <div key={ing.id} className="flex items-center justify-between">
                    <span className="text-muted">{ing.name}</span>
                    <span className="tnum font-medium">{formatARS(ing.costoUtilizado)}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between border-t border-line/10 pt-2">
                  <span className="text-muted">Envases + bolsas</span>
                  <span className="tnum font-medium">{formatARS(costeo.envaseCost)}</span>
                </div>
                <div className="flex items-center justify-between border-t border-line/10 pt-2 font-bold">
                  <span>Costo total del lote</span>
                  <span className="tnum">{formatARS(costeo.costoTotal)}</span>
                </div>
                <div className="flex items-center justify-between text-muted">
                  <span>Producción obtenida</span>
                  <span className="tnum">{fmtKg(costeo.produccionKg)}</span>
                </div>
              </div>
              <div className="rounded-2xl bg-primary/10 p-4 text-center">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-primary">Costo aproximado por kg</div>
                <div className="font-display text-3xl font-extrabold text-primary">{formatARS(costeo.costoPorKg)}</div>
              </div>
            </>
          ) : <div className="text-muted">Cargando…</div>}
        </CardContent>
      </Card>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-[420px] rounded-2xl border border-line/10 bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><div className="font-bold">Nuevo ingrediente</div><button onClick={() => setShowNew(false)}><X className="h-5 w-5" /></button></div>
            <div className="grid grid-cols-2 gap-2">
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre*" className="col-span-2 h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
              <input type="number" value={form.purchaseQty} onChange={(e) => setForm((f) => ({ ...f, purchaseQty: e.target.value }))} placeholder="Cantidad comprada*" className="h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
              <input value={form.unit} onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))} placeholder="Unidad (kg, un...)" className="h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
              <input type="number" value={form.purchasePrice} onChange={(e) => setForm((f) => ({ ...f, purchasePrice: e.target.value }))} placeholder="Precio de compra*" className="h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
              <input type="number" value={form.usedQty} onChange={(e) => setForm((f) => ({ ...f, usedQty: e.target.value }))} placeholder="Cantidad utilizada*" className="h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
              <input value={form.supplier} onChange={(e) => setForm((f) => ({ ...f, supplier: e.target.value }))} placeholder="Proveedor (opcional)" className="col-span-2 h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
            </div>
            <div className="mt-3 flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button onClick={submit}>Guardar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function IngredientCard({ ingredient, onUpdate, onDelete }: { ingredient: any; onUpdate: (id: string, dto: any) => Promise<void>; onDelete: (id: string) => Promise<void> }) {
  const [purchasePrice, setPurchasePrice] = useState(String(ingredient.purchasePrice));
  const [usedQty, setUsedQty] = useState(String(ingredient.usedQty));
  const costoUtilizado = (Number(purchasePrice) / ingredient.purchaseQty) * Number(usedQty);

  return (
    <div className="group relative rounded-2xl border border-line/10 bg-surface p-4">
      <button
        onClick={() => { if (confirm(`¿Eliminar "${ingredient.name}"?`)) onDelete(ingredient.id); }}
        aria-label="Eliminar" className="absolute right-3 top-3 rounded-lg p-1.5 text-muted opacity-0 transition hover:bg-rose/15 hover:text-rose group-hover:opacity-100"
      ><Trash2 className="h-3.5 w-3.5" /></button>

      <div className="pr-6 text-[14px] font-bold">{ingredient.name}</div>
      <div className="mt-0.5 text-[11.5px] text-muted">Compraste {ingredient.purchaseQty} {ingredient.unit}{ingredient.supplier ? ` · ${ingredient.supplier}` : ''}</div>

      <div className="mt-3 grid grid-cols-2 gap-2.5">
        <div>
          <label className="mb-0.5 block text-[10.5px] font-semibold uppercase tracking-wide text-muted">Precio de compra</label>
          <input
            type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)}
            onBlur={() => Number(purchasePrice) !== ingredient.purchasePrice && onUpdate(ingredient.id, { purchasePrice: Number(purchasePrice) })}
            className="h-9 w-full rounded-[10px] border border-line/15 bg-surface-2/60 px-2.5 text-[13px] font-semibold"
          />
        </div>
        <div>
          <label className="mb-0.5 block text-[10.5px] font-semibold uppercase tracking-wide text-muted">Usás por lote</label>
          <input
            type="number" value={usedQty} onChange={(e) => setUsedQty(e.target.value)}
            onBlur={() => Number(usedQty) !== ingredient.usedQty && onUpdate(ingredient.id, { usedQty: Number(usedQty) })}
            className="h-9 w-full rounded-[10px] border border-line/15 bg-surface-2/60 px-2.5 text-[13px] font-semibold"
          />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between rounded-xl bg-primary/8 px-3 py-2">
        <span className="text-[11.5px] font-medium text-primary">Cuesta en el lote</span>
        <span className="font-display text-[16px] font-extrabold text-primary">{formatARS(costoUtilizado)}</span>
      </div>
    </div>
  );
}

// ------------------------------ Rentabilidad ------------------------------

type Period = 'hoy' | '7d' | '30d' | 'mes' | 'mes_ant' | 'custom';

function RentabilidadTab({ sales }: { sales: SupremaSale[] }) {
  const [period, setPeriod] = useState<Period>('mes');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const range = useMemo(() => {
    const now = new Date();
    const startOfDay = (d: Date) => { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; };
    if (period === 'custom') return { from: desde ? new Date(desde) : null, to: hasta ? new Date(hasta) : null };
    if (period === 'hoy') return { from: startOfDay(now), to: null };
    if (period === '7d') { const f = startOfDay(now); f.setDate(f.getDate() - 7); return { from: f, to: null }; }
    if (period === '30d') { const f = startOfDay(now); f.setDate(f.getDate() - 30); return { from: f, to: null }; }
    if (period === 'mes') return { from: new Date(now.getFullYear(), now.getMonth(), 1), to: null };
    // mes_ant
    return { from: new Date(now.getFullYear(), now.getMonth() - 1, 1), to: new Date(now.getFullYear(), now.getMonth(), 1) };
  }, [period, desde, hasta]);

  const filtered = useMemo(() => sales.filter((s) => {
    const f = new Date(s.fecha);
    if (range.from && f < range.from) return false;
    if (range.to && f >= range.to) return false;
    return true;
  }), [sales, range]);

  const m = useMemo(() => {
    const facturacion = filtered.reduce((a, s) => a + s.total, 0);
    const costo = filtered.reduce((a, s) => a + s.cost, 0);
    const ganancia = facturacion - costo;
    const kg = filtered.reduce((a, s) => a + s.kg, 0);
    return {
      facturacion, costo, ganancia,
      margen: facturacion > 0 ? (ganancia / facturacion) * 100 : 0,
      gananciaPorKg: kg > 0 ? ganancia / kg : 0,
      precioPromedio: kg > 0 ? facturacion / kg : 0,
      costoPromedio: kg > 0 ? costo / kg : 0,
    };
  }, [filtered]);

  const PERIODS: { key: Period; label: string; icon: typeof CalendarDays }[] = [
    { key: 'hoy', label: 'Hoy', icon: CalendarClock },
    { key: '7d', label: '7 días', icon: CalendarDays },
    { key: '30d', label: '30 días', icon: CalendarDays },
    { key: 'mes', label: 'Este mes', icon: CalendarRange },
    { key: 'mes_ant', label: 'Mes anterior', icon: History },
    { key: 'custom', label: 'Personalizado', icon: CalendarRange },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {PERIODS.map((p) => {
          const Icon = p.icon;
          const active = period === p.key;
          return (
            <button
              key={p.key} onClick={() => setPeriod(p.key)}
              className={`flex items-center gap-1.5 rounded-[10px] px-3 py-1.5 text-[13px] font-semibold transition ${active ? 'bg-primary text-white shadow-[0_4px_14px_-6px_rgb(var(--primary)/0.7)]' : 'border border-line/15 bg-surface text-muted hover:border-primary/25 hover:text-content'}`}
            >
              <Icon className="h-3.5 w-3.5" /> {p.label}
            </button>
          );
        })}
        {period === 'custom' && (
          <>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9 rounded-[10px] border border-line/15 bg-surface px-2.5 text-[13px]" />
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9 rounded-[10px] border border-line/15 bg-surface px-2.5 text-[13px]" />
          </>
        )}
      </div>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Facturación" value={formatARS(m.facturacion)} icon={Wallet} tone="emerald" />
        <StatCard label="Costo de mercadería" value={formatARS(m.costo)} icon={Factory} tone="amber" />
        <StatCard label="Ganancia bruta" value={formatARS(m.ganancia)} icon={TrendingUp} tone="primary" />
        <StatCard label="Margen" value={`${m.margen.toFixed(1)}%`} icon={TrendingUp} tone="sky" />
        <StatCard label="Ganancia por kg" value={formatARS(m.gananciaPorKg)} icon={TrendingUp} tone="primary" />
        <StatCard label="Precio prom. de venta" value={formatARS(m.precioPromedio)} icon={ShoppingCart} tone="sky" />
        <StatCard label="Costo prom. por kg" value={formatARS(m.costoPromedio)} icon={Factory} tone="amber" />
        <StatCard label="Ventas en el período" value={formatNumber(filtered.length)} icon={ShoppingCart} tone="sky" />
      </section>
    </div>
  );
}

// ------------------------------ Configuración ------------------------------

function ConfigTab({ settings, onSave }: { settings: SupremasSettings; onSave: (s: SupremasSettings) => void }) {
  const [form, setForm] = useState(settings);
  const [savedFlash, setSavedFlash] = useState(false);
  const set = <K extends keyof SupremasSettings>(k: K, v: SupremasSettings[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => {
    onSave(form);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1800);
  };

  return (
    <div className="max-w-3xl space-y-4">
      <section className="rounded-2xl border border-line/10 bg-surface p-5">
        <div className="mb-3 flex items-center gap-2 text-[13px] font-bold"><Wallet className="h-4 w-4 text-primary" /> Precios por tipo de cliente</div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {([
            ['priceConsumidorFinal', 'Consumidor final'],
            ['priceKiosco', 'Kiosco'],
            ['priceMayorista', 'Mayorista'],
          ] as const).map(([key, label]) => (
            <div key={key} className="rounded-xl bg-surface-2/60 p-3">
              <label className="mb-1 block text-[11px] font-semibold text-muted">{label} ($/kg)</label>
              <input type="number" value={form[key]} onChange={(e) => set(key, Number(e.target.value))} className="h-10 w-full rounded-[10px] border border-line/15 bg-surface px-3 text-[15px] font-bold" />
            </div>
          ))}
        </div>
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-primary/8 px-3 py-2.5 text-[12.5px] text-primary">
          <Sparkles className="h-4 w-4 shrink-0" /> Desde <b>{form.mayoristaMinKg} kg</b> el sistema sugiere precio mayorista solo.
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line/10 bg-surface p-5">
          <div className="mb-3 flex items-center gap-2 text-[13px] font-bold"><TrendingUp className="h-4 w-4 text-primary" /> Umbral y envase</div>
          <div className="space-y-3">
            <Field label="Kg mínimos para mayorista"><input type="number" value={form.mayoristaMinKg} onChange={(e) => set('mayoristaMinKg', Number(e.target.value))} className={INPUT_CLS} /></Field>
            <Field label="Costo de envase ($/kg)"><input type="number" value={form.envaseCostPerKg} onChange={(e) => set('envaseCostPerKg', Number(e.target.value))} className={INPUT_CLS} /></Field>
          </div>
        </div>
        <div className="rounded-2xl border border-line/10 bg-surface p-5">
          <div className="mb-3 flex items-center gap-2 text-[13px] font-bold"><Factory className="h-4 w-4 text-primary" /> Rendimiento del lote base</div>
          <div className="space-y-3">
            <Field label="Pechuga utilizada (kg)"><input type="number" value={form.pechugaBaseKg} onChange={(e) => set('pechugaBaseKg', Number(e.target.value))} className={INPUT_CLS} /></Field>
            <Field label="Producción obtenida (kg)"><input type="number" value={form.produccionBaseKg} onChange={(e) => set('produccionBaseKg', Number(e.target.value))} className={INPUT_CLS} /></Field>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-line/10 bg-surface p-5">
        <label className="flex items-center gap-2.5 text-[13px]">
          <input type="checkbox" checked={form.blockNegativeStock} onChange={(e) => set('blockNegativeStock', e.target.checked)} className="h-4 w-4" />
          Bloquear ventas que dejen el stock en negativo
        </label>
      </section>

      <div className="flex items-center gap-3">
        <Button onClick={submit}>Guardar cambios</Button>
        {savedFlash && <span className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald"><Check className="h-4 w-4" /> Guardado</span>}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="mb-1 block text-[11px] font-semibold text-muted">{label}</label>{children}</div>;
}

// ------------------------------ Nueva venta (modal) ------------------------------

function NewSaleModal({
  sales, settings, stock, isAdmin, onClose, onCreate,
}: {
  sales: SupremaSale[];
  settings: SupremasSettings;
  stock: { stockKg: number };
  isAdmin: boolean;
  onClose: () => void;
  onCreate: (dto: any) => Promise<any>;
}) {
  const clientOptions = useMemo(() => {
    const map = new Map<string, { id: string; name: string; phone: string; lastType: SupremaClientType }>();
    for (const s of sales) if (!map.has(s.clientId)) map.set(s.clientId, { id: s.clientId, name: s.clientName, phone: s.clientPhone, lastType: s.clientType });
    return [...map.values()];
  }, [sales]);

  const [q, setQ] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [creatingClient, setCreatingClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', address: '', email: '' });

  const [clientType, setClientType] = useState<SupremaClientType>('CONSUMIDOR_FINAL');
  const [typeTouched, setTypeTouched] = useState(false);
  const [kg, setKg] = useState('');
  const [priceOverride, setPriceOverride] = useState('');
  const [payment, setPayment] = useState<SupremaPaymentMethod>('EFECTIVO');
  const [obs, setObs] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const filteredClients = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return clientOptions.slice(0, 8);
    return clientOptions.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(query)).slice(0, 8);
  }, [clientOptions, q]);

  // Sugerencia: 15kg+ (configurable) sugiere precio mayorista, sin pisar una elección manual.
  const kgNum = Number(kg) || 0;
  const effectiveType = !typeTouched && kgNum >= settings.mayoristaMinKg ? 'MAYORISTA' : clientType;
  const autoPrice = priceForType(effectiveType, settings);
  const price = isAdmin && priceOverride !== '' ? Number(priceOverride) : autoPrice;
  const total = kgNum * price;

  const submit = async () => {
    setError('');
    if (!clientId && !(creatingClient && newClient.name.trim() && newClient.phone.trim())) return setError('Elegí o creá un cliente.');
    if (!(kgNum > 0)) return setError('Ingresá la cantidad de kg.');
    setBusy(true);
    try {
      await onCreate({
        clientId: clientId ?? undefined,
        newClient: !clientId ? { name: newClient.name.trim(), phone: newClient.phone.trim(), address: newClient.address.trim() || undefined, email: newClient.email.trim() || undefined } : undefined,
        clientType: effectiveType,
        kg: kgNum,
        pricePerKg: isAdmin && priceOverride !== '' ? Number(priceOverride) : undefined,
        paymentMethod: payment,
        observaciones: obs.trim() || undefined,
      });
      setDone(true);
      setTimeout(onClose, 1100);
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar la venta.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div className="max-h-[90vh] w-full max-w-[520px] overflow-y-auto rounded-2xl border border-line/10 bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between"><div className="font-bold">Nueva venta</div><button onClick={onClose}><X className="h-5 w-5" /></button></div>

        {done ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Check className="h-10 w-10 text-emerald" />
            <div className="font-semibold">Venta registrada</div>
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">Cliente</label>
              {clientId ? (
                <div className="flex items-center justify-between rounded-[10px] border border-primary/30 bg-primary/5 px-3 py-2 text-[13px]">
                  <span className="font-semibold">{clientOptions.find((c) => c.id === clientId)?.name}</span>
                  <button onClick={() => { setClientId(null); setTypeTouched(false); }} className="text-muted hover:text-content"><X className="h-4 w-4" /></button>
                </div>
              ) : creatingClient ? (
                <div className="space-y-1.5 rounded-[10px] border border-line/15 p-2.5">
                  <input value={newClient.name} onChange={(e) => setNewClient((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre y apellido / Razón social*" className="h-9 w-full rounded-[9px] border border-line/15 bg-surface px-2.5 text-[13px]" />
                  <input value={newClient.phone} onChange={(e) => setNewClient((f) => ({ ...f, phone: e.target.value }))} placeholder="Celular*" className="h-9 w-full rounded-[9px] border border-line/15 bg-surface px-2.5 text-[13px]" />
                  <input value={newClient.address} onChange={(e) => setNewClient((f) => ({ ...f, address: e.target.value }))} placeholder="Dirección" className="h-9 w-full rounded-[9px] border border-line/15 bg-surface px-2.5 text-[13px]" />
                  <input value={newClient.email} onChange={(e) => setNewClient((f) => ({ ...f, email: e.target.value }))} placeholder="Email (opcional)" className="h-9 w-full rounded-[9px] border border-line/15 bg-surface px-2.5 text-[13px]" />
                  <button onClick={() => setCreatingClient(false)} className="text-[12px] text-muted hover:text-content">← Buscar un cliente existente</button>
                </div>
              ) : (
                <div>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                    <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar cliente por nombre o teléfono..." className="h-9 w-full rounded-[10px] border border-line/15 bg-surface pl-9 pr-3 text-[13px]" />
                  </div>
                  <div className="mt-1.5 max-h-[160px] space-y-1 overflow-y-auto">
                    {filteredClients.map((c) => (
                      <button key={c.id} onClick={() => { setClientId(c.id); if (!typeTouched) setClientType(c.lastType); }} className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] hover:bg-surface-2">
                        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-sky text-[10px] font-bold text-white">{initials(c.name)}</span>
                        <span className="flex-1 truncate">{c.name}</span>
                        <span className="shrink-0 text-muted">{c.phone}</span>
                      </button>
                    ))}
                    {!filteredClients.length && <div className="px-2 py-2 text-[12.5px] text-muted">Sin clientes que coincidan.</div>}
                  </div>
                  <button onClick={() => setCreatingClient(true)} className="mt-1.5 flex items-center gap-1 text-[12.5px] font-semibold text-primary hover:underline"><Plus className="h-3.5 w-3.5" /> Crear nuevo cliente</button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label="Tipo de cliente">
                <select value={effectiveType} onChange={(e) => { setClientType(e.target.value as SupremaClientType); setTypeTouched(true); }} className={INPUT_CLS}>
                  {Object.entries(CLIENT_TYPE_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
              <Field label="Cantidad (kg)">
                <input type="number" value={kg} onChange={(e) => setKg(e.target.value)} className={INPUT_CLS} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <Field label={isAdmin ? 'Precio/kg (autocompletado, editable)' : 'Precio/kg'}>
                {isAdmin ? (
                  <input type="number" value={priceOverride} onChange={(e) => setPriceOverride(e.target.value)} placeholder={String(autoPrice)} className={INPUT_CLS} />
                ) : (
                  <div className={`${INPUT_CLS} flex items-center bg-surface-2 text-muted`}>{formatARS(autoPrice)}</div>
                )}
              </Field>
              <Field label="Forma de pago">
                <select value={payment} onChange={(e) => setPayment(e.target.value as SupremaPaymentMethod)} className={INPUT_CLS}>
                  {Object.entries(PAYMENT_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </Field>
            </div>

            {kgNum > stock.stockKg && (
              <div className="flex items-center gap-2 rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-[12.5px] text-amber">
                <AlertTriangle className="h-4 w-4 shrink-0" /> Estás vendiendo más de lo que hay en stock ({fmtKg(stock.stockKg)} disponibles).
              </div>
            )}

            <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observaciones" rows={2} className="w-full rounded-[10px] border border-line/15 bg-surface p-2.5 text-[13px]" />

            <div className="rounded-xl bg-primary/10 p-3 text-center">
              <div className="text-[11px] text-primary">Facturación estimada</div>
              <div className="font-display text-2xl font-extrabold text-primary">{formatARS(total)}</div>
            </div>

            {error && <div className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-[12.5px] text-rose">{error}</div>}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>Cancelar</Button>
              <Button onClick={submit} disabled={busy}>{busy ? 'Guardando…' : 'Confirmar venta'}</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
