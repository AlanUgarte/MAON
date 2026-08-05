'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Plus, Minus } from 'lucide-react';
import { BG, CARD, CARD_BORDER, ACCENT, NEON, ROSE, TEXT, MUTED, money } from '../../_lib';
import { useDarkStoreShell } from '../../_useShell';
import { Header } from '../../_components/Header';
import { MobileNav } from '../../_components/MobileNav';

export default function DarkStoreProductPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { settings, items, cart, cartTotal } = useDarkStoreShell();
  const [imgErr, setImgErr] = useState(false);

  // Los ids de tarjeta vienen como "p-<sku>" (producto del maestro) o "v-<id>" (vapeador).
  const kind = params.id.startsWith('v-') ? 'vape' : 'product';
  const rawId = params.id.slice(2);
  const item = items.find((i) => i.kind === kind && i.id === rawId);

  const qty = item ? cart.qtyOf(item.kind, item.id) : 0;
  const outOfStock = !item || item.stock <= 0;
  const lowStock = item && !outOfStock && item.stock <= settings.lowStockThreshold;

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: BG, color: TEXT }}>
      <Header settings={settings} cartCount={cart.count} cartTotal={cartTotal} />

      <div className="mx-auto max-w-[1000px] px-4 py-5">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: MUTED }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </button>

        {!item ? (
          <div className="py-16 text-center" style={{ color: MUTED }}>No encontramos este producto.</div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl" style={{ background: CARD }}>
              {lowStock && (
                <span className="absolute right-3 top-3 z-10 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ background: ROSE, color: TEXT }}>
                  Últimas unidades
                </span>
              )}
              {item.img && !imgErr ? (
                <img src={item.img} alt="" onError={() => setImgErr(true)} className="h-full w-full object-cover" />
              ) : (
                <span className="text-7xl">📦</span>
              )}
            </div>

            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>{item.brand}</div>
              <h1 className="mt-1 text-2xl font-extrabold leading-tight">{item.name}</h1>
              <div className="mt-1 text-[12px]" style={{ color: MUTED }}>{item.category}</div>

              {item.category === 'Vapeadores' && (
                <div className="mt-4 rounded-xl px-3 py-2 text-[11.5px]" style={{ background: '#0D1017', border: `1px solid ${CARD_BORDER}`, color: MUTED }}>
                  Venta exclusiva para mayores de 18 años.
                </div>
              )}

              <div className="mt-5 text-3xl font-extrabold">{money(item.price)}</div>
              <div className="mt-1 flex items-center gap-1.5 text-[12px]" style={{ color: outOfStock ? ROSE : NEON }}>
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: outOfStock ? ROSE : NEON }} />
                {outOfStock ? 'Sin stock' : 'Disponible'}
              </div>

              <div className="mt-6">
                {outOfStock ? (
                  <button disabled className="w-full rounded-full py-3.5 text-[14px] font-bold" style={{ background: CARD, color: MUTED }}>
                    Sin stock
                  </button>
                ) : qty > 0 ? (
                  <div className="flex items-center justify-between gap-2 rounded-full p-1.5" style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}>
                    <button onClick={() => cart.add(item.kind, item.id, -1)} className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: '#0D1017', color: TEXT }}>
                      <Minus className="h-4 w-4" />
                    </button>
                    <span className="text-[16px] font-extrabold">{qty} en el carrito</span>
                    <button onClick={() => cart.add(item.kind, item.id, 1)} className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: ACCENT, color: TEXT }}>
                      <Plus className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => cart.add(item.kind, item.id, 1)} className="w-full rounded-full py-3.5 text-[14px] font-bold" style={{ background: ACCENT, color: TEXT }}>
                    Agregar al carrito
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <MobileNav cartCount={cart.count} />
    </div>
  );
}
