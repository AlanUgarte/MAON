'use client';

import { useMemo, useState } from 'react';
import { Search, ShoppingCart, X, Plus, Minus, Trash2, MessageCircle, Zap } from 'lucide-react';
import { PRODUCT_ROWS, type ProductRow } from '@/lib/mock';
import { useClients } from '@/lib/clients-store';
import { useChatThreads } from '@/lib/chat-store';

// ponytail: número de WhatsApp de prueba (el mismo que ya cargamos como contacto).
// Reemplazar por el WhatsApp Business real de MAON antes de compartir el link con clientes de verdad.
const NEGOCIO_WHATSAPP = '5493412708638';
const MIN_COMPRA = 50000;
const MARGEN_VENTA = 0.30; // margen por defecto para el precio público (el catálogo interno guarda costo, no precio de venta)

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
const ventaBulto = (p: ProductRow) => Math.round(p.price * (1 + MARGEN_VENTA));

interface CartLine { productId: string; qty: number }

function ProdImg({ src, size }: { src: string; size: number }) {
  const [err, setErr] = useState(false);
  if (!src || err) return <div className="flex shrink-0 items-center justify-center rounded-xl bg-[#F6F8EC] text-2xl" style={{ width: size, height: size }}>📦</div>;
  return <img src={src} onError={() => setErr(true)} alt="" className="shrink-0 rounded-xl border border-black/5 object-cover" style={{ width: size, height: size }} />;
}

