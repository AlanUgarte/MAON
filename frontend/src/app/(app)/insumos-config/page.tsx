'use client';

import { useState } from 'react';
import {
  ClipboardList, Package, Settings, ExternalLink, Check, Truck,
  Trash2, Upload,
} from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { uploadImage } from '@/lib/api';
import { useInsumosOrders, type InsumosOrder, type InsumosOrderStatus } from '@/lib/insumos-orders-store';
import { useInsumosProducts } from '@/lib/insumos-products-store';
import { useInsumosSettings, type InsumosSettings } from '@/lib/insumos-settings-store';

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
const fmtDate = (d: string) => new Date(d).toLocaleString('es-AR');

const STATUS_LABEL: Record<InsumosOrderStatus, string> = {
  NUEVO: 'Nuevo', PAGO_PENDIENTE: 'Pago pendiente', COMPROBANTE_RECIBIDO: 'Comprobante recibido',
  PAGO_VERIFICADO: 'Pago verificado', LISTO_PARA_DESPACHAR: 'Listo para despachar',
  DESPACHADO: 'Despachado', EN_TRANSITO: 'En tránsito', ENTREGADO: 'Entregado', CANCELADO: 'Cancelado',
};
const STATUS_TONE: Record<InsumosOrderStatus, 'primary' | 'emerald' | 'amber' | 'rose' | 'sky'> = {
  NUEVO: 'sky', PAGO_PENDIENTE: 'amber', COMPROBANTE_RECIBIDO: 'amber', PAGO_VERIFICADO: 'emerald',
  LISTO_PARA_DESPACHAR: 'emerald', DESPACHADO: 'primary', EN_TRANSITO: 'primary', ENTREGADO: 'emerald', CANCELADO: 'rose',
};
const FILTERS: { key: string; label: string }[] = [
  { key: '', label: 'Todos' },
  { key: 'PAGO_PENDIENTE', label: 'Pendientes de pago' },
  { key: 'COMPROBANTE_RECIBIDO', label: 'Comprobante recibido' },
  { key: 'PAGO_VERIFICADO', label: 'Pagados' },
  { key: 'LISTO_PARA_DESPACHAR', label: 'Listos para despachar' },
  { key: 'DESPACHADO', label: 'Despachados' },
  { key: 'ENTREGADO', label: 'Entregados' },
];

const TABS = [
  { key: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { key: 'producto', label: 'Producto', icon: Package },
  { key: 'config', label: 'Configuración', icon: Settings },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export default function InsumosConfigPage() {
  const [tab, setTab] = useState<TabKey>('pedidos');
  const orders = useInsumosOrders();
  const products = useInsumosProducts();
  const insumosSettings = useInsumosSettings();

  return (
    <>
      <Topbar title="Insumos Carnicería" subtitle="Tienda e-commerce — pedidos, producto y configuración" />
      <main className="flex-1 space-y-5 p-5 lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap rounded-[10px] border border-line/15 bg-surface-2 p-0.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${tab === t.key ? 'bg-primary text-white' : 'text-muted hover:text-content'}`}
                ><Icon className="h-3.5 w-3.5" /> {t.label}</button>
              );
            })}
          </div>
          <a href="/insumos" target="_blank" rel="noopener noreferrer" className="flex h-9 items-center gap-1.5 rounded-[10px] border border-line/15 px-3 text-[13px] font-semibold text-muted hover:bg-surface-2 hover:text-content">
            <ExternalLink className="h-3.5 w-3.5" /> Ver tienda
          </a>
        </div>

        {tab === 'pedidos' && <PedidosTab orders={orders} />}
        {tab === 'producto' && <ProductoTab products={products} />}
        {tab === 'config' && <ConfigTab settings={insumosSettings.settings} onSave={insumosSettings.save} />}
      </main>
    </>
  );
}

// ------------------------------ Pedidos ------------------------------

