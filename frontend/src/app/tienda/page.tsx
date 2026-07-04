'use client';

import { useEffect, useMemo, useState } from 'react';
import { Search, ShoppingCart, X, Plus, Minus, Trash2, MessageCircle, Zap, Sparkles, Truck, ShieldCheck, PackageCheck, SlidersHorizontal, Clock } from 'lucide-react';
import { type ProductRow } from '@/lib/mock';
import { useProductCatalog } from '@/lib/product-catalog-store';
import { useClients } from '@/lib/clients-store';
import { useChatThreads } from '@/lib/chat-store';
import { useTiendaSettings } from '@/lib/tienda-settings-store';
import { useTiendaOrders } from '@/lib/tienda-orders-store';

const BRAND = '#1B3358';     // azul marino elegante de marca
const BRAND_DARK = '#0E2036';
const BRAND_LIGHT = '#2E5A8C';
const BRAND_SOFT = '#EEF2F8';
const ACCENT = '#E38A1F';    // ámbar, contraste cálido sobre el azul
const WHATSAPP = '#25D366';

const CAT_ICON: Record<string, string> = {
  Galletitas: '🍪', Golosinas: '🍬', Alfajores: '🍫', Kiosco: '🛒',
  Alimentos: '🥫', Bebidas: '🥤', Chocolates: '🍫', 'Cotillón': '🎉', 'Desayuno y Merienda': '☕', Harinas: '🌾',
};

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
const PAGE_SIZE = 24;

interface CartLine { productId: string; qty: number }

