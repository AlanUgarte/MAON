'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingCart, Zap } from 'lucide-react';
import { BG, CARD, CARD_BORDER, ACCENT, ACCENT_SOFT, NEON, TEXT, MUTED, money, isWithinSchedule, lineName } from '../_lib';
import { useDarkStoreShell } from '../_useShell';
import { Header } from '../_components/Header';
import { MobileNav } from '../_components/MobileNav';

export default function DarkStoreCartPage() {
  const router = useRouter();
  const { settings, items, cart, cartLines, cartTotal } = useDarkStoreShell();
  const open = settings.storeOpen && isWithinSchedule(settings.scheduleStart, settings.scheduleEnd);

  const belowMin = settings.minOrderAmount > 0 && cartTotal < settings.minOrderAmount;
  const aboveMax = !!settings.maxOrderAmount && cartTotal > settings.maxOrderAmount;
  const canContinue = open && cartLines.length > 0 && !belowMin && !aboveMax;

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: BG, color: TEXT }}>
      <Header settings={settings} items={items} cartCount={cart.count} cartTotal={cartTotal} />

      <div className="mx-auto max-w-[800px] px-4 py-5">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: MUTED }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Seguir comprando
        </button>

        <h1 className="mb-4 text-2xl font-extrabold">Tu carrito</h1>

        {!open && (
          <div className="mb-4 rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold" style={{ background: ACCENT_SOFT, color: NEON }}>
            Estamos cerrados en este momento — podés armar el pedido, pero se confirma cuando abramos ({settings.scheduleStart} a {settings.scheduleEnd} hs).
          </div>
        )}

        {!cartLines.length ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border py-20 text-center" style={{ borderColor: CARD_BORDER, color: MUTED }}>
            <ShoppingCart className="h-9 w-9" />
            Todavía no agregaste nada.
            <button onClick={() => router.push('/dark-store')} className="mt-1 rounded-full px-4 py-2 text-[12.5px] font-bold" style={{ background: ACCENT, color: TEXT }}>
              Ver productos
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2.5">
              {cartLines.map((l) => (
                <div key={`${l.kind}:${l.id}:${l.flavor ?? ''}`} className="flex items-center gap-3 rounded-2xl p-3" style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}>
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl" style={{ background: '#0D1017' }}>
                    {l.item.img ? <img src={l.item.img} alt="" className="h-full w-full object-cover" /> : <span className="text-2xl">📦</span>}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13px] font-semibold">{lineName(l)}</div>
                    <div className="text-[11.5px]" style={{ color: MUTED }}>{money(l.item.price)} c/u</div>
                    <div className="mt-1 flex items-center gap-2">
                      <button onClick={() => cart.add(l.kind, l.id, -1, l.flavor)} className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: '#0D1017' }}><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-4 text-center text-[12.5px] font-bold">{l.qty}</span>
                      <button onClick={() => cart.add(l.kind, l.id, 1, l.flavor)} className="flex h-6 w-6 items-center justify-center rounded-md" style={{ background: ACCENT }}><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className="text-[13px] font-bold">{money(l.item.price * l.qty)}</span>
                    <button onClick={() => cart.remove(l.kind, l.id, l.flavor)} style={{ color: MUTED }}><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-5 space-y-2 rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}>
              <div className="flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: NEON }}>
                <Zap className="h-3.5 w-3.5" /> Entrega en hasta {settings.deliveryEtaMinutes} minutos.
              </div>
              <div className="text-[11.5px]" style={{ color: MUTED }}>Revisaremos la disponibilidad final por WhatsApp.</div>
            </div>

            {belowMin && (
              <div className="mt-3 rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold" style={{ background: 'rgba(244,63,94,0.12)', color: '#F87171' }}>
                Faltan {money(settings.minOrderAmount - cartTotal)} para llegar al mínimo de {money(settings.minOrderAmount)}.
              </div>
            )}
            {aboveMax && (
              <div className="mt-3 rounded-xl px-3.5 py-2.5 text-[12.5px] font-semibold" style={{ background: 'rgba(244,63,94,0.12)', color: '#F87171' }}>
                El pedido supera el máximo de {money(settings.maxOrderAmount!)} — sacá algún producto para continuar.
              </div>
            )}

            <div className="mt-5 space-y-1.5 text-[13px]" style={{ color: MUTED }}>
              <div className="flex items-center justify-between"><span>Subtotal</span><span>{money(cartTotal)}</span></div>
              <div className="flex items-center justify-between"><span>Envío</span><span>{money(settings.deliveryFee)}</span></div>
            </div>
            <div className="mt-2 flex items-center justify-between text-lg font-extrabold" style={{ color: TEXT }}>
              <span>Total</span>
              <span>{money(cartTotal + settings.deliveryFee)}</span>
            </div>

            <button
              onClick={() => router.push('/dark-store/checkout')}
              disabled={!canContinue}
              className="mt-4 w-full rounded-full py-3.5 text-[14px] font-bold disabled:opacity-40"
              style={{ background: ACCENT, color: TEXT }}
            >
              Continuar con el pedido
            </button>
          </>
        )}
      </div>

      <MobileNav cartCount={cart.count} />
    </div>
  );
}