export default function TiendaPage() {
  const { addClient } = useClients();
  const { appendMessage } = useChatThreads();

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [cart, setCart] = useState<CartLine[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '' });
  const [formError, setFormError] = useState('');
  const [sent, setSent] = useState(false);

  const categories = useMemo(() => [...new Set(PRODUCT_ROWS.map((p) => p.category))].sort(), []);
  const brands = useMemo(() => [...new Set(PRODUCT_ROWS.map((p) => p.brand))].sort(), []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return PRODUCT_ROWS.filter((p) =>
      (!category || p.category === category) &&
      (!brand || p.brand === brand) &&
      (!q || p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q)),
    );
  }, [search, category, brand]);

  const cartLines = cart.map((c) => {
    const p = PRODUCT_ROWS.find((x) => x.id === c.productId)!;
    return { ...c, product: p, unitPrice: ventaBulto(p), subtotal: ventaBulto(p) * c.qty };
  });
  const cartCount = cart.reduce((a, c) => a + c.qty, 0);
  const subtotal = cartLines.reduce((a, l) => a + l.subtotal, 0);
  const faltante = Math.max(0, MIN_COMPRA - subtotal);

  const addToCart = (productId: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.productId === productId);
      if (existing) return prev.map((c) => (c.productId === productId ? { ...c, qty: c.qty + 1 } : c));
      return [...prev, { productId, qty: 1 }];
    });
  };
  const changeQty = (productId: string, delta: number) => {
    setCart((prev) => prev
      .map((c) => (c.productId === productId ? { ...c, qty: c.qty + delta } : c))
      .filter((c) => c.qty > 0));
  };
  const removeLine = (productId: string) => setCart((prev) => prev.filter((c) => c.productId !== productId));

  const qtyInCart = (productId: string) => cart.find((c) => c.productId === productId)?.qty ?? 0;

  const buildOrderText = () => {
    const lines = cartLines.map((l) => `• ${l.qty}x ${l.product.name} — ${money(l.subtotal)}`).join('\n');
    return `¡Hola! Quiero hacer este pedido en *MAON - Mayorista Online*:\n\n${lines}\n\nTotal: ${money(subtotal)}\n\nNombre: ${form.name}\nTeléfono: ${form.phone}`;
  };

  const sendOrder = () => {
    if (!form.name.trim() || !form.phone.trim()) return setFormError('Nombre y teléfono son obligatorios');
    if (subtotal < MIN_COMPRA) return setFormError(`La compra mínima es ${money(MIN_COMPRA)}`);
    setFormError('');

    // Registra el pedido en el CRM: crea/asocia el cliente y deja el pedido como si hubiese llegado por WhatsApp
    const [firstName, ...rest] = form.name.trim().split(' ');
    const client = addClient({
      firstName, lastName: rest.join(' '), phone: form.phone.trim(),
      city: '', province: '', stage: 'NUEVO_LEAD', product: cartLines[0]?.product.name ?? '',
      source: 'WHATSAPP', leadScore: 40, intent: 'ALTA', sentiment: 'NEUTRO', tags: [],
      lastInboundAt: new Date().toISOString(), unread: 1, summary: 'Pedido armado desde la tienda online.',
      objection: 'NINGUNA', seller: '-', ivaCondition: 'CONSUMIDOR_FINAL',
    });

    Promise.resolve(client).then((c) => {
      appendMessage(c, { content: buildOrderText(), direction: 'ENTRANTE' as any, author: 'CLIENTE' as any });
    });

    const waLink = `https://wa.me/${NEGOCIO_WHATSAPP}?text=${encodeURIComponent(buildOrderText())}`;
    window.open(waLink, '_blank');

    setSent(true);
  };

  const closeCheckout = () => { setShowCheckout(false); if (sent) { setCart([]); setForm({ name: '', phone: '' }); setSent(false); } };

  return (
    <div className="min-h-screen bg-[#F7F8F3]">
      {/* Barra superior */}
      <div className="flex items-center justify-center bg-[#56682B] px-4 py-1.5 text-center text-[11px] font-semibold text-white">
        COMPRA MÍNIMA {money(MIN_COMPRA)}
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-black/5 bg-white px-4 py-3">
        <div className="mx-auto flex max-w-6xl items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#56682B] text-white"><Zap className="h-5 w-5" fill="currentColor" /></div>
            <span className="font-display text-lg font-extrabold text-[#56682B]">MAON</span>
          </div>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="¿Qué estás buscando?"
              className="h-10 w-full rounded-lg border border-black/10 bg-neutral-50 pl-9 pr-3 text-sm outline-none focus:border-[#56682B]/50"
            />
          </div>
          <button onClick={() => setShowCart(true)} className="relative flex h-10 items-center gap-2 rounded-lg bg-[#56682B] px-4 text-sm font-bold text-white">
            <ShoppingCart className="h-4 w-4" /> {money(subtotal)}
            {cartCount > 0 && <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#E08A2B] text-[10px] font-bold">{cartCount}</span>}
          </button>
        </div>
        {/* Categorías */}
        <div className="mx-auto mt-3 flex max-w-6xl flex-wrap gap-1.5">
          <button onClick={() => setCategory('')} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${!category ? 'bg-[#56682B] text-white' : 'bg-neutral-100 text-neutral-600'}`}>Todas</button>
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c!)} className={`rounded-full px-3 py-1 text-[12px] font-semibold ${category === c ? 'bg-[#56682B] text-white' : 'bg-neutral-100 text-neutral-600'}`}>{c}</button>
          ))}
        </div>
      </header>

      {/* Body */}
      <main className="mx-auto flex max-w-6xl gap-6 p-4">
        <aside className="hidden w-[200px] shrink-0 md:block">
          <div className="rounded-xl border border-black/5 bg-white p-4">
            <div className="mb-2 text-[13px] font-bold">Marca</div>
            <div className="space-y-1.5">
              <button onClick={() => setBrand('')} className={`block text-[13px] ${!brand ? 'font-bold text-[#56682B]' : 'text-neutral-600'}`}>Todas</button>
              {brands.map((b) => (
                <button key={b} onClick={() => setBrand(b)} className={`block text-[13px] ${brand === b ? 'font-bold text-[#56682B]' : 'text-neutral-600'}`}>{b}</button>
              ))}
            </div>
          </div>
        </aside>

        <section className="flex-1">
          <div className="mb-3 text-[13px] text-neutral-500">{filtered.length} productos</div>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {filtered.map((p) => {
              const inCart = qtyInCart(p.id);
              return (
                <div key={p.id} className="rounded-xl border border-black/5 bg-white p-3">
                  <ProdImg src={p.img} size={110} />
                  <div className="mt-2 text-[10px] font-semibold uppercase text-neutral-400">{p.brand}</div>
                  <div className="line-clamp-2 text-[13px] font-medium leading-tight">{p.name}</div>
                  <div className="mt-1.5 text-[15px] font-extrabold text-[#56682B]">{money(ventaBulto(p))}</div>
                  <div className="text-[10px] text-neutral-400">bulto x {p.units || '-'} u.</div>
                  {inCart === 0 ? (
                    <button onClick={() => addToCart(p.id)} className="mt-2 w-full rounded-lg bg-[#E08A2B] py-2 text-[12px] font-bold text-white">Agregar</button>
                  ) : (
                    <div className="mt-2 flex items-center justify-between rounded-lg border border-[#E08A2B]/40 bg-[#E08A2B]/10 px-1 py-1">
                      <button onClick={() => changeQty(p.id, -1)} className="flex h-6 w-6 items-center justify-center rounded-md text-[#E08A2B]"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="text-[13px] font-bold">{inCart}</span>
                      <button onClick={() => changeQty(p.id, 1)} className="flex h-6 w-6 items-center justify-center rounded-md text-[#E08A2B]"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      </main>

      {/* Carrito (drawer) */}
      {showCart && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/40" onClick={() => setShowCart(false)}>
          <div className="flex h-full w-full max-w-[420px] flex-col bg-white" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-black/5 bg-[#56682B] p-4 text-white">
              <div className="flex items-center gap-2 font-bold"><ShoppingCart className="h-4 w-4" /> Mi carrito · {cartCount} producto{cartCount === 1 ? '' : 's'}</div>
              <button onClick={() => setShowCart(false)}><X className="h-5 w-5" /></button>
            </div>

            {faltante > 0 && (
              <div className="border-b border-black/5 bg-[#FBF4E6] p-3 text-[12px] text-[#8a5a12]">
                Te faltan {money(faltante)} para completar la compra mínima ({money(MIN_COMPRA)}).
              </div>
            )}

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {cartLines.length === 0 && <div className="pt-10 text-center text-sm text-neutral-400">Todavía no agregaste productos.</div>}
              {cartLines.map((l) => (
                <div key={l.productId} className="flex items-center gap-3 border-b border-black/5 pb-3">
                  <ProdImg src={l.product.img} size={52} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-medium">{l.product.name}</div>
                    <div className="text-[12px] font-bold text-[#56682B]">{money(l.unitPrice)}</div>
                    <div className="mt-1 flex items-center gap-2">
                      <button onClick={() => changeQty(l.productId, -1)} className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="text-[12px] font-bold">{l.qty}</span>
                      <button onClick={() => changeQty(l.productId, 1)} className="flex h-6 w-6 items-center justify-center rounded-md bg-neutral-100"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <button onClick={() => removeLine(l.productId)} className="text-neutral-400 hover:text-rose-500"><Trash2 className="h-4 w-4" /></button>
                </div>
              ))}
            </div>

            <div className="border-t border-black/5 p-4">
              <div className="mb-3 flex items-center justify-between text-lg font-extrabold"><span>Total</span><span>{money(subtotal)}</span></div>
              <button
                disabled={cartLines.length === 0}
                onClick={() => { setShowCart(false); setShowCheckout(true); }}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#E08A2B] py-3 font-bold text-white disabled:opacity-40"
              >
                <MessageCircle className="h-4 w-4" /> Confirmar pedido por WhatsApp
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={closeCheckout}>
          <div className="w-full max-w-[420px] rounded-2xl bg-white p-5" onClick={(e) => e.stopPropagation()}>
            {!sent ? (
              <>
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-base font-bold">Tus datos para el pedido</div>
                  <button onClick={closeCheckout}><X className="h-5 w-5" /></button>
                </div>
                <div className="space-y-2">
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre y apellido*" className="h-10 w-full rounded-lg border border-black/10 px-3 text-sm outline-none focus:border-[#56682B]/50" />
                  <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="WhatsApp / Teléfono*" className="h-10 w-full rounded-lg border border-black/10 px-3 text-sm outline-none focus:border-[#56682B]/50" />
                </div>
                <div className="mt-3 rounded-lg bg-neutral-50 p-3 text-[12px] text-neutral-600">
                  {cartLines.map((l) => <div key={l.productId} className="flex justify-between"><span>{l.qty}x {l.product.name}</span><span>{money(l.subtotal)}</span></div>)}
                  <div className="mt-1.5 flex justify-between border-t border-black/10 pt-1.5 font-bold text-black"><span>Total</span><span>{money(subtotal)}</span></div>
                </div>
                {formError && <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-600">{formError}</div>}
                <button onClick={sendOrder} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#25D366] py-3 font-bold text-white">
                  <MessageCircle className="h-4 w-4" /> Enviar pedido por WhatsApp
                </button>
              </>
            ) : (
              <div className="py-4 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]"><MessageCircle className="h-6 w-6" /></div>
                <div className="text-base font-bold">¡Se abrió WhatsApp con tu pedido!</div>
                <p className="mt-1 text-[13px] text-neutral-500">Solo falta que apretes enviar en WhatsApp para confirmarlo. Ya quedó registrado.</p>
                <button onClick={closeCheckout} className="mt-4 w-full rounded-lg bg-neutral-100 py-2.5 text-sm font-semibold">Seguir comprando</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
