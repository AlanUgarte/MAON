'use client';

// Config de la landing de la estufa (segunda tienda de prueba) — mismo patrón que
// tienda-config: General (precio/banner/WhatsApp), Banners (carrusel de imágenes real) y
// Pedidos (pedidos reales de esta landing, filtrados por su propio sku). No tiene pestaña
// de "Productos" porque acá no hay catálogo — es un solo producto.
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, Save, Check, ExternalLink, Image as ImageIcon, ClipboardList, Clock, ReceiptText, Download } from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BannerManager } from '@/components/app/banner-manager';
import { InvoiceChoiceModal } from '@/components/app/invoice-choice-modal';
import { useEstufaSettings, sellPrice, type EstufaSettings } from '@/lib/estufa-settings-store';
import { useTiendaOrders, type TiendaOrder } from '@/lib/tienda-orders-store';
import { useComprobantesStore } from '@/lib/comprobantes-store';
import { printComprobante } from '@/lib/print-comprobante';

// Mismo sku fijo que usa el backend (EstufaSettingsService) para el único producto de esta landing.
const ESTUFA_SKU = 'ESTUFA-CS01';

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

const inputClass = 'h-10 w-full rounded-xl border border-line/15 bg-surface-2/60 px-3 text-sm text-content focus:border-primary/50 focus:outline-none';
const labelClass = 'mb-1.5 block text-xs font-medium text-muted';

const TABS = [
  { key: 'general', label: 'General', icon: Store },
  { key: 'banners', label: 'Banners', icon: ImageIcon },
  { key: 'pedidos', label: 'Pedidos', icon: ClipboardList },
] as const;

