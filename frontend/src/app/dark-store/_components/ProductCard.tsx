'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Minus } from 'lucide-react';
import { CARD, CARD_BORDER, ACCENT, NEON, ROSE, TEXT, MUTED, money } from '../_lib';
import type { DarkStoreItem } from '@/lib/dark-store-catalog';

export function ProductCard({
  item, qty, lowStockThreshold, onAdd, onChangeQty,
}: {
  item: DarkStoreItem; qty: number; lowStockThreshold: number;
  onAdd: () => void; onChangeQty: (delta: number) => void;
}) {
  const router = useRouter();
  const [imgErr, setImgErr] = useState(false);
  const [imgLoaded, setImgLoaded] = useState(false);
  const outOfStock = item.stock <= 0;
  const lowStock = !outOfStock && item.stock <= lowStockThreshold;
  const hasFlavors = item.flavors.length > 1;
  const goToDetail = () => router.push(`/dark-store/producto/${item.kind === 'vape' ? 'v' : 'p'}-${item.id}`);

  return (
    <motion.div
      layout
      whileHover={{ y: -3 }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
      className="flex flex-col rounded-2xl p-3"
      style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}
    >
      <button
        onClick={goToDetail}
        className="relative flex aspect-square items-center justify-center overflow-hidden rounded-xl"
        style={{ background: '#0D1017' }}
      >
        {item.featured && (
          <span className="absolute left-2 top-2 z-10 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ background: NEON, color: '#0A0A0A' }}>
            Destacado
          </span>
        )}
        {lowStock && (
          <span className="absolute right-2 top-2 z-10 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide" style={{ background: ROSE, color: TEXT }}>
            Últimas unidades
          </span>
        )}
        {item.img && !imgErr ? (
          <motion.img
            src={item.img}
            alt=""
            loading="lazy"
            onError={() => setImgErr(true)}
            onLoad={() => setImgLoaded(true)}
            initial={{ opacity: 0 }}
            animate={{ opacity: imgLoaded ? 1 : 0 }}
            transition={{ duration: 0.25 }}
            className="h-full w-full object-cover"
          />
        ) : (
          <span className="text-4xl">📦</span>
        )}
      </button>

      <div className="mt-2.5 text-[10px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>{item.brand}</div>
      <button onClick={goToDetail} className="line-clamp-2 min-h-[36px] text-left text-[13px] font-medium leading-tight" style={{ color: TEXT }}>
        {item.name}
      </button>

      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-[16px] font-extrabold" style={{ color: TEXT }}>{money(item.price)}</span>
        {outOfStock ? (
          <span className="rounded-full px-2.5 py-1.5 text-[11px] font-bold" style={{ color: MUTED }}>Sin stock</span>
        ) : (
          <AnimatePresence mode="wait" initial={false}>
            {qty > 0 ? (
              <motion.div
                key="stepper"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                className="flex items-center gap-1.5 rounded-full px-1 py-1"
                style={{ background: '#0D1017' }}
              >
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => onChangeQty(-1)} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ color: TEXT }}><Minus className="h-3.5 w-3.5" /></motion.button>
                <motion.span key={qty} initial={{ scale: 1.3 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }} className="w-4 text-center text-[13px] font-bold" style={{ color: TEXT }}>{qty}</motion.span>
                <motion.button whileTap={{ scale: 0.85 }} onClick={() => onChangeQty(1)} className="flex h-7 w-7 items-center justify-center rounded-full" style={{ background: ACCENT, color: TEXT }}><Plus className="h-3.5 w-3.5" /></motion.button>
              </motion.div>
            ) : hasFlavors ? (
              <motion.button
                key="flavor"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                whileTap={{ scale: 0.92 }}
                onClick={goToDetail}
                className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                style={{ background: ACCENT, color: TEXT }}
              >
                Elegir sabor
              </motion.button>
            ) : (
              <motion.button
                key="add"
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85 }}
                whileTap={{ scale: 0.9 }}
                onClick={onAdd}
                className="rounded-full px-3 py-1.5 text-[12px] font-bold"
                style={{ background: ACCENT, color: TEXT }}
              >
                Agregar
              </motion.button>
            )}
          </AnimatePresence>
        )}
      </div>
    </motion.div>
  );
}
