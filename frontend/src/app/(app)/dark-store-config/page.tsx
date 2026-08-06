'use client';
// Panel admin de MAON Dark Store (/dark-store-config, la app pública vive en /dark-store —
// nombres distintos a propósito, mismo criterio que tienda-config/cotillon-config/
// estufa-config vs. sus tiendas públicas, para no chocar la ruta).
import { useEffect, useMemo, useState } from 'react';
import {
  Store, ExternalLink, Save, Check, Image as ImageIcon, Package, ClipboardList, Cigarette,
  Clock, MapPin, Percent, MessageCircle, Plus, Trash2, Pencil, Download, X,
} from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { BannerManager } from '@/components/app/banner-manager';
import { useProductCatalog } from '@/lib/product-catalog-store';
import { useDarkStoreSettings, type DarkStoreSettings } from '@/lib/dark-store-settings-store';
import { useDarkStoreVapes, type DarkStoreVape } from '@/lib/dark-store-vapes-store';
import { useTiendaOrders, type TiendaOrder } from '@/lib/tienda-orders-store';
import { useComprobantesStore } from '@/lib/comprobantes-store';
import { printComprobante } from '@/lib/print-comprobante';
import { api, uploadImage } from '@/lib/api';

const inputClass = 'h-10 w-full rounded-xl border border-line/15 bg-surface-2/60 px-3 text-sm text-content focus:border-primary/50 focus:outline-none';
const labelClass = 'mb-1.5 block text-xs font-medium text-muted';
const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

const TABS = [
  { key: 'resumen', label: 'Resumen', icon: Store },
  { key: 'pedidos', label: 'Pedidos', icon: ClipboardList },
  { key: 'productos', label: 'Productos', icon: Package },
  { key: 'vapeadores', label: 'Vapeadores', icon: Cigarette },
  { key: 'contenido', label: 'Banners', icon: ImageIcon },
  { key: 'config', label: 'Configuración', icon: Save },
] as const;

/** Una venta es de Dark Store si tiene barrio cargado o líneas de vapeador — ninguna otra
 * tienda (Tienda/Cotillón/Estufa) carga esos campos, así que es una señal exclusiva (a
 * diferencia de filtrar por categoría/sku, que se solapa con el catálogo mayorista normal). */
const isDarkStoreOrder = (o: TiendaOrder) => !!o.barrio || !!o.vapeItems?.length;

