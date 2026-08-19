'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, User as UserIcon, MessageCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useInsumosProductsPublic } from '@/lib/insumos-products-store';
import { useInsumosCart } from '@/lib/insumos-cart';
import { useInsumosSettingsPublic } from '@/lib/insumos-settings-store';

const BLACK = '#161513';
const CREAM = '#FAFAF8';
const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos',
  'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 'Neuquén', 'Río Negro',
  'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 'Santiago del Estero',
  'Tierra del Fuego', 'Tucumán',
];

const INPUT = 'h-11 w-full rounded-sm border px-3.5 text-[13.5px]';
const INPUT_STYLE = { borderColor: 'rgba(0,0,0,0.15)' };

export default function InsumosCheckoutPage() {
  const router = useRouter();
  const { products } = useInsumosProductsPublic();
  const cart = useInsumosCart();
  const { settings } = useInsumosSettingsPublic();

  const lines = cart.lines
    .map((l) => ({ ...l, product: products.find((p) => p.id === l.productId) }))
    .filter((l) => l.product);
  const subtotal = lines.reduce((a, l) => a + (l.product!.price * l.quantity), 0);
  const shippingCost = settings.shippingFlatCost;
  const total = subtotal + shippingCost;

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '', docNumber: '',
    province: '', city: '', postalCode: '', street: '', streetNumber: '', floorApt: '', shippingNotes: '',
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const buildWhatsappText = (orderNumber: string) => {
    const itemLines = lines.map((l) => `${l.quantity}× ${l.product!.name} (${l.size}m) — ${money(l.product!.price * l.quantity)}`).join('\n');
    return `¡Hola! Quiero cerrar mi pedido *${orderNumber}* de *Ugarte Insumos Carnicería*:\n\n${itemLines}\n\nEnvío: ${shippingCost > 0 ? money(shippingCost) : 'gratis'}\n*Total: ${money(total)}*\n\nNombre: ${form.firstName} ${form.lastName}\nDirección: ${form.street} ${form.streetNumber}, ${form.city}, ${form.province}`;
  };

  const submit = async () => {
    setError('');
    const required: (keyof typeof form)[] = ['firstName', 'lastName', 'email', 'phone', 'province', 'city', 'postalCode', 'street', 'streetNumber'];
    for (const k of required) if (!form[k].trim()) return setError('Completá todos los campos obligatorios.');
    if (!lines.length) return setError('Tu carrito está vacío.');

    setSending(true);
    try {
      const res = await api.createInsumosOrder({
        ...form,
        items: lines.map((l) => ({ productId: l.productId, quantity: l.quantity, size: l.size })),
      });
      cart.clear();
      const waLink = `https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(buildWhatsappText(res.orderNumber))}`;
      window.open(waLink, '_blank');
      router.push(`/insumos/pedido/${res.id}`);
    } catch (err: any) {
      setSending(false);
      setError(err?.message || 'No pudimos registrar el pedido. Probá de nuevo.');
    }
  };

  return (
    <div style={{ background: CREAM }} className="min-h-screen font-sans">
      <header className="border-b" style={{ background: BLACK, borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="mx-auto flex h-16 max-w-[900px] items-center gap-4 px-4 sm:px-8">
          <Link href="/insumos/carrito" className="text-white/70 transition hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
          <span className="font-display text-lg font-extrabold uppercase tracking-tight text-white">Ugarte</span>
          <span className="ml-2 text-[13px] text-white/50">Checkout</span>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-4 py-10 sm:px-8">
        {!lines.length ? (
          <div className="rounded-sm border border-dashed py-16 text-center text-[13px] text-neutral-500" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
            Tu carrito está vacío. <Link href="/insumos" className="font-bold underline" style={{ color: '#B94C0B' }}>Ver el producto →</Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[1fr_320px]">
            <div className="space-y-6">
              <section className="rounded-sm border bg-white p-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-neutral-500"><UserIcon className="h-4 w-4" /> Tus datos</div>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <input value={form.firstName} onChange={set('firstName')} placeholder="Nombre*" className={INPUT} style={INPUT_STYLE} />
                  <input value={form.lastName} onChange={set('lastName')} placeholder="Apellido*" className={INPUT} style={INPUT_STYLE} />
                  <input value={form.email} onChange={set('email')} type="email" placeholder="Email*" className={INPUT} style={INPUT_STYLE} />
                  <input value={form.phone} onChange={set('phone')} placeholder="Teléfono*" className={INPUT} style={INPUT_STYLE} />
                  <input value={form.docNumber} onChange={set('docNumber')} placeholder="DNI/CUIT (opcional)" className={`${INPUT} sm:col-span-2`} style={INPUT_STYLE} />
                </div>
              </section>

              <section className="rounded-sm border bg-white p-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-neutral-500"><MapPin className="h-4 w-4" /> Dirección de entrega</div>
                <div className="mt-3 grid gap-2.5 sm:grid-cols-2">
                  <select value={form.province} onChange={set('province')} className={INPUT} style={{ ...INPUT_STYLE, color: form.province ? '#111' : '#9CA3AF' }}>
                    <option value="">Provincia*</option>
                    {PROVINCIAS.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <input value={form.city} onChange={set('city')} placeholder="Ciudad*" className={INPUT} style={INPUT_STYLE} />
                  <input value={form.postalCode} onChange={set('postalCode')} placeholder="Código postal*" className={INPUT} style={INPUT_STYLE} />
                  <div />
                  <input value={form.street} onChange={set('street')} placeholder="Calle*" className={INPUT} style={INPUT_STYLE} />
                  <input value={form.streetNumber} onChange={set('streetNumber')} placeholder="Número*" className={INPUT} style={INPUT_STYLE} />
                  <input value={form.floorApt} onChange={set('floorApt')} placeholder="Piso/depto (opcional)" className={INPUT} style={INPUT_STYLE} />
                  <input value={form.shippingNotes} onChange={set('shippingNotes')} placeholder="Datos adicionales para la entrega (opcional)" className={`${INPUT} sm:col-span-2`} style={INPUT_STYLE} />
                </div>
              </section>

              <section className="rounded-sm border bg-white p-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                <div className="flex items-center gap-2 text-[12px] font-bold uppercase tracking-widest text-neutral-500"><MessageCircle className="h-4 w-4" /> Cómo se cierra la compra</div>
                <div className="mt-3 rounded-sm p-3.5 text-[13px]" style={{ background: '#F1EDE6' }}>
                  El pedido queda registrado acá y se abre WhatsApp con el resumen para coordinar el pago y el envío directo con nosotros.
                </div>
              </section>
            </div>

            <div className="h-fit space-y-4">
              <div className="rounded-sm border bg-white p-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Tu pedido</div>
                <div className="mt-3 space-y-2">
                  {lines.map((l) => (
                    <div key={`${l.productId}::${l.size}`} className="flex justify-between text-[12.5px] text-neutral-600">
                      <span className="truncate pr-2">{l.quantity}× {l.product!.name} ({l.size}m)</span>
                      <span className="shrink-0 font-semibold text-neutral-900">{money(l.product!.price * l.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-1.5 border-t pt-3 text-[13px]" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <div className="flex justify-between text-neutral-600"><span>Subtotal</span><span>{money(subtotal)}</span></div>
                  <div className="flex justify-between text-neutral-600"><span>Envío</span><span>{shippingCost > 0 ? money(shippingCost) : 'Gratis'}</span></div>
                  <div className="flex justify-between border-t pt-2 text-[15px] font-extrabold text-neutral-900" style={{ borderColor: 'rgba(0,0,0,0.06)' }}><span>Total</span><span>{money(total)}</span></div>
                </div>
              </div>

              {error && <div className="rounded-sm border px-3.5 py-2.5 text-[13px] font-semibold" style={{ borderColor: '#FCA5A5', background: '#FEF2F2', color: '#B91C1C' }}>{error}</div>}

              <button
                onClick={submit}
                disabled={sending}
                className="flex h-12 w-full items-center justify-center rounded-sm text-[13px] font-bold uppercase tracking-widest text-white transition hover:opacity-90 disabled:opacity-60"
                style={{ background: BLACK }}
              >
                {sending ? 'Confirmando…' : 'Confirmar pedido'}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
