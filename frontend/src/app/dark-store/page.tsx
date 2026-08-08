'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight, Truck } from 'lucide-react';
import { BG, CARD, CARD_BORDER, ACCENT, ACCENT_SOFT, NEON, TEXT, MUTED, money, isWithinSchedule } from './_lib';
import { useDarkStoreShell } from './_useShell';
import { VISIBLE_CATEGORIES } from '@/lib/dark-store-catalog';
import { Header } from './_components/Header';
import { MobileNav } from './_components/MobileNav';
import { ProductCard } from './_components/ProductCard';

const CATEGORY_META: Record<string, { img: string; blurb: string }> = {
  Bebidas: { img: '/dark-store/cat-bebidas.webp', blurb: 'Gaseosas, aguas, energizantes' },
  Snacks: { img: '/dark-store/cat-snacks.webp', blurb: 'Papas, palitos, maní' },
  Chocolates: { img: '/dark-store/cat-chocolates.webp', blurb: 'Tabletas, bombones, alfajores' },
  Vapeadores: { img: '/dark-store/cat-vapeadores.webp', blurb: 'Vapes y accesorios' },
};

// Variants compartidos para los grids con scroll-reveal (categorías, destacados) —
// una sola vez por sección (viewport once:true), no se re-dispara al volver a scrollear.
const STAGGER = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const FADE_UP = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 28 } },
};

