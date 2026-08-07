'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
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

  const hasFlavors = !!item && item.flavors.length > 1;
  const [flavor, setFlavor] = useState(item?.flavors[0]);
  const selectedFlavor = hasFlavors ? (flavor ?? item?.flavors[0]) : undefined;

  const qty = item ? cart.qtyOf(item.kind, item.id, selectedFlavor) : 0;
  const outOfStock = !item || item.stock <= 0;
  const lowStock = item && !outOfStock && item.stock <= settings.lowStockThreshold;

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: BG, color: TEXT }}>
      <Header settings={settings} items={items} cartCount={cart.count} cartTotal={cartTotal} />

      <div className="mx-auto max-w-[1000px] px-4 py-5">
        <button onClick={() => router.back()} className="mb-4 flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: MUTED }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </button>

        {!item ? (
          <div className="py-16 text-center" style={{ color: MUTED }}>No encontramos este producto.</div>
        ) : (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid gap-6 sm:grid-cols-2">
            <div className="relative flex aspect-square items-center justify-center overflow-hidden rounded-3xl" style={{ background: CARD }}>
              {lowStock && (
                <span className="absolute right-3 top-3 z-10 rounded-md px-2 py-1 text-[10px] font-bold uppercase tracking-wide" style={{ background: ROSE, color: TEXT }}>
                  Últimas unidades
                </span>
              )}
              {item.img && !imgErr ? (
                <motion.img
                  key={item.img}
                  initial={{ opacity: 0, scale: 1.04 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.35 }}
                  src={item.img}
                  alt=""
                  onError={() => setImgErr(true)}
                  className="h-full w-full object-cover"
                />
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

              {hasFlavors && (
                <label className="mt-4 block">
                  <span className="mb-1 block text-[11.5px] font-semibold" style={{ color: MUTED }}>Sabor</span>
                  <select
                    value={selectedFlavor}
                    onChange={(e) => setFlavor(e.target.value)}
                    className="h-11 w-full rounded-xl border px-3 text-[13.5px] outline-none"
                    style={{ background: '#0D1017', borderColor: CARD_BORDER, color: TEXT }}
                  >
                    {item.flavors.map((f) => <option key={f} value={f}>{f}</option>)}
                  </select>
                </label>
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
                ) : (
                  <AnimatePresence mode="wait" initial={false}>
                    {qty > 0 ? (
                      <motion.div
                        key="stepper"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                        className="flex items-center justify-between gap-2 rounded-full p-1.5"
                        style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}
                      >
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => cart.add(item.kind, item.id, -1, selectedFlavor)} className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: '#0D1017', color: TEXT }}>
                          <Minus className="h-4 w-4" />
                        </motion.button>
                        <motion.span key={qty} initial={{ scale: 1.25 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }} className="text-[16px] font-extrabold">{qty} en el carrito</motion.span>
                        <motion.button whileTap={{ scale: 0.9 }} onClick={() => cart.add(item.kind, item.id, 1, selectedFlavor)} className="flex h-11 w-11 items-center justify-center rounded-full" style={{ background: ACCENT, color: TEXT }}>
                          <Plus className="h-4 w-4" />
                        </motion.button>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="add"
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => cart.add(item.kind, item.id, 1, selectedFlavor)}
                        className="w-full rounded-full py-3.5 text-[14px] font-bold"
                        style={{ background: ACCENT, color: TEXT }}
                      >
                        Agregar al carrito
                      </motion.button>
                    )}
                  </AnimatePresence>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <MobileNav cartCount={cart.count} />
    </div>
  );
}
