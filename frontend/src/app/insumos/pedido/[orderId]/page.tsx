'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, MessageCircle, Truck, Package, Check } from 'lucide-react';
import { api } from '@/lib/api';
import { useInsumosSettingsPublic } from '@/lib/insumos-settings-store';

const BLACK = '#161513';
const ORANGE = '#E4610F';
const ORANGE_DARK = '#B94C0B';
const CREAM = '#FAFAF8';
const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

const STEPS: { key: string; label: string }[] = [
  { key: 'PAGO_PENDIENTE', label: 'Pedido recibido' },
  { key: 'COMPROBANTE_RECIBIDO', label: 'Comprobante recibido' },
  { key: 'PAGO_VERIFICADO', label: 'Pago verificado' },
  { key: 'LISTO_PARA_DESPACHAR', label: 'Listo para despachar' },
  { key: 'DESPACHADO', label: 'Despachado' },
  { key: 'EN_TRANSITO', label: 'En tránsito' },
  { key: 'ENTREGADO', label: 'Entregado' },
];

export default function InsumosOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { settings } = useInsumosSettingsPublic();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.insumosOrderPublic(orderId).then(setOrder).catch(() => {}).finally(() => setLoading(false));
  }, [orderId]);

  const stepIndex = order ? STEPS.findIndex((s) => s.key === order.status) : -1;
  const cancelled = order?.status === 'CANCELADO';

  return (
    <div style={{ background: CREAM }} className="min-h-screen font-sans">
      <header className="border-b" style={{ background: BLACK, borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="mx-auto flex h-16 max-w-[760px] items-center px-4 sm:px-8">
          <Link href="/insumos" className="font-display text-lg font-extrabold uppercase tracking-tight text-white">Ugarte</Link>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-8">
        {loading ? (
          <div className="py-20 text-center text-[13px] text-neutral-400">Cargando pedido…</div>
        ) : !order ? (
          <div className="py-20 text-center text-[13px] text-neutral-400">No encontramos ese pedido.</div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: `${ORANGE}22`, color: ORANGE_DARK }}><CheckCircle2 className="h-6 w-6" /></span>
              <h1 className="font-display text-[20px] font-extrabold text-neutral-900">¡Pedido recibido!</h1>
              <p className="text-[13px] text-neutral-500">Pedido <b>{order.orderNumber}</b></p>
            </div>

            {!cancelled && (
              <div className="rounded-sm border bg-white p-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                <div className="flex flex-wrap gap-y-3">
                  {STEPS.map((s, i) => (
                    <div key={s.key} className="flex flex-1 min-w-[100px] flex-col items-center gap-1.5 text-center">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                        style={i <= stepIndex ? { background: BLACK, color: '#fff' } : { background: '#EEE', color: '#999' }}
                      >{i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}</span>
                      <span className="text-[10px] font-semibold uppercase leading-tight text-neutral-500">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-sm border bg-white p-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Tu pedido</div>
              <div className="mt-3 space-y-1.5">
                {order.items.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between text-[13px] text-neutral-600">
                    <span>{it.quantity}× {it.name}{it.size ? ` (${it.size}m)` : ''}</span><span className="font-semibold text-neutral-900">{money(it.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t pt-3 text-[13px]" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="flex justify-between text-neutral-600"><span>Envío</span><span>{money(order.shippingCost)}</span></div>
                <div className="flex justify-between text-[15px] font-extrabold text-neutral-900"><span>Total</span><span>{money(order.total)}</span></div>
              </div>
              {order.trackingNumber && (
                <div className="mt-3 flex items-center gap-2 rounded-sm p-3 text-[12.5px]" style={{ background: '#F1EDE6' }}>
                  <Truck className="h-4 w-4 shrink-0" /> {order.carrier || 'Envío'}: <b>{order.trackingNumber}</b>
                </div>
              )}
            </div>

            {order.status === 'PAGO_PENDIENTE' && (
              <WhatsappCloseBox order={order} whatsappNumber={settings.whatsappNumber} />
            )}

            {order.status === 'COMPROBANTE_RECIBIDO' && (
              <div className="flex items-center gap-3 rounded-sm border p-5" style={{ borderColor: ORANGE, background: `${ORANGE}14` }}>
                <Package className="h-5 w-5 shrink-0" style={{ color: ORANGE_DARK }} />
                <p className="text-[13px] text-neutral-700">Ya estamos coordinando tu pedido por WhatsApp.</p>
              </div>
            )}

            {(order.status === 'PAGO_VERIFICADO' || order.status === 'LISTO_PARA_DESPACHAR') && (
              <div className="flex items-center gap-3 rounded-sm border p-5" style={{ borderColor: '#86EFAC', background: '#F0FDF4' }}>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-[13px] text-neutral-700">¡Pago verificado! Tu pedido está siendo preparado para el despacho.</p>
              </div>
            )}

            {cancelled && (
              <div className="rounded-sm border p-5 text-[13px] text-neutral-700" style={{ borderColor: '#FCA5A5', background: '#FEF2F2' }}>
                Este pedido fue cancelado. Si creés que es un error, escribinos.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function WhatsappCloseBox({ order, whatsappNumber }: { order: any; whatsappNumber: string }) {
  const text = [
    `¡Hola! Quiero cerrar mi pedido *${order.orderNumber}* de *Ugarte Insumos Carnicería*:`,
    '',
    ...order.items.map((it: any) => `${it.quantity}× ${it.name}${it.size ? ` (${it.size}m)` : ''} — ${money(it.subtotal)}`),
    '',
    `Envío: ${money(order.shippingCost)}`,
    `*Total: ${money(order.total)}*`,
  ].join('\n');
  const waLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;

  return (
    <div className="rounded-sm border bg-white p-5 text-center" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="text-[13px] font-bold text-neutral-900">Cerrá tu compra por WhatsApp</div>
      <p className="mt-1.5 text-[13px] text-neutral-500">Coordinamos ahí el pago y el envío con vos, directo.</p>
      <a
        href={waLink}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-sm text-[13px] font-bold uppercase tracking-widest text-white transition hover:opacity-90"
        style={{ background: '#25D366' }}
      >
        <MessageCircle className="h-4 w-4" /> Abrir WhatsApp
      </a>
    </div>
  );
}
