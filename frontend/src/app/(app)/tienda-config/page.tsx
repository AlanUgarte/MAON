'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Store, ExternalLink, Save, Check, Image as ImageIcon, Package, ClipboardList, Eye, EyeOff, Search, ReceiptText, Download, Clock } from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { InvoiceChoiceModal } from '@/components/app/invoice-choice-modal';
import { useProductCatalog } from '@/lib/product-catalog-store';
import { useTiendaSettings, type TiendaSettings } from '@/lib/tienda-settings-store';
import { useTiendaOrders, type TiendaOrder } from '@/lib/tienda-orders-store';
import { useComprobantesStore } from '@/lib/comprobantes-store';
import { printComprobante } from '@/lib/print-comprobante';
import { getUser } from '@/lib/api';

const inputClass = 'h-10 w-full rounded-xl border border-line/15 bg-surface-2/60 px-3 text-sm text-content focus:border-primary/50 focus:outline-none';
const labelClass = 'mb-1.5 block text-xs font-medium text-muted';
const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

const TABS = [
  { key: 'general', label: 'General', icon: Store },
  { key: 'contenido', label: 'Contenido', icon: ImageIcon },
  { key: 'productos', label: 'Productos', icon: Package },
  { key: 'pedidos', label: 'Pedidos', icon: ClipboardList },
] as const;

const RENDER_CAP = 150;

