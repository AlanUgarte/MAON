'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { CheckCircle2, MessageCircle } from 'lucide-react';
import { BG, CARD, CARD_BORDER, ACCENT, NEON, TEXT, MUTED, money, loadOrderSummary } from '../../_lib';
import { useDarkStoreShell } from '../../_useShell';
import { Header } from '../../_components/Header';

export default function DarkStoreConfirmationPage() {
  const params = useParams<{ saleId: string }>();
  const router = useRouter();
  const { settings, items, cart, cartTotal } = useDarkStoreShell();
  const [numero, setNumero] = useState('');

  useEffect(() => {
    setNumero(new URLSearchParams(window.location.search).get('numero') || '');
  }, []);

  const sendWhatsapp = () => {
    const order = loadOrderSummary();
    const staffLink = `${window.location.origin}/dark-store-config?pedido=${params.saleId}`;

    // Con el detalle del pedido guardado en sessionStorage (el carrito ya se vació al
    // confirmar) se arma el mensaje completo — así no hay que retipear nada a mano.
    const text = order
      ? [
          `Hola! Quiero confirmar mi pedido de MAON Dark Store.`,
          ``,
          `Pedido: ${numero || order.numero}`,
          `Cliente: ${order.customerName}`,
          `Entrega: ${order.address}${order.barrio ? ` (${order.barrio})` : ''}`,
          ``,
          ...order.lines.map((l) => `${l.qty}x ${l.name} — ${money(l.unitPrice * l.qty)}`),
          ``,
          `Subtotal: ${money(order.subtotal)}`,
          `Envío: ${money(order.deliveryFee)}`,
          `Total: ${money(order.total)}`,
          ``,
          `Pago: Efectivo o Transferencia (alias ${settings.paymentAlias}).`,
          `Si transfiero, mando el comprobante por acá.`,
          ``,
          `(Staff: ${staffLink})`,
        ].join('\n')
      : `Hola! Quiero confirmar mi pedido de MAON Dark Store.\n\nPedido: ${numero || params.saleId}\n\nYa quedó registrado — ¿me confirman disponibilidad y el tiempo de entrega?\n\nPago: Efectivo o Transferencia (alias ${settings.paymentAlias}). Si transfiero, mando el comprobante por acá.\n\n(Staff: ${staffLink})`;

    window.open(`https://wa.me/${settings.whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="min-h-screen" style={{ background: BG, color: TEXT }}>
      <Header settings={settings} items={items} cartCount={cart.count} cartTotal={cartTotal} />

      <div className="mx-auto max-w-[560px] px-4 py-12 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full" style={{ background: 'rgba(198,255,60,0.15)' }}>
          <CheckCircle2 className="h-9 w-9" style={{ color: NEON }} />
        </div>
        <h1 className="text-2xl font-extrabold">¡Pedido registrado!</h1>
        {numero && <div className="mt-1 text-[13px]" style={{ color: MUTED }}>Pedido #{numero}</div>}
        <p className="mt-3 text-[13.5px]" style={{ color: MUTED }}>
          Ahora confirmalo por WhatsApp para que arranquemos con la entrega — hasta {settings.deliveryEtaMinutes} minutos en tu zona.
        </p>

        <div className="mt-6 rounded-2xl p-5" style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}>
          <button
            onClick={sendWhatsapp}
            className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-bold"
            style={{ background: '#25D366', color: '#08150C' }}
          >
            <MessageCircle className="h-4.5 w-4.5" /> Enviar pedido por WhatsApp
          </button>
          <button onClick={() => router.push('/dark-store')} className="mt-3 w-full rounded-full py-3 text-[13px] font-semibold" style={{ color: MUTED }}>
            Volver a la tienda
          </button>
        </div>
      </div>
    </div>
  );
}
