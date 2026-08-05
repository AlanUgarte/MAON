'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BG, CARD, CARD_BORDER, ACCENT, ACCENT_SOFT, NEON, ROSE, TEXT, MUTED, money, isWithinSchedule } from '../_lib';
import { useDarkStoreShell } from '../_useShell';
import { Header } from '../_components/Header';
import { api } from '@/lib/api';

const OTRO_BARRIO = 'Otro (fuera de zona)';

function Field({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11.5px] font-semibold" style={{ color: MUTED }}>{label}</span>
      <input
        {...props}
        className="h-11 w-full rounded-xl border px-3 text-[13.5px] outline-none"
        style={{ background: '#0D1017', borderColor: CARD_BORDER, color: TEXT }}
      />
    </label>
  );
}

export default function DarkStoreCheckoutPage() {
  const router = useRouter();
  const { settings, cart, cartLines, cartTotal } = useDarkStoreShell();
  const open = settings.storeOpen && isWithinSchedule(settings.scheduleStart, settings.scheduleEnd);

  const [form, setForm] = useState({
    nombre: '', apellido: '', telefono: '', direccion: '', numero: '', piso: '', depto: '',
    barrio: '', referencias: '', observaciones: '',
  });
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  const fueraDeZona = form.barrio === OTRO_BARRIO;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!open) return setError('Estamos cerrados en este momento — no podemos confirmar el pedido ahora.');
    if (!form.barrio) return setError('Elegí tu barrio para validar la zona de entrega.');
    if (fueraDeZona) return setError('Por el momento no llegamos a esta dirección.');
    if (!form.nombre.trim() || !form.apellido.trim() || !form.telefono.trim() || !form.direccion.trim() || !form.numero.trim()) {
      return setError('Completá nombre, apellido, teléfono y dirección.');
    }
    const sinStock = cartLines.find((l) => l.qty > l.item.stock);
    if (sinStock) return setError(`"${sinStock.item.name}" ya no tiene stock suficiente — ajustá la cantidad en el carrito.`);
    if (!cartLines.length) return setError('Tu carrito está vacío.');

    setError('');
    setSending(true);
    try {
      const direccionCompleta = [
        `${form.direccion} ${form.numero}`.trim(),
        form.piso && `Piso ${form.piso}`,
        form.depto && `Depto ${form.depto}`,
        form.referencias && `Ref: ${form.referencias}`,
        form.observaciones && `Obs: ${form.observaciones}`,
      ].filter(Boolean).join(' · ');

      const res = await api.salesStorefront({
        customerName: `${form.nombre.trim()} ${form.apellido.trim()}`.trim(),
        customerPhone: form.telefono.trim(),
        items: cartLines.filter((l) => l.kind === 'product').map((l) => ({ sku: l.id, quantity: l.qty })),
        vapeItems: cartLines.filter((l) => l.kind === 'vape').map((l) => ({ vapeId: l.id, quantity: l.qty })),
        wantsShipping: true,
        shippingAddress: direccionCompleta,
        barrio: form.barrio,
        enforceStock: true,
        issueTicket: true,
      });
      if (!res.ok || !res.saleId) throw new Error(res.reason || 'No se pudo registrar el pedido');
      cart.clear();
      const numero = res.comprobanteNumero ? `?numero=${encodeURIComponent(res.comprobanteNumero)}` : '';
      router.push(`/dark-store/confirmacion/${res.saleId}${numero}`);
    } catch (err: any) {
      setError(err?.message || 'No se pudo registrar el pedido. Probá de nuevo.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: BG, color: TEXT }}>
      <Header settings={settings} cartCount={cart.count} cartTotal={cartTotal} />

      <div className="mx-auto max-w-[700px] px-4 py-5">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: MUTED }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Volver al carrito
        </button>

        <h1 className="mb-1 text-2xl font-extrabold">Confirmá tu pedido</h1>
        <div className="mb-5 text-[12.5px]" style={{ color: MUTED }}>No hace falta crear una cuenta.</div>

        {!open && (
          <div className="mb-4 rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold" style={{ background: ACCENT_SOFT, color: NEON }}>
            Estamos cerrados. Tomamos pedidos de {settings.scheduleStart} a {settings.scheduleEnd} hs.
          </div>
        )}

        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Nombre*" value={form.nombre} onChange={set('nombre')} required />
            <Field label="Apellido*" value={form.apellido} onChange={set('apellido')} required />
          </div>
          <Field label="WhatsApp / Teléfono*" value={form.telefono} onChange={set('telefono')} required />

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2"><Field label="Dirección exacta*" value={form.direccion} onChange={set('direccion')} required /></div>
            <Field label="Número*" value={form.numero} onChange={set('numero')} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Piso" value={form.piso} onChange={set('piso')} />
            <Field label="Depto" value={form.depto} onChange={set('depto')} />
          </div>

          <label className="block">
            <span className="mb-1 block text-[11.5px] font-semibold" style={{ color: MUTED }}>Barrio*</span>
            <select
              value={form.barrio}
              onChange={(e) => setForm((f) => ({ ...f, barrio: e.target.value }))}
              required
              className="h-11 w-full rounded-xl border px-3 text-[13.5px] outline-none"
              style={{ background: '#0D1017', borderColor: CARD_BORDER, color: TEXT }}
            >
              <option value="">Elegí tu barrio</option>
              {settings.deliveryBarrios.map((b) => <option key={b} value={b}>{b}</option>)}
              <option value={OTRO_BARRIO}>{OTRO_BARRIO}</option>
            </select>
          </label>

          {form.barrio && (
            fueraDeZona ? (
              <div className="rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold" style={{ background: 'rgba(244,63,94,0.12)', color: '#F87171' }}>
                Por el momento no llegamos a esta dirección.
              </div>
            ) : (
              <div className="rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold" style={{ background: ACCENT_SOFT, color: NEON }}>
                ¡Llegamos a tu dirección! Entrega estimada: hasta {settings.deliveryEtaMinutes} minutos.
              </div>
            )
          )}

          <Field label="Referencias (ej: casa con rejas negras)" value={form.referencias} onChange={set('referencias')} />
          <Field label="Observaciones (ej: llamar al llegar)" value={form.observaciones} onChange={set('observaciones')} />

          <div className="rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}>
            <div className="mb-2 text-[12.5px] font-bold">Resumen</div>
            <div className="space-y-1 text-[12px]" style={{ color: MUTED }}>
              {cartLines.map((l) => (
                <div key={`${l.kind}:${l.id}`} className="flex justify-between">
                  <span>{l.qty} × {l.item.name}</span>
                  <span>{money(l.item.price * l.qty)}</span>
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between border-t pt-2 text-[14px] font-extrabold" style={{ borderColor: CARD_BORDER, color: TEXT }}>
              <span>Total</span><span>{money(cartTotal)}</span>
            </div>
          </div>

          {error && (
            <div className="rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold" style={{ background: 'rgba(244,63,94,0.12)', color: '#F87171' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={sending || fueraDeZona || !open}
            className="w-full rounded-full py-3.5 text-[14px] font-bold disabled:opacity-40"
            style={{ background: ACCENT, color: TEXT }}
          >
            {sending ? 'Enviando…' : 'Confirmar pedido'}
          </button>
        </form>
      </div>
    </div>
  );
}