function PedidosTab({ orders }: { orders: ReturnType<typeof useInsumosOrders> }) {
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<string | null>(null);
  const filtered = filter ? orders.orders.filter((o) => o.status === filter) : orders.orders;
  const detail = selected ? orders.orders.find((o) => o.id === selected) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.key} onClick={() => setFilter(f.key)}
            className={`rounded-[10px] px-3 py-1.5 text-[12.5px] font-semibold transition ${filter === f.key ? 'bg-primary text-white' : 'border border-line/15 text-muted hover:text-content'}`}
          >{f.label}</button>
        ))}
      </div>

      {orders.error && <div className="rounded-xl border border-rose/30 bg-rose/10 p-3 text-[13px] text-rose">{orders.error}</div>}

      <div className="overflow-x-auto rounded-2xl border border-line/10 bg-surface">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line/10 text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="p-3">Pedido</th><th className="p-3">Cliente</th><th className="p-3">Fecha</th>
              <th className="p-3">Total</th><th className="p-3">Estado</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id} className="cursor-pointer border-b border-line/10 hover:bg-surface-2" onClick={() => setSelected(o.id)}>
                <td className="p-3 font-semibold">{o.orderNumber}</td>
                <td className="p-3">{o.clientName}</td>
                <td className="p-3 text-muted">{fmtDate(o.createdAt)}</td>
                <td className="p-3 font-bold">{money(o.total)}</td>
                <td className="p-3"><Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge></td>
                <td className="p-3 text-right text-muted">Ver →</td>
              </tr>
            ))}
            {!orders.loading && !filtered.length && (
              <tr><td colSpan={6} className="p-10 text-center text-muted">Sin pedidos para este filtro.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {detail && <OrderDetailModal order={detail} onClose={() => setSelected(null)} onApprove={orders.approve} onSetStatus={orders.setStatus} />}
    </div>
  );
}