export default function DarkStoreConfigPage() {
  const { settings, save, saveError } = useDarkStoreSettings();
  const { orders: allOrders, status: ordersStatus } = useTiendaOrders();
  const { comprobantes } = useComprobantesStore();
  const { products: fullCatalog } = useProductCatalog();
  const { vapes, refresh: refreshVapes } = useDarkStoreVapes(true);

  const darkStoreProducts = useMemo(
    () => fullCatalog.filter((p) => p.category === 'Bebidas' || p.category === 'Snacks' || p.category === 'Chocolates'),
    [fullCatalog],
  );
  const orders = useMemo(() => allOrders.filter(isDarkStoreOrder), [allOrders]);

  const [form, setForm] = useState<DarkStoreSettings>(settings);
  const [saved, setSaved] = useState(false);
  const [tab, setTab] = useState<(typeof TABS)[number]['key']>('resumen');
  const [bannerSub, setBannerSub] = useState<'carrusel' | 'tarjetas'>('carrusel');
  const [q, setQ] = useState('');

  useEffect(() => setForm(settings), [settings]);
  const set = <K extends keyof DarkStoreSettings>(key: K, value: DarkStoreSettings[K]) => setForm((f) => ({ ...f, [key]: value }));
  const handleSave = () => { save(form); setSaved(true); setTimeout(() => setSaved(false), 2000); };

  const downloadInvoice = (o: TiendaOrder) => {
    const entry = comprobantes.find((c) => c.numero === o.comprobanteNumero);
    if (entry) printComprobante(entry);
  };

  // ---- Resumen ----
  const today = new Date().toDateString();
  const ordersToday = orders.filter((o) => new Date(o.createdAt).toDateString() === today);
  const salesToday = ordersToday.reduce((a, o) => a + o.subtotal, 0);
  const ticketProm = ordersToday.length ? salesToday / ordersToday.length : 0;
  const productCount = new Map<string, number>();
  for (const o of orders) {
    for (const it of o.items) productCount.set(it.name, (productCount.get(it.name) ?? 0) + it.qty);
    for (const v of o.vapeItems ?? []) productCount.set(v.name, (productCount.get(v.name) ?? 0) + v.quantity);
  }
  const masVendido = [...productCount.entries()].sort((a, b) => b[1] - a[1])[0];

  return (
    <>
      <Topbar title="MAON Dark Store" subtitle="Configurá la tienda, los vapeadores y revisá los pedidos de Dark Store" />
      <main className="flex-1 space-y-5 p-5 lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap rounded-[10px] border border-line/15 bg-surface-2 p-0.5">
            {TABS.map((t) => {
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
          <div className="flex items-center gap-2">
            <Badge tone={settings.storeOpen ? 'emerald' : 'rose'} dot>{settings.storeOpen ? 'Tienda abierta' : 'Tienda cerrada'}</Badge>
            <a href="/dark-store" target="_blank" rel="noreferrer">
              <Button variant="outline"><ExternalLink className="h-4 w-4" /> Ver tienda</Button>
            </a>
          </div>
        </div>

        {saveError && (
          <div className="rounded-xl border border-rose/30 bg-rose/8 px-4 py-2.5 text-[12.5px] font-medium text-rose">
            ⚠️ {saveError}
          </div>
        )}

        {tab === 'resumen' && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {[
                { label: 'Pedidos hoy', value: ordersToday.length },
                { label: 'Ventas hoy', value: money(salesToday) },
                { label: 'Ticket promedio', value: money(ticketProm) },
                { label: 'Pendientes', value: orders.filter((o) => !o.invoiced).length },
                { label: 'Producto top', value: masVendido?.[0] ?? '-' },
              ].map((k) => (
                <Card key={k.label}><CardContent className="p-4">
                  <div className="text-[11px] text-muted">{k.label}</div>
                  <div className="mt-1 truncate text-lg font-extrabold tnum text-content">{k.value}</div>
                </CardContent></Card>
              ))}
            </div>
            <Card>
              <CardHeader><CardTitle>Estado operativo</CardTitle></CardHeader>
              <CardContent className="flex flex-wrap items-center gap-4 text-[13px] text-muted">
                <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Horario: {settings.scheduleStart} a {settings.scheduleEnd} hs</span>
                <span className="flex items-center gap-1.5"><MapPin className="h-4 w-4" /> {settings.deliveryBarrios.length} barrios cubiertos</span>
                <span className="flex items-center gap-1.5"><Percent className="h-4 w-4" /> Margen: {settings.margenPct}%</span>
              </CardContent>
            </Card>
          </div>
        )}

        {tab === 'pedidos' && (
          <div className="space-y-3">
            {ordersStatus === 'error' && (
              <div className="rounded-xl border border-rose/30 bg-rose/8 px-4 py-2.5 text-[12.5px] font-medium text-rose">
                No se pudieron cargar los pedidos. Probá recargar la página.
              </div>
            )}
            {orders.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line/15 p-6 text-center text-[13px] text-muted">
                Todavía no hay pedidos de Dark Store.
              </div>
            ) : orders.map((o) => (
              <div key={o.id} className="rounded-xl border border-line/10 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-semibold text-content">{o.customerName}</div>
                    <div className="text-[11px] text-muted">{o.customerPhone} · {new Date(o.createdAt).toLocaleString('es-AR')}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {o.barrio && <Badge tone="sky">{o.barrio}</Badge>}
                    {o.comprobanteNumero && <Badge tone="emerald">Ticket {o.comprobanteNumero}</Badge>}
                    <span className="font-display text-lg font-extrabold tnum text-content">{money(o.subtotal)}</span>
                  </div>
                </div>
                <div className="mt-2.5 space-y-1 border-t border-line/10 pt-2.5 text-[12.5px] text-muted">
                  {o.items.map((it, i) => <div key={`p${i}`} className="flex justify-between"><span>{it.qty}x {it.name}</span><span className="tnum">{money(it.unitPrice * it.qty)}</span></div>)}
                  {(o.vapeItems ?? []).map((v, i) => <div key={`v${i}`} className="flex justify-between"><span>{v.quantity}x {v.name} 💨</span><span className="tnum">{money(v.unitPrice * v.quantity)}</span></div>)}
                </div>
                {o.shippingAddress && (
                  <div className="mt-2.5 rounded-lg bg-surface-2/50 px-3 py-2 text-[12px] text-content">📍 {o.shippingAddress}</div>
                )}
                <div className="mt-3 flex flex-wrap items-center gap-3">
                  {o.clientId && <a href={`/bandeja?clientId=${o.clientId}`} className="text-[12px] font-semibold text-primary hover:underline">Ver conversación en Bandeja →</a>}
                  {o.comprobanteNumero && (
                    <Button size="sm" variant="outline" onClick={() => downloadInvoice(o)}><Download className="h-3.5 w-3.5" /> Descargar ticket</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'productos' && (
          <Card>
            <CardHeader>
              <CardTitle>Bebidas, Snacks y Chocolates</CardTitle>
              <span className="text-xs text-muted">{darkStoreProducts.length} productos del catálogo mayorista</span>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-[12.5px] text-muted">
                Vienen del mismo catálogo que Tienda/Cotillón — para editar precio, stock o margen de un artículo puntual, andá a{' '}
                <a href="/productos" className="font-semibold text-primary hover:underline">Productos</a>.
              </p>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." className={inputClass} />
              <div className="max-h-[480px] space-y-1.5 overflow-y-auto">
                {darkStoreProducts.filter((p) => !q || p.name.toLowerCase().includes(q.toLowerCase())).slice(0, 200).map((p) => (
                  <div key={p.id} className="flex items-center justify-between rounded-lg border border-line/10 px-3 py-2 text-[12.5px]">
                    <span className="truncate text-content">{p.name}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <Badge tone="muted">{p.category}</Badge>
                      <span className={p.stock > 0 ? 'text-emerald' : 'text-rose'}>{p.stock > 0 ? 'En stock' : 'Sin stock'}</span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'vapeadores' && <VapesTab vapes={vapes} refresh={refreshVapes} />}

        {tab === 'contenido' && (
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><ImageIcon className="h-4 w-4 text-primary" /> Banners del home</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-1.5 border-b border-line/10 pb-3">
                {(['carrusel', 'tarjetas'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setBannerSub(s)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${bannerSub === s ? 'bg-primary text-white' : 'text-muted hover:text-content'}`}
                  >
                    {s === 'carrusel' ? 'Carrusel principal' : 'Tarjetas promo'}
                    <span className={`rounded-full px-1.5 text-[10px] font-bold ${bannerSub === s ? 'bg-white/25 text-white' : 'bg-surface-2 text-muted'}`}>
                      {(s === 'carrusel' ? form.heroCarousel : form.promoCards).length}
                    </span>
                  </button>
                ))}
              </div>
              {bannerSub === 'carrusel' ? (
                <BannerManager items={form.heroCarousel} noun="Banner" onChange={(next) => { const u = { ...form, heroCarousel: next }; setForm(u); save(u); }} />
              ) : (
                <BannerManager items={form.promoCards} noun="Tarjeta" onChange={(next) => { const u = { ...form, promoCards: next }; setForm(u); save(u); }} />
              )}
            </CardContent>
          </Card>
        )}

        {tab === 'config' && (
          <div className="space-y-5">
            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> General</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-xl border border-line/15 bg-surface-2/40 p-3.5">
                  <div>
                    <div className="text-sm font-semibold text-content">Tienda habilitada</div>
                    <div className="text-xs text-muted">Modo mantenimiento: si la apagás, los clientes ven un aviso en vez del catálogo (independiente del horario).</div>
                  </div>
                  <button onClick={() => set('storeOpen', !form.storeOpen)} className={`relative h-6 w-11 rounded-full transition ${form.storeOpen ? 'bg-emerald' : 'bg-line/30'}`}>
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.storeOpen ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className={labelClass}>Nombre de la tienda</label><input className={inputClass} value={form.storeName} onChange={(e) => set('storeName', e.target.value)} /></div>
                  <div><label className={labelClass}>Frase / tagline</label><input className={inputClass} value={form.tagline} onChange={(e) => set('tagline', e.target.value)} /></div>
                  <div><label className={labelClass}>Compra mínima ($)</label><input type="number" className={inputClass} value={form.minOrderAmount} onChange={(e) => set('minOrderAmount', Number(e.target.value))} /></div>
                  <div><label className={labelClass}>Compra máxima ($, opcional)</label><input type="number" className={inputClass} value={form.maxOrderAmount ?? ''} onChange={(e) => set('maxOrderAmount', e.target.value ? Number(e.target.value) : undefined)} /></div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Clock className="h-4 w-4 text-primary" /> Horario</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div><label className={labelClass}>Abre</label><input type="time" className={inputClass} value={form.scheduleStart} onChange={(e) => set('scheduleStart', e.target.value)} /></div>
                <div><label className={labelClass}>Cierra</label><input type="time" className={inputClass} value={form.scheduleEnd} onChange={(e) => set('scheduleEnd', e.target.value)} /></div>
                <div><label className={labelClass}>Tiempo de entrega estimado (min)</label><input type="number" className={inputClass} value={form.deliveryEtaMinutes} onChange={(e) => set('deliveryEtaMinutes', Number(e.target.value))} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> Zona de entrega</CardTitle>
                <span className="text-xs text-muted">{form.deliveryBarrios.length} barrios</span>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-[12.5px] text-muted">
                  Sin geocoding todavía: el checkout valida contra esta lista de barrios, no contra un mapa real.
                </p>
                <div>
                  <label className={labelClass}>Costo de envío ($, fijo para todos los pedidos)</label>
                  <input type="number" className={`${inputClass} max-w-[180px]`} value={form.deliveryFee} onChange={(e) => set('deliveryFee', Number(e.target.value))} />
                </div>
                <div className="flex flex-wrap gap-2">
                  {form.deliveryBarrios.map((b) => (
                    <span key={b} className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-[12.5px] font-medium text-primary">
                      {b}
                      <button onClick={() => set('deliveryBarrios', form.deliveryBarrios.filter((x) => x !== b))}><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
                <BarrioAdder onAdd={(b) => set('deliveryBarrios', [...form.deliveryBarrios, b])} existing={form.deliveryBarrios} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><Percent className="h-4 w-4 text-primary" /> Márgenes y stock</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div><label className={labelClass}>Margen de venta (%)</label><input type="number" className={inputClass} value={form.margenPct} onChange={(e) => set('margenPct', Number(e.target.value))} /></div>
                <div><label className={labelClass}>Umbral "últimas unidades" (stock ≤)</label><input type="number" className={inputClass} value={form.lowStockThreshold} onChange={(e) => set('lowStockThreshold', Number(e.target.value))} /></div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-primary" /> WhatsApp</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div><label className={labelClass}>Número (sin +, ej: 5493411234567)</label><input className={inputClass} value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} /></div>
              </CardContent>
            </Card>

            <Button onClick={handleSave} className="w-full sm:w-auto">
              {saved ? <><Check className="h-4 w-4" /> Guardado</> : <><Save className="h-4 w-4" /> Guardar cambios</>}
            </Button>
          </div>
        )}
      </main>
    </>
  );
}

function BarrioAdder({ onAdd, existing }: { onAdd: (b: string) => void; existing: string[] }) {
  const [v, setV] = useState('');
  const submit = () => {
    const trimmed = v.trim();
    if (trimmed && !existing.includes(trimmed)) onAdd(trimmed);
    setV('');
  };
  return (
    <div className="flex gap-2">
      <input value={v} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), submit())} placeholder="Agregar barrio..." className={inputClass} />
      <Button variant="outline" onClick={submit}><Plus className="h-4 w-4" /> Agregar</Button>
    </div>
  );
}

// ---- Vapeadores: CRUD completo ----
type VapeForm = { id?: string; name: string; description: string; brand: string; price: string; stock: string; images: string; featured: boolean; isActive: boolean };
const emptyVapeForm: VapeForm = { name: '', description: '', brand: '', price: '', stock: '0', images: '', featured: false, isActive: true };

function VapesTab({ vapes, refresh }: { vapes: DarkStoreVape[]; refresh: () => void }) {
  const [editing, setEditing] = useState<VapeForm | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const onPickFile = async (file: File | undefined) => {
    if (!file || !editing) return;
    setUploading(true);
    setError('');
    try {
      const url = await uploadImage(file);
      const current = editing.images.split(',').map((s) => s.trim()).filter(Boolean);
      setEditing({ ...editing, images: [...current, url].join(', ') });
    } catch (e: any) {
      setError(e?.message || 'No se pudo subir la imagen');
    } finally {
      setUploading(false);
    }
  };

  const openNew = () => setEditing({ ...emptyVapeForm });
  const openEdit = (v: DarkStoreVape) => setEditing({
    id: v.id, name: v.name, description: v.description ?? '', brand: v.brand ?? '',
    price: String(v.price), stock: String(v.stock), images: v.images.join(', '), featured: v.featured, isActive: v.isActive,
  });

  const submit = async () => {
    if (!editing) return;
    if (!editing.name.trim() || !editing.price) return setError('Nombre y precio son obligatorios');
    setSaving(true);
    setError('');
    try {
      const dto = {
        name: editing.name.trim(),
        description: editing.description.trim() || undefined,
        brand: editing.brand.trim() || undefined,
        price: Number(editing.price),
        stock: Number(editing.stock) || 0,
        images: editing.images.split(',').map((s) => s.trim()).filter(Boolean),
        featured: editing.featured,
        isActive: editing.isActive,
      };
      if (editing.id) await api.updateDarkStoreVape(editing.id, dto);
      else await api.createDarkStoreVape(dto);
      setEditing(null);
      refresh();
    } catch (e: any) {
      setError(e?.message || 'No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await api.deleteDarkStoreVape(id);
    refresh();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vapeadores</CardTitle>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted">{vapes.length} artículos</span>
          <Button size="sm" onClick={openNew}><Plus className="h-3.5 w-3.5" /> Nuevo</Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-[12.5px] text-muted">Catálogo administrado a mano — no viene del maestro del proveedor. Venta exclusiva para mayores de 18 años.</p>

        {editing && (
          <div className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 p-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div><label className={labelClass}>Nombre*</label><input className={inputClass} value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} /></div>
              <div><label className={labelClass}>Marca</label><input className={inputClass} value={editing.brand} onChange={(e) => setEditing({ ...editing, brand: e.target.value })} /></div>
              <div><label className={labelClass}>Precio de venta ($)*</label><input type="number" className={inputClass} value={editing.price} onChange={(e) => setEditing({ ...editing, price: e.target.value })} /></div>
              <div><label className={labelClass}>Stock</label><input type="number" className={inputClass} value={editing.stock} onChange={(e) => setEditing({ ...editing, stock: e.target.value })} /></div>
            </div>
            <div><label className={labelClass}>Descripción</label><input className={inputClass} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} /></div>
            <div>
              <label className={labelClass}>Imágenes (URLs separadas por coma)</label>
              <div className="flex gap-2">
                <input className={inputClass} value={editing.images} onChange={(e) => setEditing({ ...editing, images: e.target.value })} />
                <label className="flex h-10 shrink-0 cursor-pointer items-center gap-1.5 rounded-xl border border-line/15 bg-surface-2/60 px-3 text-[12.5px] font-semibold text-content hover:bg-surface-2">
                  {uploading ? 'Subiendo…' : 'Subir foto'}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading} onChange={(e) => onPickFile(e.target.files?.[0])} />
                </label>
              </div>
              {editing.images && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {editing.images.split(',').map((s) => s.trim()).filter(Boolean).map((url, i) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={i} src={url} alt="" className="h-14 w-14 rounded-lg border border-line/15 object-cover" />
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-[12.5px] text-content"><input type="checkbox" checked={editing.featured} onChange={(e) => setEditing({ ...editing, featured: e.target.checked })} /> Destacado</label>
              <label className="flex items-center gap-1.5 text-[12.5px] text-content"><input type="checkbox" checked={editing.isActive} onChange={(e) => setEditing({ ...editing, isActive: e.target.checked })} /> Activo</label>
            </div>
            {error && <div className="text-[12px] text-rose">{error}</div>}
            <div className="flex gap-2">
              <Button onClick={submit} disabled={saving}>{saving ? 'Guardando…' : 'Guardar'}</Button>
              <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
            </div>
          </div>
        )}

        <div className="space-y-1.5">
          {vapes.map((v) => (
            <div key={v.id} className="flex items-center justify-between rounded-lg border border-line/10 px-3 py-2">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-medium text-content">{v.name} {v.featured && <Badge tone="amber">Destacado</Badge>}</div>
                <div className="text-[11px] text-muted">{v.brand ?? '-'} · {money(v.price)} · Stock: {v.stock}{!v.isActive && ' · Inactivo'}</div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                <Button size="icon" variant="ghost" onClick={() => openEdit(v)}><Pencil className="h-3.5 w-3.5" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(v.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          ))}
          {!vapes.length && <div className="rounded-xl border border-dashed border-line/15 p-6 text-center text-[13px] text-muted">Todavía no cargaste ningún vapeador.</div>}
        </div>
      </CardContent>
    </Card>
  );
}