export default function DarkStoreHome() {
  const router = useRouter();
  const { settings, items, loading, cart, cartLines, cartTotal } = useDarkStoreShell();
  const open = settings.storeOpen && isWithinSchedule(settings.scheduleStart, settings.scheduleEnd);

  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (const it of items) m.set(it.category, (m.get(it.category) ?? 0) + 1);
    return m;
  }, [items]);

  const destacados = useMemo(
    () => items.filter((i) => i.stock > 0).sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0)).slice(0, 10),
    [items],
  );

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: BG, color: TEXT }}>
      <Header settings={settings} items={items} cartCount={cart.count} cartTotal={cartTotal} />

      {!open && (
        <div className="px-4 py-2.5 text-center text-[12.5px] font-semibold" style={{ background: ACCENT_SOFT, color: NEON }}>
          {settings.storeOpen
            ? `Cerrado ahora — tomamos pedidos de ${settings.scheduleStart} a ${settings.scheduleEnd} hs`
            : 'Cerrado por mantenimiento — volvemos pronto'}
        </div>
      )}

      {/* Hero */}
      <div className="mx-auto max-w-[1400px] px-4 pt-5">
        <motion.button
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          whileTap={{ scale: 0.99 }}
          onClick={() => router.push('/dark-store/categoria/bebidas')}
          className="block w-full overflow-hidden rounded-3xl"
          style={{ background: CARD }}
        >
          {/* aspect-ratio fijo: sin esto la sección desaparece (altura 0) mientras la imagen
              carga o si tarda en una red lenta — se veía "roto" hasta que terminaba de bajar. */}
          <img
            src="/dark-store/hero-night.webp"
            alt="Tu noche, resuelta en minutos"
            className="w-full"
            style={{ aspectRatio: '2 / 1', objectFit: 'cover' }}
            width={1600}
            height={800}
            loading="eager"
            fetchPriority="high"
          />
        </motion.button>
      </div>

      {/* Categorías */}
      <div className="mx-auto max-w-[1400px] px-4 pt-8">
        <h2 className="mb-3 text-[15px] font-extrabold">Categorías</h2>
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          variants={STAGGER}
          className="grid grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {VISIBLE_CATEGORIES.map((c) => (
            <motion.button
              key={c}
              variants={FADE_UP}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => router.push(`/dark-store/categoria/${c.toLowerCase()}`)}
              className="group relative aspect-[16/10] overflow-hidden rounded-2xl text-left"
              style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}
            >
              <img
                src={CATEGORY_META[c]?.img}
                alt=""
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              {/* Scrim: sin esto el texto blanco se pierde sobre las zonas claras de la foto */}
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(8,10,15,0.92) 0%, rgba(8,10,15,0.55) 45%, rgba(8,10,15,0.15) 100%)' }} />
              <div className="absolute inset-x-0 bottom-0 p-4">
                <div className="text-[15px] font-extrabold drop-shadow" style={{ color: '#FFFFFF' }}>{c}</div>
                <div className="text-[11px]" style={{ color: 'rgba(255,255,255,0.72)' }}>{counts.get(c) ?? 0} productos</div>
              </div>
              <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 opacity-0 transition group-hover:opacity-100" style={{ color: ACCENT }} />
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Lo más pedido — mientras carga el catálogo se ve un skeleton en vez de un hueco
          vacío (antes no había nada acá hasta que terminaba de bajar, se veía "roto"). */}
      {loading && !destacados.length ? (
        <div className="mx-auto max-w-[1400px] px-4 pt-8">
          <h2 className="mb-3 text-[15px] font-extrabold">Lo más pedido esta noche 🔥</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl p-3" style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}>
                <div className="aspect-square rounded-xl" style={{ background: '#0D1017' }} />
                <div className="mt-2.5 h-2 w-1/3 rounded" style={{ background: '#0D1017' }} />
                <div className="mt-2 h-3 w-4/5 rounded" style={{ background: '#0D1017' }} />
                <div className="mt-2.5 h-4 w-1/2 rounded" style={{ background: '#0D1017' }} />
              </div>
            ))}
          </div>
        </div>
      ) : destacados.length > 0 && (
        <div className="mx-auto max-w-[1400px] px-4 pt-8">
          <h2 className="mb-3 text-[15px] font-extrabold">Lo más pedido esta noche 🔥</h2>
          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.1 }}
            variants={STAGGER}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
          >
            {destacados.map((item) => (
              <motion.div key={`${item.kind}:${item.id}`} variants={FADE_UP}>
                <ProductCard
                  item={item}
                  qty={cart.qtyOf(item.kind, item.id)}
                  lowStockThreshold={settings.lowStockThreshold}
                  onAdd={() => cart.add(item.kind, item.id, 1)}
                  onChangeQty={(d) => cart.add(item.kind, item.id, d)}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Promo banner — ya trae adentro los 3 puntos de confianza (entrega, sin mínimos, WhatsApp), no se repiten aparte */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="mx-auto max-w-[1400px] px-4 py-8"
      >
        <button onClick={() => router.push('/dark-store/categoria/bebidas')} className="block w-full overflow-hidden rounded-3xl" style={{ background: CARD }}>
          <img
            src="/dark-store/promo-neon.webp"
            alt="MAON Dark Store — pedidos rápidos, entregamos en minutos"
            className="w-full"
            style={{ aspectRatio: '2 / 1', objectFit: 'cover' }}
            width={1440}
            height={720}
            loading="lazy"
          />
        </button>
      </motion.div>

      {/* Zona de entrega */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="mx-auto max-w-[1400px] px-4 pb-10"
      >
        <div className="overflow-hidden rounded-3xl" style={{ border: `1px solid ${CARD_BORDER}` }}>
          <img
            src="/dark-store/zona-entrega.webp"
            alt="Zona de entrega — hasta 20 minutos en moto"
            className="w-full"
            style={{ aspectRatio: '1.5 / 1', objectFit: 'cover', background: CARD }}
            width={1400}
            height={933}
            loading="lazy"
          />
          <div className="p-6" style={{ background: CARD }}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="text-[12.5px]" style={{ color: MUTED }}>Despachamos a estos barrios de Rosario:</p>
              <span className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-bold" style={{ background: ACCENT_SOFT, color: NEON }}>
                <Truck className="h-3.5 w-3.5" /> Envío {money(settings.deliveryFee)} fijo
              </span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {settings.deliveryBarrios.map((b) => (
                <span key={b} className="rounded-full px-3 py-1.5 text-[12px] font-medium" style={{ background: '#0D1017', border: `1px solid ${CARD_BORDER}`, color: TEXT }}>
                  {b}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {loading && <div className="px-4 pb-8 text-center text-[12px]" style={{ color: MUTED }}>Cargando catálogo…</div>}

      <MobileNav cartCount={cart.count} />
    </div>
  );
}