function OrderDetailModal({ order, onClose, onApprove, onSetStatus }: {
  order: InsumosOrder;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onSetStatus: (id: string, status: InsumosOrderStatus, extra?: { trackingNumber?: string; carrier?: string }) => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [tracking, setTracking] = useState(order.trackingNumber ?? '');
  const [carrier, setCarrier] = useState(order.carrier ?? '');

  const canApprove = order.status === 'COMPROBANTE_RECIBIDO' || order.status === 'PAGO_PENDIENTE';
  const run = async (fn: () => Promise<void>) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={onClose}>
      <div className="flex max-h-[88vh] w-full max-w-[560px] flex-col rounded-2xl border border-line/10 bg-surface p-5" onClick={(e) => e.stopPropagation()}>
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="font-bold">{order.orderNumber}</div>
            <Badge tone={STATUS_TONE[order.status]}>{STATUS_LABEL[order.status]}</Badge>
          </div>
          <button onClick={onClose} className="text-muted hover:text-content">✕</button>
        </div>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto text-[13px]">
          <div className="rounded-xl bg-surface-2/60 p-3">
            <div className="font-semibold">{order.clientName}</div>
            <div className="text-muted">{order.clientPhone} · {order.clientEmail}</div>
            {order.docNumber && <div className="text-muted">DNI/CUIT: {order.docNumber}</div>}
          </div>

          <div className="rounded-xl bg-surface-2/60 p-3">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">Envío</div>
            <div>{order.street} {order.streetNumber}{order.floorApt ? `, ${order.floorApt}` : ''}</div>
            <div>{order.city}, {order.province} ({order.postalCode})</div>
            {order.shippingNotes && <div className="mt-1 text-muted">{order.shippingNotes}</div>}
          </div>

          <div className="space-y-1">
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between"><span>{it.quantity}× {it.productName}{it.size ? ` — medida ${it.size}m` : ''}</span><span className="font-semibold">{money(it.subtotal)}</span></div>
            ))}
            <div className="flex justify-between border-t border-line/10 pt-1 text-muted"><span>Envío</span><span>{money(order.shippingCost)}</span></div>
            <div className="flex justify-between border-t border-line/10 pt-1 font-bold"><span>Total</span><span>{money(order.total)}</span></div>
          </div>

          {order.paymentProof ? (
            <div className="rounded-xl border border-line/10 p-3">
              <div className="mb-1 text-[11px] font-bold uppercase tracking-wide text-muted">Comprobante</div>
              {order.paymentProof.imageUrl ? (
                <a href={order.paymentProof.imageUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver archivo →</a>
              ) : (
                <div className="text-muted">Sin archivo adjunto — el cliente informó el pago solo con su nombre.</div>
              )}
              <div className="mt-1 text-muted">Titular: {order.paymentProof.holderName}</div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-line/15 p-3 text-center text-muted">Todavía no subió comprobante.</div>
          )}

          {order.approvedByName && <div className="text-muted">Aprobado por {order.approvedByName} el {order.approvedAt && fmtDate(order.approvedAt)}</div>}

          <div className="space-y-2 border-t border-line/10 pt-3">
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted">Tracking</div>
            <div className="grid grid-cols-2 gap-2">
              <input value={carrier} onChange={(e) => setCarrier(e.target.value)} placeholder="Transportista (ej. Andreani)" className="h-9 rounded-[10px] border border-line/15 bg-surface px-2.5 text-[13px]" />
              <input value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="N° de seguimiento" className="h-9 rounded-[10px] border border-line/15 bg-surface px-2.5 text-[13px]" />
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-line/10 pt-3">
          {canApprove && (
            <Button size="sm" disabled={busy} onClick={() => run(() => onApprove(order.id))}><Check className="h-3.5 w-3.5" /> Aprobar pago</Button>
          )}
          {order.status === 'PAGO_VERIFICADO' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => onSetStatus(order.id, 'LISTO_PARA_DESPACHAR'))}>Listo para despachar</Button>
          )}
          {order.status === 'LISTO_PARA_DESPACHAR' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => onSetStatus(order.id, 'DESPACHADO', { trackingNumber: tracking || undefined, carrier: carrier || undefined }))}>
              <Truck className="h-3.5 w-3.5" /> Marcar despachado
            </Button>
          )}
          {order.status === 'DESPACHADO' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => onSetStatus(order.id, 'EN_TRANSITO', { trackingNumber: tracking || undefined, carrier: carrier || undefined }))}>En tránsito</Button>
          )}
          {order.status === 'EN_TRANSITO' && (
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => onSetStatus(order.id, 'ENTREGADO'))}>Marcar entregado</Button>
          )}
          {order.status !== 'CANCELADO' && order.status !== 'ENTREGADO' && (
            <Button size="sm" variant="danger" disabled={busy} onClick={() => { if (confirm('¿Cancelar este pedido?')) run(() => onSetStatus(order.id, 'CANCELADO')); }}>Cancelar</Button>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------ Producto ------------------------------

function ProductoTab({ products }: { products: ReturnType<typeof useInsumosProducts> }) {
  const product = products.products[0];
  const [form, setForm] = useState<{ name: string; price: string; compareAtPrice: string; stock: string; description: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const current = form ?? (product ? { name: product.name, price: String(product.price), compareAtPrice: product.compareAtPrice ? String(product.compareAtPrice) : '', stock: String(product.stock), description: product.description ?? '' } : null);

  if (products.loading) return <div className="p-10 text-center text-muted">Cargando…</div>;
  if (!product || !current) return <div className="rounded-2xl border border-dashed border-line/15 p-10 text-center text-muted">Todavía no hay un producto cargado en la base.</div>;

  const set = (k: keyof typeof current) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...current, [k]: e.target.value });

  const save = async () => {
    await products.update(product.id, {
      name: current.name, price: Number(current.price) || 0, compareAtPrice: current.compareAtPrice ? Number(current.compareAtPrice) : undefined,
      stock: Number(current.stock) || 0, description: current.description,
    } as any);
    setForm(null);
  };

  const addImage = async (file: File) => {
    setUploading(true);
    try {
      const url = await uploadImage(file);
      await products.update(product.id, { images: [...product.images, url] } as any);
    } finally { setUploading(false); }
  };
  const removeImage = async (url: string) => {
    await products.update(product.id, { images: product.images.filter((i) => i !== url) } as any);
  };

  return (
    <div className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
      <Card>
        <CardHeader><CardTitle>Datos del producto</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted">Nombre</label>
            <input value={current.name} onChange={set('name')} className="h-10 w-full rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">Precio</label>
              <input type="number" value={current.price} onChange={set('price')} className="h-10 w-full rounded-[10px] border border-line/15 bg-surface px-3 text-[13px] font-bold" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">Precio tachado</label>
              <input type="number" value={current.compareAtPrice} onChange={set('compareAtPrice')} placeholder="Opcional" className="h-10 w-full rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-muted">Stock</label>
              <input type="number" value={current.stock} onChange={set('stock')} className="h-10 w-full rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
            </div>
          </div>
          {Number(current.price) === 0 && (
            <div className="rounded-lg border border-amber/30 bg-amber/10 px-3 py-2 text-[12.5px] text-amber">Sin precio cargado — la tienda no deja comprar hasta que pongas un precio real acá.</div>
          )}
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted">Descripción</label>
            <textarea value={current.description} onChange={set('description')} rows={4} className="w-full rounded-[10px] border border-line/15 bg-surface p-3 text-[13px]" />
          </div>
          <Button onClick={save}>Guardar cambios</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Imágenes</CardTitle></CardHeader>
        <CardContent className="space-y-3 pt-0">
          <div className="grid grid-cols-2 gap-2.5">
            {product.images.map((url) => (
              <div key={url} className="group relative aspect-square overflow-hidden rounded-xl border border-line/10">
                <img src={url} alt="" className="h-full w-full object-cover" />
                <button onClick={() => removeImage(url)} className="absolute right-1.5 top-1.5 rounded-lg bg-black/60 p-1.5 text-white opacity-0 transition group-hover:opacity-100"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            ))}
            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-line/20 text-muted hover:border-primary/40 hover:text-primary">
              {uploading ? <span className="text-[11px]">Subiendo…</span> : <><Upload className="h-5 w-5" /><span className="text-[11px] font-semibold">Agregar foto</span></>}
              <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => { const f = e.target.files?.[0]; if (f) addImage(f); e.target.value = ''; }} />
            </label>
          </div>
          {!product.images.length && <p className="text-[12px] text-muted">Sin fotos todavía — subí al menos la principal para que se vea en la tienda.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

// ------------------------------ Configuración ------------------------------

function ConfigTab({ settings, onSave }: { settings: InsumosSettings; onSave: (s: InsumosSettings) => void }) {
  const [form, setForm] = useState(settings);
  const [saved, setSaved] = useState(false);
  const set = <K extends keyof InsumosSettings>(k: K, v: InsumosSettings[K]) => setForm((f) => ({ ...f, [k]: v }));

  const submit = () => { onSave(form); setSaved(true); setTimeout(() => setSaved(false), 1800); };

  return (
    <div className="max-w-2xl space-y-4">
      <div className="rounded-2xl border border-line/10 bg-surface p-5">
        <div className="mb-3 text-[13px] font-bold">Envío y pago</div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted">Costo de envío fijo ($)</label>
            <input type="number" value={form.shippingFlatCost} onChange={(e) => set('shippingFlatCost', Number(e.target.value))} className="h-10 w-full rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
          </div>
          <div>
            <label className="mb-1 block text-[11px] font-semibold text-muted">Alias de transferencia</label>
            <input value={form.paymentAlias} onChange={(e) => set('paymentAlias', e.target.value)} className="h-10 w-full rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
          </div>
        </div>
        <div className="mt-3 rounded-lg bg-primary/8 px-3 py-2 text-[12px] text-primary">
          Este es un costo de envío fijo, provisorio — todavía no está conectado Andreani. Apenas tengas las credenciales avisame para reemplazarlo por la cotización real.
        </div>
      </div>

      <div className="rounded-2xl border border-line/10 bg-surface p-5">
        <div className="mb-3 text-[13px] font-bold">Textos del footer</div>
        <div className="space-y-3">
          {([
            ['aboutText', 'Sobre nosotros'],
            ['privacyPolicy', 'Política de privacidad'],
            ['termsAndConditions', 'Términos y condiciones'],
            ['returnsPolicy', 'Cambios y devoluciones'],
          ] as const).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-[11px] font-semibold text-muted">{label}</label>
              <textarea value={form[key]} onChange={(e) => set(key, e.target.value)} rows={3} className="w-full rounded-[10px] border border-line/15 bg-surface p-3 text-[13px]" />
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button onClick={submit}>Guardar cambios</Button>
        {saved && <span className="flex items-center gap-1.5 text-[13px] font-semibold text-emerald"><Check className="h-4 w-4" /> Guardado</span>}
      </div>
    </div>
  );
}