export default function EstufaConfigPage() {
  const router = useRouter();
  const { settings, save, status } = useEstufaSettings();
  const [form, setForm] = useState<EstufaSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('general');
  const { orders: allOrders, status: ordersStatus } = useTiendaOrders();
  const { comprobantes } = useComprobantesStore();
  const [invoicingOrder, setInvoicingOrder] = useState<TiendaOrder | null>(null);

  useEffect(() => setForm(settings), [settings]);

  // Esta landing solo vende un producto — filtramos los pedidos reales de /sales a los
  // que tengan ese sku, para no mezclar acá los pedidos de la tienda mayorista grande.
  const orders = useMemo(() => allOrders.filter((o) => o.items.some((it) => it.sku === ESTUFA_SKU)), [allOrders]);
  const pendingOrders = useMemo(() => orders.filter((o) => !o.invoiced), [orders]);
  const invoicedOrders = useMemo(() => orders.filter((o) => o.invoiced), [orders]);

  const downloadInvoice = (o: TiendaOrder) => {
    const entry = comprobantes.find((c) => c.numero === o.comprobanteNumero);
    if (entry) printComprobante(entry);
  };

  const set = <K extends keyof EstufaSettings>(key: K, value: EstufaSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    save(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const flashSaved = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Topbar title="Estufa (test)" subtitle="Configurá el precio, el banner y los pedidos de la landing de la estufa" />
      <main className="flex-1 space-y-5 p-5 lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-1.5 rounded-xl bg-surface-2/60 p-1">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${tab === t.key ? 'bg-primary text-white' : 'text-muted hover:text-content'}`}
              >
                <t.icon className="h-3.5 w-3.5" /> {t.label}
                {t.key === 'pedidos' && pendingOrders.length > 0 && (
                  <span className={`rounded-full px-1.5 text-[10px] font-bold ${tab === t.key ? 'bg-white/25 text-white' : 'bg-amber/20 text-amber'}`}>{pendingOrders.length}</span>
                )}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={form.storeOpen ? 'emerald' : 'rose'} dot>{form.storeOpen ? 'Tienda abierta' : 'Tienda cerrada'}</Badge>
            <a href="/estufa" target="_blank" rel="noreferrer">
              <Button variant="outline"><ExternalLink className="h-4 w-4" /> Ver landing</Button>
            </a>
          </div>
        </div>

        {status === 'error' && (
          <div className="rounded-xl border border-rose/30 bg-rose/8 px-4 py-2.5 text-[12.5px] font-medium text-rose">
            No se pudo conectar al servidor — se muestra la última config guardada en este navegador.
          </div>
        )}

        {tab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> Configuración de la estufa</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-line/15 bg-surface-2/40 p-3.5">
                <div>
                  <div className="text-sm font-semibold text-content">Landing habilitada</div>
                  <div className="text-xs text-muted">Si la apagás, la landing muestra un aviso de "cerrado" en vez del producto.</div>
                </div>
                <button
                  onClick={() => set('storeOpen', !form.storeOpen)}
                  className={`relative h-6 w-11 rounded-full transition ${form.storeOpen ? 'bg-emerald' : 'bg-line/30'}`}
                >
                  <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.storeOpen ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <div>
                <label className={labelClass}>Texto del banner superior</label>
                <input className={inputClass} value={form.topBannerText} onChange={(e) => set('topBannerText', e.target.value)} />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClass}>Precio de costo ($)</label>
                  <input type="number" className={inputClass} value={form.cost} onChange={(e) => set('cost', Number(e.target.value) || 0)} />
                </div>
                <div>
                  <label className={labelClass}>Margen de venta (%)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={Math.round(form.marginPct * 10000) / 100}
                    onChange={(e) => set('marginPct', Number(e.target.value) / 100)}
                  />
                  <div className="mt-1 text-[11px] text-muted">Precio de venta: <b className="text-content">{money(sellPrice(form))}</b></div>
                </div>
                <div>
                  <label className={labelClass}>WhatsApp del negocio (sin +, ej: 5493411234567)</label>
                  <input className={inputClass} value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} />
                </div>
              </div>

              <div>
                <label className={labelClass}>Insignia del banner principal</label>
                <input className={inputClass} value={form.heroBadge} onChange={(e) => set('heroBadge', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Título</label>
                <input className={inputClass} value={form.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Subtítulo</label>
                <input className={inputClass} value={form.heroSubtitle} onChange={(e) => set('heroSubtitle', e.target.value)} />
              </div>

              <Button onClick={handleSave} className="w-full sm:w-auto">
                {saved ? <><Check className="h-4 w-4" /> Guardado</> : <><Save className="h-4 w-4" /> Guardar cambios</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {tab === 'banners' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /> Carrusel del hero</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-[12.5px] text-muted">
                Si agregás algún banner activo acá, reemplaza a la foto fija de la estufa en el hero de la landing.
              </p>
              <BannerManager
                items={form.heroCarousel}
                noun="Banner"
                onChange={(next) => { const updated = { ...form, heroCarousel: next }; setForm(updated); save(updated); flashSaved(); }}
              />
            </CardContent>
          </Card>
        )}

        {tab === 'pedidos' && (
          <div className="space-y-5">
            {ordersStatus === 'error' && (
              <div className="rounded-xl border border-rose/30 bg-rose/8 px-4 py-2.5 text-[12.5px] font-medium text-rose">
                No se pudieron cargar los pedidos reales del servidor. Esta lista puede estar incompleta — probá recargar la página antes de dar algo por facturado o no.
              </div>
            )}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4 text-amber" /> Pendientes de facturar</CardTitle>
                <span className="text-xs text-muted">{pendingOrders.length} pedido{pendingOrders.length === 1 ? '' : 's'}</span>
              </CardHeader>
              <CardContent>
                {pendingOrders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line/15 p-6 text-center text-[13px] text-muted">
                    No hay pedidos pendientes de facturar.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingOrders.map((o) => (
                      <div key={o.id} className="rounded-xl border border-line/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-content">{o.customerName}</div>
                            <div className="text-[11px] text-muted">{o.customerPhone} · {new Date(o.createdAt).toLocaleString('es-AR')}</div>
                          </div>
                          <span className="font-display text-lg font-extrabold tnum text-content">{money(o.subtotal)}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {o.clientId && (
                            <a href={`/bandeja?clientId=${o.clientId}`} className="text-[12px] font-semibold text-primary hover:underline">
                              Ver conversación en Bandeja →
                            </a>
                          )}
                          <Button size="sm" variant="soft" onClick={() => setInvoicingOrder(o)}>
                            <ReceiptText className="h-3.5 w-3.5" /> Facturar
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ClipboardList className="h-4 w-4 text-emerald" /> Facturados</CardTitle>
                <span className="text-xs text-muted">{invoicedOrders.length} pedido{invoicedOrders.length === 1 ? '' : 's'}</span>
              </CardHeader>
              <CardContent>
                {invoicedOrders.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line/15 p-6 text-center text-[13px] text-muted">
                    Todavía no facturaste ningún pedido de la estufa.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {invoicedOrders.map((o) => (
                      <div key={o.id} className="rounded-xl border border-line/10 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <div className="font-semibold text-content">{o.customerName}</div>
                            <div className="text-[11px] text-muted">{o.customerPhone} · {new Date(o.createdAt).toLocaleString('es-AR')}</div>
                          </div>
                          <span className="font-display text-lg font-extrabold tnum text-content">{money(o.subtotal)}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {o.clientId && (
                            <a href={`/bandeja?clientId=${o.clientId}`} className="text-[12px] font-semibold text-primary hover:underline">
                              Ver conversación en Bandeja →
                            </a>
                          )}
                          <Badge tone="emerald">Facturado · {o.comprobanteNumero}</Badge>
                          <Button size="sm" variant="outline" onClick={() => downloadInvoice(o)}>
                            <Download className="h-3.5 w-3.5" /> Descargar factura
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {invoicingOrder && (
        <InvoiceChoiceModal
          onClose={() => setInvoicingOrder(null)}
          onChoose={(tipo, letra) => router.push(`/facturacion?clientId=${invoicingOrder.clientId}&autoOrderId=${invoicingOrder.id}&autoTipo=${tipo}&autoLetra=${letra}`)}
        />
      )}
    </>
  );
}