function ProdImg({ src, size, className = '' }: { src: string; size: number; className?: string }) {
  const [err, setErr] = useState(false);
  if (!src || err) {
    return (
      <div className={`flex shrink-0 items-center justify-center rounded-xl text-3xl ${className}`} style={{ width: size, height: size, background: BRAND_SOFT }}>📦</div>
    );
  }
  return (
    <img
      src={src}
      loading="lazy"
      decoding="async"
      onError={() => setErr(true)}
      alt=""
      className={`shrink-0 rounded-xl border border-black/5 object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

function TiendaInner() {
  // ponytail: se lee directo de la URL en vez de useSearchParams() — evita tener que envolver
  // toda la página en Suspense solo por esto (no hace falta que sea correcto en el primer paint SSR).
  const [vendedor, setVendedor] = useState('');
  useEffect(() => {
    setVendedor(new URLSearchParams(window.location.search).get('vendedor')?.trim() || '');
  }, []);
  const { addClient, clients: CLIENTS } = useClients();
  const { appendMessage } = useChatThreads();
  const { settings } = useTiendaSettings();
  const { addOrder } = useTiendaOrders();
  const { products } = useProductCatalog();
  const getPromo = (p: ProductRow) => settings.productPromos[p.id];
  const ventaBulto = (p: ProductRow) => {
    const base = p.price * (1 + settings.margenVenta);
    const pct = getPromo(p)?.discountPct;
    return Math.round(pct ? base * (1 - pct / 100) : base);
  };
  const catalog = useMemo(() => products.filter((p) => !settings.hiddenProductIds.includes(p.id)), [products, settings.hiddenProductIds]);
  // Fotos reales para decorar el banner de inicio (las primeras 3 con imagen del catálogo).
  const heroImgs = useMemo(() => catalog.filter((p) => p.img).slice(0, 3).map((p) => p.img), [catalog]);

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [view, setView] = useState<'' | 'OFERTAS' | 'NOVEDADES'>('');
  const [brand, setBrand] = useState('');
  const [brandQuery, setBrandQuery] = useState('');
  const [priceMin, setPriceMin] = useState('');
  const [priceMax, setPriceMax] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', wantsShipping: true, address: '', schedule: '' });
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);
  const [bump, setBump] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const categories = useMemo(() => [...new Set(catalog.map((p) => p.category))].sort(), [catalog]);
  const brands = useMemo(() => [...new Set(catalog.map((p) => p.brand))].sort(), [catalog]);
  const brandsShown = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    return q ? brands.filter((b) => b.toLowerCase().includes(q)) : brands;
  }, [brands, brandQuery]);

  // Busca por palabras sueltas y abreviadas: cada token debe aparecer en el nombre/marca,
  // así "fan alf" encuentra "FANTOCHE ALF.TRIPLE NEGRO..." sin importar el orden.
  const searchTokens = useMemo(() => search.trim().toLowerCase().split(/\s+/).filter(Boolean), [search]);
  const filtered = useMemo(() => {
    const min = priceMin ? Number(priceMin) : null;
    const max = priceMax ? Number(priceMax) : null;
    return catalog.filter((p) => {
      const venta = ventaBulto(p);
      const promo = getPromo(p);
      const haystack = `${p.name} ${p.brand}`.toLowerCase();
      return (!category || p.category === category) &&
        (!brand || p.brand === brand) &&
        (min === null || venta >= min) &&
        (max === null || venta <= max) &&
        searchTokens.every((t) => haystack.includes(t)) &&
        (view !== 'OFERTAS' || !!(promo?.label || promo?.discountPct)) &&
        (view !== 'NOVEDADES' || !!promo?.isNew);
    });
  }, [catalog, searchTokens, category, brand, priceMin, priceMax, view, settings.margenVenta, settings.productPromos]);

  // Reinicia la paginación cada vez que cambia algún filtro, para no quedar "perdido" en la página 5 de otra búsqueda.
  useEffect(() => setVisibleCount(PAGE_SIZE), [search, category, brand, priceMin, priceMax, view]);
  const visible = filtered.slice(0, visibleCount);

  const cartLines = cart.map((c) => {
    const p = catalog.find((x) => x.id === c.productId)!;
    return { ...c, product: p, unitPrice: ventaBulto(p), subtotal: ventaBulto(p) * c.qty };
  });
  const cartCount = cart.reduce((a, c) => a + c.qty, 0);
  const subtotal = cartLines.reduce((a, l) => a + l.subtotal, 0);
  const faltante = Math.max(0, settings.minCompra - subtotal);
  const progreso = Math.min(100, Math.round((subtotal / settings.minCompra) * 100));
  const envioGratis = subtotal >= settings.envioGratisDesde;
  const faltanteEnvio = Math.max(0, settings.envioGratisDesde - subtotal);

  useEffect(() => {
    if (!bump) return;
    const t = setTimeout(() => setBump(false), 260);
    return () => clearTimeout(t);
  }, [bump]);

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      if (existing) return prev.map((c) => (c.productId === productId ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { productId, qty: 1 }];
    });
    setBump(true);
  };
  const changeQty = (productId: string, delta: number) => {
    setCart((prev) => prev
      .map((c) => (c.productId === productId ? { ...c, qty: c.qty + delta } : c))
      .filter((c) => c.qty > 0));
  };
  // Permite tipear la cantidad directamente en vez de solo +/-.
  const setQty = (productId: string, qty: number) => {
    setCart((prev) => prev
      .map((c) => (c.productId === productId ? { ...c, qty: Math.max(1, Math.floor(qty) || 1) } : c)));
  };
  const removeLine = (productId: string) => setCart((prev) => prev.filter((c) => c.productId !== productId));

  const qtyInCart = (productId: string) => cart.find((c) => c.productId === productId)?.qty ?? 0;

  const buildOrderText = () => {
    const lines = cartLines.map((l, i) =>
      `${i + 1}. ${l.product.name}\n   Cantidad: ${l.qty} bulto${l.qty === 1 ? '' : 's'} x ${money(l.unitPrice)} = ${money(l.subtotal)}`,
    ).join('\n\n');
    const envio = form.wantsShipping
      ? `Envío: ${envioGratis ? 'gratis' : 'a coordinar'}\nDirección: ${form.address}\nHorario disponible: ${form.schedule}`
      : 'Envío: no quiere, retira en el local';
    return `¡Hola! Quiero hacer este pedido en *MAON - Mayorista Online*:\n\n${lines}\n\n${envio}\n*Total: ${money(subtotal)}*\n\nNombre: ${form.name}\nTeléfono: ${form.phone}\n\nEl pedido se despacha entre 24 y 48 hs.`;
  };

  const sendOrder = () => {
    if (!form.name.trim() || !form.phone.trim()) return setFormError('Nombre y teléfono son obligatorios');
    if (subtotal < settings.minCompra) return setFormError(`La compra mínima es ${money(settings.minCompra)}`);
    if (form.wantsShipping && (!form.address.trim() || !form.schedule.trim())) {
      return setFormError('Para el envío hace falta la dirección y un horario disponible');
    }
    setFormError('');

    // Si ya es cliente (mismo teléfono), el pedido se suma a su misma conversación
    // en vez de crear un contacto duplicado en Bandeja.
    const normPhone = (p: string) => p.replace(/\D/g, '');
    const existing = CLIENTS.find((c) => normPhone(c.phone) === normPhone(form.phone.trim()));

    const [firstName, ...rest] = form.name.trim().split(' ');
    const client = existing ?? addClient({
      firstName, lastName: rest.join(' '), phone: form.phone.trim(),
      city: '', province: '', stage: 'NUEVO_LEAD', product: cartLines[0]?.product.name ?? '',
      source: 'WHATSAPP', leadScore: 40, intent: 'ALTA', sentiment: 'NEUTRO', tags: [],
      lastInboundAt: new Date().toISOString(), unread: 1, summary: 'Pedido armado desde la tienda online.',
      objection: 'NINGUNA', seller: vendedor || '-', ivaCondition: 'CONSUMIDOR_FINAL',
    });

    Promise.resolve(client).then((c) => {
      appendMessage(c, { content: buildOrderText(), direction: 'ENTRANTE' as any, author: 'CLIENTE' as any });
      addOrder({
        customerName: form.name.trim(), customerPhone: form.phone.trim(), clientId: c.id,
        items: cartLines.map((l) => ({ productId: l.productId, name: l.product.name, qty: l.qty, unitPrice: l.unitPrice })),
        subtotal, envioGratis, seller: vendedor || undefined,
        wantsShipping: form.wantsShipping,
        shippingAddress: form.wantsShipping ? form.address.trim() : undefined,
        availableSchedule: form.wantsShipping ? form.schedule.trim() : undefined,
      });
    });

    const waLink = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(buildOrderText())}`;
    window.open(waLink, '_blank');
    setSent(true);
  };

  const closeCheckout = () => { setShowCheckout(false); if (sent) { setCart([]); setForm({ name: '', phone: '', wantsShipping: true, address: '', schedule: '' }); setSent(false); } };

  if (!settings.storeOpen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center" style={{ background: '#FAFAF7' }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: BRAND }}>
          <Zap className="h-7 w-7" fill="currentColor" />
        </div>
        <h1 className="font-display text-xl font-extrabold" style={{ color: BRAND }}>MAON — Mayorista Online</h1>
        <p className="max-w-xs text-sm text-neutral-500">La tienda está cerrada por el momento. Escribinos por WhatsApp y te ayudamos con tu pedido.</p>
        <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: WHATSAPP }}>
          <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>
      {/* Banner superior */}
      <div className="truncate px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-white/90" style={{ background: '#1A1A1A' }}>
        {settings.topBannerText}
      </div>

      {/* Barra de compra mínima */}
      <div className="flex items-center justify-center gap-1.5 px-4 py-2 text-center text-[11px] font-semibold tracking-wide text-white" style={{ background: BRAND }}>
        <Truck className="h-3.5 w-3.5" /> COMPRA MÍNIMA {money(settings.minCompra)} · ENVÍO GRATIS DESDE {money(settings.envioGratisDesde)}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-black/[0.06] bg-white/90 px-4 py-3 shadow-[0_1px_0_0_rgba(0,0,0,0.04)] backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 sm:gap-4">
          <div className="flex shrink-0 items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl text-white shadow-sm" style={{ background: `linear-gradient(135deg, ${BRAND_LIGHT}, ${BRAND})` }}>
              <Zap className="h-5 w-5" fill="currentColor" />
            </div>
            <div className="hidden leading-none sm:block">
              <div className="font-display text-lg font-extrabold tracking-tight" style={{ color: BRAND }}>MAON</div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-neutral-400">Mayorista Online</div>
            </div>
          </div>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="h-11 w-full rounded-full border border-black/[0.08] bg-neutral-50 pl-10 pr-4 text-sm text-neutral-800 outline-none transition focus:border-transparent focus:bg-white focus:ring-2"
              style={{ ['--tw-ring-color' as any]: `${BRAND}55` }}
            />
          </div>
          <button
            onClick={() => setShowCart(true)}
            className={`relative flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold text-white shadow-sm transition ${bump ? 'scale-105' : 'scale-100'}`}
            style={{ background: BRAND }}
          >
            <ShoppingCart className="h-4 w-4" />
            <span className="hidden sm:inline">{money(subtotal)}</span>
            {cartCount > 0 && (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-extrabold text-white" style={{ background: ACCENT }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>

        {/* Ofertas / Novedades */}
        <div className="mx-auto mt-3 flex max-w-[1600px] gap-1.5 overflow-x-auto pb-0.5">
          <button
            onClick={() => setView(view === 'OFERTAS' ? '' : 'OFERTAS')}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition"
            style={view === 'OFERTAS' ? { background: ACCENT, color: '#fff' } : { background: `${ACCENT}18`, color: ACCENT }}
          >
            🔥 Ofertas
          </button>
          <button
            onClick={() => setView(view === 'NOVEDADES' ? '' : 'NOVEDADES')}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-bold transition"
            style={view === 'NOVEDADES' ? { background: BRAND, color: '#fff' } : { background: `${BRAND}12`, color: BRAND }}
          >
            ✨ Novedades
          </button>
        </div>

        {/* Categorías */}
        <div className="mx-auto mt-1.5 flex max-w-[1600px] gap-1.5 overflow-x-auto pb-0.5">
          <button
            onClick={() => setCategory('')}
            className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition"
            style={!category ? { background: BRAND, color: '#fff' } : { background: '#F1F1EC', color: '#666' }}
          >
            Todas
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c!)}
              className="shrink-0 rounded-full px-3.5 py-1.5 text-[12px] font-semibold transition"
              style={category === c ? { background: BRAND, color: '#fff' } : { background: '#F1F1EC', color: '#666' }}
            >
              {CAT_ICON[c!] ?? ''} {c}
            </button>
          ))}
        </div>
      </header>

      {/* Hero */}
      <div className="relative overflow-hidden px-4 py-10 text-white sm:py-14" style={{ background: `linear-gradient(120deg, ${BRAND}, ${BRAND_DARK} 70%)` }}>
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-24 left-1/3 h-72 w-72 rounded-full bg-white/[0.04]" />
        <div className="relative mx-auto flex max-w-[1600px] items-center justify-between gap-8">
          <div className="animate-fade-up">
            <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold">
              <Sparkles className="h-3.5 w-3.5" /> {settings.heroBadge}
            </div>
            <h1 className="max-w-lg font-display text-3xl font-extrabold leading-tight sm:text-4xl">
              {settings.heroTitle}
            </h1>
            <p className="mt-2 max-w-md text-[14px] text-white/80">
              {settings.heroSubtitle}
            </p>
            <div className="mt-5 flex flex-wrap gap-4 text-[12px] text-white/85">
              <span className="flex items-center gap-1.5"><PackageCheck className="h-4 w-4" /> Venta por bulto cerrado</span>
              <span className="flex items-center gap-1.5"><Truck className="h-4 w-4" /> Envíos a todo el país</span>
              <span className="flex items-center gap-1.5"><Clock className="h-4 w-4" /> Despacho en 24 a 48 hs</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Pedido confirmado por WhatsApp</span>
            </div>
          </div>

          {/* Fotos de productos reales flotando, estilo vidriera */}
          {heroImgs.length > 0 && (
            <div className="relative hidden shrink-0 items-end gap-3 lg:flex">
              <div className="absolute -right-6 -top-10 flex h-24 w-24 -rotate-6 items-center justify-center rounded-full border border-white/15 bg-white/10 text-center text-[10px] font-bold uppercase leading-tight backdrop-blur-sm">
                Precios<br />mayoristas
              </div>
              {heroImgs.map((src, i) => (
                <div
                  key={i}
                  className="overflow-hidden rounded-2xl border border-white/10 bg-white shadow-2xl"
                  style={{ transform: `rotate(${i % 2 === 0 ? -4 : 5}deg) translateY(${i === 1 ? '-14px' : '0'})`, width: i === 1 ? 128 : 104, height: i === 1 ? 128 : 104 }}
                >
                  <img src={src} alt="" className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <main className="mx-auto flex max-w-[1600px] gap-6 p-4 pt-6">
        <aside className="hidden w-[240px] shrink-0 md:block">
          <div className="sticky top-[140px] space-y-4">
            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="mb-2.5 text-[13px] font-bold text-neutral-800">Precio (venta)</div>
              <div className="flex items-center gap-1.5">
                <input
                  type="number" min={0} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Desde"
                  className="h-9 w-full rounded-lg border border-black/[0.08] bg-neutral-50 px-2 text-[12px] outline-none focus:border-transparent focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: `${BRAND}55` }}
                />
                <span className="text-neutral-300">–</span>
                <input
                  type="number" min={0} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Hasta"
                  className="h-9 w-full rounded-lg border border-black/[0.08] bg-neutral-50 px-2 text-[12px] outline-none focus:border-transparent focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: `${BRAND}55` }}
                />
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
              <div className="mb-2.5 text-[13px] font-bold text-neutral-800">Marca</div>
              {brands.length > 10 && (
                <input
                  value={brandQuery} onChange={(e) => setBrandQuery(e.target.value)} placeholder="Buscar marca..."
                  className="mb-2 h-8 w-full rounded-lg border border-black/[0.08] bg-neutral-50 px-2 text-[12px] outline-none focus:border-transparent focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: `${BRAND}55` }}
                />
              )}
              <div className="max-h-[340px] space-y-1 overflow-y-auto pr-1">
                <button
                  onClick={() => setBrand('')}
                  className="block w-full rounded-lg px-2 py-1.5 text-left text-[13px] transition hover:bg-neutral-50"
                  style={!brand ? { color: BRAND, fontWeight: 700, background: BRAND_SOFT } : { color: '#666' }}
                >
                  Todas las marcas
                </button>
                {brandsShown.map((b) => (
                  <button
                    key={b}
                    onClick={() => setBrand(b)}
                    className="block w-full rounded-lg px-2 py-1.5 text-left text-[13px] transition hover:bg-neutral-50"
                    style={brand === b ? { color: BRAND, fontWeight: 700, background: BRAND_SOFT } : { color: '#666' }}
                  >
                    {b}
                  </button>
                ))}
                {brandsShown.length === 0 && <div className="px-2 py-1.5 text-[12px] text-neutral-400">Sin resultados</div>}
              </div>
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-[13px] font-medium text-neutral-500">{filtered.length} producto{filtered.length === 1 ? '' : 's'}</div>
            <div className="flex items-center gap-3">
              <button onClick={() => setShowFilters(true)} className="flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-[12px] font-semibold text-neutral-700 md:hidden">
                <SlidersHorizontal className="h-3.5 w-3.5" /> Filtros
              </button>
              {(category || brand || search || priceMin || priceMax) && (
                <button onClick={() => { setCategory(''); setBrand(''); setSearch(''); setPriceMin(''); setPriceMax(''); setBrandQuery(''); }} className="text-[12px] font-semibold" style={{ color: ACCENT }}>
                  Limpiar filtros
                </button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {visible.map((p) => {
              const inCart = qtyInCart(p.id);
              const promo = getPromo(p);
              const original = Math.round(p.price * (1 + settings.margenVenta));
              return (
                <div key={p.id} className="group flex flex-col rounded-2xl border border-black/5 bg-white p-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
                  <div className="relative flex items-center justify-center overflow-hidden rounded-xl p-3" style={{ background: BRAND_SOFT }}>
                    <span className="absolute left-2 top-2 rounded-md bg-white/90 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ color: BRAND }}>Bulto cerrado</span>
                    {promo?.isNew && (
                      <span className="absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white" style={{ background: BRAND }}>Nuevo</span>
                    )}
                    {(promo?.label || promo?.discountPct) && (
                      <span className="absolute bottom-2 left-2 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white" style={{ background: ACCENT }}>
                        {promo.label || `${promo.discountPct}% OFF`}
                      </span>
                    )}
                    <ProdImg src={p.img} size={104} className="transition group-hover:scale-105" />
                  </div>
                  <div className="mt-2.5 text-[10px] font-bold uppercase tracking-wide text-neutral-400">{p.brand}</div>
                  <div className="line-clamp-3 min-h-[52px] text-[13px] font-medium leading-tight text-neutral-800" title={p.name}>{p.name}</div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-[16px] font-extrabold" style={{ color: BRAND }}>{money(ventaBulto(p))}</span>
                    {!!promo?.discountPct && <span className="text-[11px] text-neutral-400 line-through">{money(original)}</span>}
                  </div>
                  <div className="text-[10.5px] text-neutral-400">bulto x {p.units || '-'} u.</div>
                  <div className="mt-2.5">
                    {inCart === 0 ? (
                      <button
                        onClick={() => addToCart(p.id)}
                        className="w-full rounded-lg py-2 text-[12px] font-bold text-white transition active:scale-95"
                        style={{ background: ACCENT }}
                      >
                        Agregar
                      </button>
                    ) : (
                      <div className="flex items-center justify-between rounded-lg border px-1 py-1" style={{ borderColor: `${ACCENT}55`, background: `${ACCENT}12` }}>
                        <button onClick={() => changeQty(p.id, -1)} className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-white" style={{ color: ACCENT }}><Minus className="h-3.5 w-3.5" /></button>
                        <input
                          type="number"
                          min={1}
                          value={inCart}
                          onChange={(e) => setQty(p.id, Number(e.target.value))}
                          onClick={(e) => e.stopPropagation()}
                          className="w-10 border-0 bg-transparent text-center text-[13px] font-bold text-neutral-800 outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                        />
                        <button onClick={() => changeQty(p.id, 1)} className="flex h-7 w-7 items-center justify-center rounded-md transition hover:bg-white" style={{ color: ACCENT }}><Plus className="h-3.5 w-3.5" /></button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div className="col-span-full flex flex-col items-center gap-2 py-16 text-center text-neutral-400">
                <Search className="h-8 w-8" />
                <div className="text-sm font-medium">No encontramos productos con esa búsqueda.</div>
              </div>
            )}
          </div>
          {visibleCount < filtered.length && (
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setVisibleCount((v) => v + PAGE_SIZE)}
                className="rounded-full border border-black/[0.08] bg-white px-6 py-2.5 text-[13px] font-semibold text-neutral-700 shadow-sm transition hover:bg-neutral-50"
              >
                Ver más productos ({filtered.length - visibleCount} restantes)
              </button>
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="mt-10 border-t border-black/5 bg-white px-4 py-8 text-center text-[12px] text-neutral-500">
        <div className="mx-auto flex max-w-[1600px] flex-col items-center gap-2">
          <div className="flex items-center gap-2 font-display text-base font-extrabold" style={{ color: BRAND }}>
            <Zap className="h-4 w-4" fill="currentColor" /> MAON
          </div>
          <p>Mayorista Online · Golosinas, galletitas y alfajores por bulto.</p>
          <a href={`https://wa.me/${settings.whatsappNumber}`} target="_blank" rel="noreferrer" className="mt-1 flex items-center gap-1.5 font-semibold" style={{ color: WHATSAPP }}>
            <MessageCircle className="h-4 w-4" /> Consultanos por WhatsApp
          </a>
        </div>
      </footer>

      {/* Overlay compartido para carrito y checkout */}
      <div
        className={`fixed inset-0 z-40 bg-black/45 transition-opacity duration-300 ${(showCart || showCheckout) ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => { setShowCart(false); if (!sent) setShowCheckout(false); }}
      />

      {/* Carrito (drawer) */}
      <div
        className={`fixed inset-y-0 right-0 z-50 flex h-full w-full max-w-[420px] flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${showCart ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between p-4 text-white" style={{ background: BRAND }}>
          <div className="flex items-center gap-2 font-bold"><ShoppingCart className="h-4 w-4" /> Mi carrito · {cartCount} producto{cartCount === 1 ? '' : 's'}</div>
          <button onClick={() => setShowCart(false)}><X className="h-5 w-5" /></button>
        </div>

        <div className="border-b border-black/5 p-4">
          <div className="mb-1.5 flex items-center justify-between text-[11.5px] font-medium text-neutral-500">
            <span>{faltante > 0 ? `Te faltan ${money(faltante)} para el mínimo` : '¡Llegaste a la compra mínima! 🎉'}</span>
            <span>{money(subtotal)} / {money(settings.minCompra)}</span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progreso}%`, background: faltante > 0 ? ACCENT : '#22C55E' }} />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-[11.5px] font-medium" style={{ color: envioGratis ? '#22C55E' : '#666' }}>
            <Truck className="h-3.5 w-3.5" />
            {envioGratis ? '¡Tenés envío gratis! 🎉' : `Te faltan ${money(faltanteEnvio)} para envío gratis`}
          </div>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {cartLines.length === 0 && (
            <div className="flex flex-col items-center gap-2 pt-16 text-center text-neutral-400">
              <ShoppingCart className="h-9 w-9" />
              <div className="text-sm font-medium">Todavía no agregaste productos.</div>
            </div>
          )}
          {cartLines.map((l) => (
            <div key={l.productId} className="flex items-center gap-3 rounded-xl border border-black/5 p-2.5">
              <ProdImg src={l.product.img} size={54} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-medium text-neutral-800">{l.product.name}</div>
                <div className="text-[12px] font-bold" style={{ color: BRAND }}>{money(l.unitPrice)}</div>
                <div className="mt-1 flex items-center gap-2">
                  <button onClick={() => changeQty(l.productId, -1)} className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100"><Minus className="h-3.5 w-3.5" /></button>
                  <input
                    type="number"
                    min={1}
                    value={l.qty}
                    onChange={(e) => setQty(l.productId, Number(e.target.value))}
                    className="w-8 border-0 bg-transparent text-center text-[12px] font-bold outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                  />
                  <button onClick={() => changeQty(l.productId, 1)} className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100"><Plus className="h-3.5 w-3.5" /></button>
                </div>
              </div>
              <button onClick={() => removeLine(l.productId)} className="text-neutral-300 transition hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
            </div>
          ))}
        </div>

        <div className="border-t border-black/5 p-4">
          <div className="mb-3 flex items-center justify-between text-lg font-extrabold text-neutral-800"><span>Total</span><span>{money(subtotal)}</span></div>
          <button
            disabled={cartLines.length === 0}
            onClick={() => { setShowCart(false); setShowCheckout(true); }}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3 font-bold text-white shadow-sm transition active:scale-[0.98] disabled:opacity-40"
            style={{ background: ACCENT }}
          >
            <MessageCircle className="h-4 w-4" /> Confirmar pedido por WhatsApp
          </button>
        </div>
      </div>

      {/* Checkout */}
      <div className={`fixed inset-0 z-[60] flex items-center justify-center p-4 transition-all duration-200 ${showCheckout ? 'pointer-events-auto opacity-100' : 'pointer-events-none opacity-0'}`}>
        <div
          className={`w-full max-w-[420px] rounded-3xl bg-white p-6 shadow-2xl transition-all duration-200 ${showCheckout ? 'translate-y-0 scale-100' : 'translate-y-3 scale-95'}`}
          onClick={(e) => e.stopPropagation()}
        >
          {!sent ? (
            <>
              <div className="mb-4 flex items-center justify-between">
                <div className="text-[17px] font-bold text-neutral-800">Tus datos para el pedido</div>
                <button onClick={closeCheckout}><X className="h-5 w-5 text-neutral-400" /></button>
              </div>
              <div className="space-y-2.5">
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Nombre y apellido*"
                  className="h-11 w-full rounded-xl border border-black/[0.08] bg-neutral-50 px-3.5 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: `${BRAND}55` }}
                />
                <input
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="WhatsApp / Teléfono*"
                  className="h-11 w-full rounded-xl border border-black/[0.08] bg-neutral-50 px-3.5 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2"
                  style={{ ['--tw-ring-color' as any]: `${BRAND}55` }}
                />

                <div className="text-[12.5px] font-semibold text-neutral-700">¿Querés que te enviemos el pedido?</div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, wantsShipping: true }))}
                    className="h-10 flex-1 rounded-xl border text-sm font-semibold transition"
                    style={form.wantsShipping ? { background: BRAND, borderColor: BRAND, color: '#fff' } : { borderColor: 'rgba(0,0,0,0.08)', color: '#525252' }}
                  >
                    Sí, quiero envío
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, wantsShipping: false }))}
                    className="h-10 flex-1 rounded-xl border text-sm font-semibold transition"
                    style={!form.wantsShipping ? { background: BRAND, borderColor: BRAND, color: '#fff' } : { borderColor: 'rgba(0,0,0,0.08)', color: '#525252' }}
                  >
                    No, retiro en el local
                  </button>
                </div>
                {form.wantsShipping && (
                  <>
                    <input
                      value={form.address}
                      onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                      placeholder="Dirección de entrega*"
                      className="h-11 w-full rounded-xl border border-black/[0.08] bg-neutral-50 px-3.5 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: `${BRAND}55` }}
                    />
                    <input
                      value={form.schedule}
                      onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                      placeholder="Horario disponible para recibirlo*"
                      className="h-11 w-full rounded-xl border border-black/[0.08] bg-neutral-50 px-3.5 text-sm outline-none transition focus:border-transparent focus:bg-white focus:ring-2"
                      style={{ ['--tw-ring-color' as any]: `${BRAND}55` }}
                    />
                  </>
                )}
                <div className="flex items-center gap-1.5 rounded-lg bg-neutral-50 px-3 py-2 text-[11.5px] text-neutral-500">
                  <Truck className="h-3.5 w-3.5 shrink-0" /> El pedido se despacha entre 24 y 48 hs.
                </div>
              </div>
              <div className="mt-3 max-h-[180px] space-y-1.5 overflow-y-auto rounded-xl bg-neutral-50 p-3.5 text-[12.5px] text-neutral-600">
                {cartLines.map((l) => (
                  <div key={l.productId} className="flex items-start justify-between gap-2 border-b border-black/5 pb-1.5 last:border-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="truncate font-medium text-neutral-800">{l.product.name}</div>
                      <div className="text-[11px] text-neutral-400">{l.qty} bulto{l.qty === 1 ? '' : 's'} × {money(l.unitPrice)}</div>
                    </div>
                    <span className="shrink-0 font-semibold text-neutral-800">{money(l.subtotal)}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-0.5"><span>Envío</span><span className="shrink-0 pl-2 font-semibold" style={{ color: form.wantsShipping && envioGratis ? '#22C55E' : undefined }}>{!form.wantsShipping ? 'Retira en el local' : envioGratis ? 'Gratis' : 'A coordinar'}</span></div>
                <div className="mt-1.5 flex justify-between border-t border-black/10 pt-1.5 font-bold text-black"><span>Total</span><span>{money(subtotal)}</span></div>
              </div>
              {formError && <div className="mt-2.5 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">{formError}</div>}
              <button onClick={sendOrder} className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-bold text-white shadow-sm transition active:scale-[0.98]" style={{ background: WHATSAPP }}>
                <MessageCircle className="h-4 w-4" /> Enviar pedido por WhatsApp
              </button>
            </>
          ) : (
            <div className="py-3 text-center">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `${WHATSAPP}18`, color: WHATSAPP }}>
                <MessageCircle className="h-7 w-7" />
              </div>
              <div className="text-[17px] font-bold text-neutral-800">¡Se abrió WhatsApp con tu pedido!</div>
              <p className="mx-auto mt-1.5 max-w-[280px] text-[13.5px] text-neutral-500">Solo falta que apretes enviar en WhatsApp para confirmarlo. Ya quedó registrado de nuestro lado.</p>
              <button onClick={closeCheckout} className="mt-5 w-full rounded-full bg-neutral-100 py-2.5 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-200">Seguir comprando</button>
            </div>
          )}
        </div>
      </div>

      {/* Filtros (mobile) */}
      <div
        className={`fixed inset-0 z-[70] bg-black/45 transition-opacity duration-200 md:hidden ${showFilters ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
        onClick={() => setShowFilters(false)}
      />
      <div
        className={`fixed inset-x-0 bottom-0 z-[80] max-h-[80vh] overflow-y-auto rounded-t-3xl bg-white p-4 shadow-2xl transition-transform duration-300 ease-out md:hidden ${showFilters ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <div className="mb-3 flex items-center justify-between">
          <div className="text-[15px] font-bold text-neutral-800">Filtros</div>
          <button onClick={() => setShowFilters(false)}><X className="h-5 w-5 text-neutral-400" /></button>
        </div>

        <div className="mb-2.5 text-[13px] font-bold text-neutral-800">Precio (venta)</div>
        <div className="mb-4 flex items-center gap-1.5">
          <input
            type="number" min={0} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="Desde"
            className="h-10 w-full rounded-lg border border-black/[0.08] bg-neutral-50 px-2 text-[13px] outline-none focus:border-transparent focus:ring-2"
            style={{ ['--tw-ring-color' as any]: `${BRAND}55` }}
          />
          <span className="text-neutral-300">–</span>
          <input
            type="number" min={0} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="Hasta"
            className="h-10 w-full rounded-lg border border-black/[0.08] bg-neutral-50 px-2 text-[13px] outline-none focus:border-transparent focus:ring-2"
            style={{ ['--tw-ring-color' as any]: `${BRAND}55` }}
          />
        </div>

        <div className="mb-2.5 text-[13px] font-bold text-neutral-800">Marca</div>
        {brands.length > 10 && (
          <input
            value={brandQuery} onChange={(e) => setBrandQuery(e.target.value)} placeholder="Buscar marca..."
            className="mb-2 h-10 w-full rounded-lg border border-black/[0.08] bg-neutral-50 px-2 text-[13px] outline-none focus:border-transparent focus:ring-2"
            style={{ ['--tw-ring-color' as any]: `${BRAND}55` }}
          />
        )}
        <div className="max-h-[260px] space-y-1 overflow-y-auto pr-1">
          <button
            onClick={() => setBrand('')}
            className="block w-full rounded-lg px-2 py-2 text-left text-[13px] transition hover:bg-neutral-50"
            style={!brand ? { color: BRAND, fontWeight: 700, background: BRAND_SOFT } : { color: '#666' }}
          >
            Todas las marcas
          </button>
          {brandsShown.map((b) => (
            <button
              key={b}
              onClick={() => setBrand(b)}
              className="block w-full rounded-lg px-2 py-2 text-left text-[13px] transition hover:bg-neutral-50"
              style={brand === b ? { color: BRAND, fontWeight: 700, background: BRAND_SOFT } : { color: '#666' }}
            >
              {b}
            </button>
          ))}
          {brandsShown.length === 0 && <div className="px-2 py-1.5 text-[12px] text-neutral-400">Sin resultados</div>}
        </div>

        <button
          onClick={() => setShowFilters(false)}
          className="mt-4 w-full rounded-full py-3 text-sm font-bold text-white"
          style={{ background: BRAND }}
        >
          Ver {filtered.length} producto{filtered.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  );
}

export default function TiendaPage() {
  return <TiendaInner />;
}