export default function TiendaConfigPage() {
  const router = useRouter();
  const user = getUser();
  const isVendedor = user?.role === 'VENDEDOR';
  const { settings, save } = useTiendaSettings();
  const { orders: allOrders } = useTiendaOrders();
  // Un vendedor solo ve sus propios pedidos de tienda (a quién le vendió, quién le debe, etc.).
  const orders = isVendedor ? allOrders.filter((o) => o.seller === user!.fullName) : allOrders;
  const { comprobantes } = useComprobantesStore();
  const { products: PRODUCT_ROWS } = useProductCatalog();
  const [form, setForm] = useState<TiendaSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>(isVendedor ? 'pedidos' : 'general');
  const [q, setQ] = useState('');
  const [invoicingOrder, setInvoicingOrder] = useState<TiendaOrder | null>(null);
  const visibleTabs = isVendedor ? TABS.filter((t) => t.key === 'pedidos') : TABS;

  useEffect(() => setForm(settings), [settings]);

  const set = <K extends keyof TiendaSettings>(key: K, value: TiendaSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    save(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleProduct = (id: string) => {
    const next = form.hiddenProductIds.includes(id)
      ? form.hiddenProductIds.filter((x) => x !== id)
      : [...form.hiddenProductIds, id];
    const updated = { ...form, hiddenProductIds: next };
    setForm(updated);
    save(updated);
  };

  const setPromo = (id: string, patch: Partial<TiendaSettings['productPromos'][string]>) => {
    const current = form.productPromos[id] ?? {};
    const merged = { ...current, ...patch };
    const isEmpty = !merged.label && !merged.discountPct && !merged.isNew;
    const nextPromos = { ...form.productPromos };
    if (isEmpty) delete nextPromos[id]; else nextPromos[id] = merged;
    const updated = { ...form, productPromos: nextPromos };
    setForm(updated);
    save(updated);
  };

  const filteredProducts = useMemo(() => {
    const query = q.trim().toLowerCase();
    if (!query) return PRODUCT_ROWS.slice(0, RENDER_CAP);
    return PRODUCT_ROWS.filter((p) => p.name.toLowerCase().includes(query) || p.brand.toLowerCase().includes(query));
  }, [q, PRODUCT_ROWS]);

  const visibleCount = PRODUCT_ROWS.length - form.hiddenProductIds.length;

  const pendingOrders = useMemo(() => orders.filter((o) => !o.invoiced), [orders]);
  const invoicedOrders = useMemo(() => orders.filter((o) => o.invoiced), [orders]);

  const downloadInvoice = (o: TiendaOrder) => {
    const entry = comprobantes.find((c) => c.numero === o.comprobanteNumero);
    if (entry) printComprobante(entry);
  };

  return (
    <>
      <Topbar
        title={isVendedor ? 'Mis pedidos' : 'Tienda online'}
        subtitle={isVendedor ? 'Tus pedidos de la tienda: quién te debe y quién ya facturaste' : 'Configurá el banner, el contenido, los productos y revisá los pedidos de la tienda pública'}
      />
      <main className="flex-1 space-y-5 p-5 lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex rounded-[10px] border border-line/15 bg-surface-2 p-0.5">
            {visibleTabs.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${tab === t.key ? 'bg-primary text-white' : 'text-muted hover:text-content'}`}
                >
                  <Icon className="h-3.5 w-3.5" /> {t.label}
                  {t.key === 'pedidos' && pendingOrders.length > 0 && (
                    <span className={`rounded-full px-1.5 text-[10px] font-bold ${tab === t.key ? 'bg-white/25 text-white' : 'bg-amber/20 text-amber'}`}>{pendingOrders.length}</span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2">
            <Badge tone={settings.storeOpen ? 'emerald' : 'rose'} dot>{settings.storeOpen ? 'Tienda abierta' : 'Tienda cerrada'}</Badge>
            <a href="/tienda" target="_blank" rel="noreferrer">
              <Button variant="outline"><ExternalLink className="h-4 w-4" /> Ver tienda</Button>
            </a>
          </div>
        </div>

        {tab === 'general' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> Configuración general</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-line/15 bg-surface-2/40 p-3.5">
                <div>
                  <div className="text-sm font-semibold text-content">Tienda habilitada</div>
                  <div className="text-xs text-muted">Si la apagás, los clientes ven un aviso y el botón de WhatsApp en vez del catálogo.</div>
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

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Compra mínima ($)</label>
                  <input type="number" className={inputClass} value={form.minCompra} onChange={(e) => set('minCompra', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>Envío gratis desde ($)</label>
                  <input type="number" className={inputClass} value={form.envioGratisDesde} onChange={(e) => set('envioGratisDesde', Number(e.target.value))} />
                </div>
                <div>
                  <label className={labelClass}>WhatsApp del negocio (sin +, ej: 5493411234567)</label>
                  <input className={inputClass} value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} />
                </div>
                <div>
                  <label className={labelClass}>Margen de venta (%)</label>
                  <input
                    type="number"
                    className={inputClass}
                    value={Math.round(form.margenVenta * 100)}
                    onChange={(e) => set('margenVenta', Number(e.target.value) / 100)}
                  />
                </div>
              </div>

              <Button onClick={handleSave} className="w-full sm:w-auto">
                {saved ? <><Check className="h-4 w-4" /> Guardado</> : <><Save className="h-4 w-4" /> Guardar cambios</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {tab === 'contenido' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /> Contenido del banner principal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className={labelClass}>Etiqueta destacada</label>
                <input className={inputClass} value={form.heroBadge} onChange={(e) => set('heroBadge', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Título principal</label>
                <input className={inputClass} value={form.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Subtítulo</label>
                <textarea rows={2} className={`${inputClass} h-auto py-2`} value={form.heroSubtitle} onChange={(e) => set('heroSubtitle', e.target.value)} />
              </div>
              <Button onClick={handleSave} className="w-full sm:w-auto">
                {saved ? <><Check className="h-4 w-4" /> Guardado</> : <><Save className="h-4 w-4" /> Guardar cambios</>}
              </Button>
            </CardContent>
          </Card>
        )}

        {tab === 'productos' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Package className="h-4 w-4 text-primary" /> Productos en la tienda</CardTitle>
              <span className="text-xs text-muted">{visibleCount} de {PRODUCT_ROWS.length} visibles</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto o marca..." className="h-10 w-full rounded-xl border border-line/15 bg-surface-2/60 pl-9 pr-3 text-sm focus:border-primary/50 focus:outline-none" />
              </div>
              {!q && PRODUCT_ROWS.length > RENDER_CAP && (
                <div className="rounded-lg border border-dashed border-line/15 p-2.5 text-center text-[12px] text-muted">
                  Mostrando {RENDER_CAP} de {PRODUCT_ROWS.length} — usá el buscador para encontrar otros.
                </div>
              )}
              <div className="max-h-[520px] overflow-y-auto rounded-xl border border-line/10">
                <table className="w-full text-[13px]">
                  <tbody>
                    {filteredProducts.map((p) => {
                      const hidden = form.hiddenProductIds.includes(p.id);
                      const promo = form.productPromos[p.id] ?? {};
                      return (
                        <tr key={p.id} className="border-b border-line/10 last:border-0 hover:bg-surface-2">
                          <td className="p-2.5">
                            <div className="font-semibold text-content">{p.name}</div>
                            <div className="text-[11px] text-muted">{p.brand} · {money(p.price)}</div>
                          </td>
                          <td className="p-2.5">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <input
                                value={promo.label ?? ''}
                                onChange={(e) => setPromo(p.id, { label: e.target.value || undefined })}
                                placeholder="Promo (ej: 2x1)"
                                className="h-8 w-28 rounded-lg border border-line/15 bg-surface px-2 text-[11.5px] text-content focus:border-primary/50 focus:outline-none"
                              />
                              <input
                                type="number" min={0} max={100}
                                value={promo.discountPct ?? ''}
                                onChange={(e) => setPromo(p.id, { discountPct: e.target.value ? Number(e.target.value) : undefined })}
                                placeholder="% off"
                                className="h-8 w-16 rounded-lg border border-line/15 bg-surface px-2 text-[11.5px] text-content focus:border-primary/50 focus:outline-none"
                              />
                              <label className="flex items-center gap-1 text-[11px] text-muted">
                                <input type="checkbox" checked={!!promo.isNew} onChange={(e) => setPromo(p.id, { isNew: e.target.checked || undefined })} />
                                Nuevo
                              </label>
                            </div>
                          </td>
                          <td className="w-32 p-2.5 text-right">
                            <button
                              onClick={() => toggleProduct(p.id)}
                              className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[12px] font-semibold ${hidden ? 'bg-rose/12 text-rose' : 'bg-emerald/12 text-emerald'}`}
                            >
                              {hidden ? <><EyeOff className="h-3.5 w-3.5" /> Oculto</> : <><Eye className="h-3.5 w-3.5" /> Visible</>}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'pedidos' && (
          <div className="space-y-5">
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
                          <div className="flex items-center gap-2">
                            {o.seller && <Badge tone="sky">Vendedor: {o.seller}</Badge>}
                            {o.envioGratis && <Badge tone="emerald">Envío gratis</Badge>}
                            <span className="font-display text-lg font-extrabold tnum text-content">{money(o.subtotal)}</span>
                          </div>
                        </div>
                        <div className="mt-2.5 space-y-1 border-t border-line/10 pt-2.5 text-[12.5px] text-muted">
                          {o.items.map((it, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{it.qty}x {it.name}</span>
                              <span className="tnum">{money(it.unitPrice * it.qty)}</span>
                            </div>
                          ))}
                        </div>
                        {o.wantsShipping !== undefined && (
                          <div className="mt-2.5 rounded-lg bg-surface-2/50 px-3 py-2 text-[12px] text-content">
                            {o.wantsShipping ? (
                              <>📦 Envío a: <b>{o.shippingAddress}</b> · Horario: <b>{o.availableSchedule}</b></>
                            ) : (
                              <>🏪 Retira en el local</>
                            )}
                          </div>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          {o.clientId && (
                            <a href={`/bandeja?clientId=${o.clientId}`} className="text-[12px] font-semibold text-primary hover:underline">
                              Ver conversación en Bandeja →
                            </a>
                          )}
                          {isVendedor ? (
                            <span className="text-[12px] text-muted">Pendiente de facturar (lo hace un administrador)</span>
                          ) : (
                            <Button size="sm" variant="soft" onClick={() => setInvoicingOrder(o)}>
                              <ReceiptText className="h-3.5 w-3.5" /> Facturar
                            </Button>
                          )}
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
                    Todavía no facturaste ningún pedido de la tienda.
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
                          <div className="flex items-center gap-2">
                            {o.seller && <Badge tone="sky">Vendedor: {o.seller}</Badge>}
                            {o.envioGratis && <Badge tone="emerald">Envío gratis</Badge>}
                            <span className="font-display text-lg font-extrabold tnum text-content">{money(o.subtotal)}</span>
                          </div>
                        </div>
                        <div className="mt-2.5 space-y-1 border-t border-line/10 pt-2.5 text-[12.5px] text-muted">
                          {o.items.map((it, i) => (
                            <div key={i} className="flex justify-between">
                              <span>{it.qty}x {it.name}</span>
                              <span className="tnum">{money(it.unitPrice * it.qty)}</span>
                            </div>
                          ))}
                        </div>
                        {o.wantsShipping !== undefined && (
                          <div className="mt-2.5 rounded-lg bg-surface-2/50 px-3 py-2 text-[12px] text-content">
                            {o.wantsShipping ? (
                              <>📦 Envío a: <b>{o.shippingAddress}</b> · Horario: <b>{o.availableSchedule}</b></>
                            ) : (
                              <>🏪 Retira en el local</>
                            )}
                          </div>
                        )}
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
