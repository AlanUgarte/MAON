'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Clock, ShoppingBag, MessageCircle, ArrowRight } from 'lucide-react';
import { BG, CARD, CARD_BORDER, ACCENT, ACCENT_SOFT, NEON, TEXT, MUTED, money, isWithinSchedule } from './_lib';
import { useDarkStoreShell } from './_useShell';
import { DARK_STORE_CATEGORIES } from '@/lib/dark-store-catalog';
import { Header } from './_components/Header';
import { MobileNav } from './_components/MobileNav';
import { ProductCard } from './_components/ProductCard';

const CATEGORY_META: Record<string, { emoji: string; blurb: string }> = {
  Bebidas: { emoji: '🥤', blurb: 'Gaseosas, aguas, energizantes' },
  Snacks: { emoji: '🍟', blurb: 'Papas, palitos, maní' },
  Chocolates: { emoji: '🍫', blurb: 'Tabletas, bombones, alfajores' },
  Vapeadores: { emoji: '💨', blurb: 'Vapes y accesorios' },
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
      <Header settings={settings} cartCount={cart.count} cartTotal={cartTotal} />

      {!open && (
        <div className="px-4 py-2.5 text-center text-[12.5px] font-semibold" style={{ background: ACCENT_SOFT, color: NEON }}>
          {settings.storeOpen
            ? `Cerrado ahora — tomamos pedidos de ${settings.scheduleStart} a ${settings.scheduleEnd} hs`
            : 'Cerrado por mantenimiento — volvemos pronto'}
        </div>
      )}

      {/* Hero */}
      <div className="mx-auto max-w-[1400px] px-4 pt-5">
        <div
          className="relative overflow-hidden rounded-3xl p-6 sm:p-10"
          style={{ background: `radial-gradient(circle at 85% 20%, ${ACCENT} 0%, transparent 45%), radial-gradient(circle at 10% 90%, ${NEON}22 0%, transparent 40%), ${BG}` }}
        >
          <div className="relative z-10 max-w-lg">
            <div className="mb-3 flex items-center gap-2 text-[11px] font-bold" style={{ color: NEON }}>
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: NEON }} />
              {open ? 'Estamos abiertos' : 'Cerrado ahora'} · Entregamos hasta las {settings.scheduleEnd} hs
            </div>
            <h1 className="text-3xl font-extrabold leading-tight sm:text-4xl">
              Tu noche, resuelta en <span style={{ color: ACCENT }}>minutos</span>.
            </h1>
            <p className="mt-3 text-[14px]" style={{ color: MUTED }}>
              Snacks, bebidas y antojos directo a tu puerta.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                onClick={() => router.push('/dark-store/categoria/bebidas')}
                className="flex items-center gap-2 rounded-full px-5 py-3 text-[14px] font-bold"
                style={{ background: ACCENT, color: TEXT }}
              >
                Ver productos <ArrowRight className="h-4 w-4" />
              </button>
              <span className="flex items-center gap-1.5 rounded-full px-4 py-2 text-[12.5px] font-bold" style={{ background: '#0D1017', border: `1px solid ${CARD_BORDER}`, color: NEON }}>
                <Zap className="h-3.5 w-3.5" /> Entrega estimada: hasta {settings.deliveryEtaMinutes} min
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Categorías */}
      <div className="mx-auto max-w-[1400px] px-4 pt-8">
        <h2 className="mb-3 text-[15px] font-extrabold">Categorías</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {DARK_STORE_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => router.push(`/dark-store/categoria/${c.toLowerCase()}`)}
              className="group relative overflow-hidden rounded-2xl p-4 text-left"
              style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}
            >
              <div className="text-3xl">{CATEGORY_META[c]?.emoji}</div>
              <div className="mt-2 text-[14px] font-extrabold">{c}</div>
              <div className="text-[11px]" style={{ color: MUTED }}>{counts.get(c) ?? 0} productos</div>
              <ArrowRight className="absolute bottom-4 right-4 h-4 w-4 opacity-0 transition group-hover:opacity-100" style={{ color: ACCENT }} />
            </button>
          ))}
        </div>
      </div>

      {/* Lo más pedido */}
      {destacados.length > 0 && (
        <div className="mx-auto max-w-[1400px] px-4 pt-8">
          <h2 className="mb-3 text-[15px] font-extrabold">Lo más pedido esta noche 🔥</h2>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {destacados.map((item) => (
              <ProductCard
                key={`${item.kind}:${item.id}`}
                item={item}
                qty={cart.qtyOf(item.kind, item.id)}
                lowStockThreshold={settings.lowStockThreshold}
                onAdd={() => cart.add(item.kind, item.id, 1)}
                onChangeQty={(d) => cart.add(item.kind, item.id, d)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Promo banner */}
      <div className="mx-auto max-w-[1400px] px-4 pt-8">
        <div className="flex flex-col items-start gap-4 rounded-3xl p-6 sm:flex-row sm:items-center sm:justify-between" style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wide" style={{ color: ACCENT }}>Antojos nocturnos</div>
            <div className="text-xl font-extrabold" style={{ color: NEON }}>Promo exclusiva</div>
            <div className="text-[12.5px]" style={{ color: MUTED }}>Todos los días de {settings.scheduleStart} a {settings.scheduleEnd} hs</div>
          </div>
          <button onClick={() => router.push('/dark-store/categoria/bebidas')} className="rounded-full px-5 py-2.5 text-[13px] font-bold" style={{ background: ACCENT, color: TEXT }}>
            Ver promociones
          </button>
        </div>
      </div>

      {/* Trust row */}
      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-3 px-4 py-10 sm:grid-cols-3">
        {[
          { icon: Clock, title: 'Entrega rápida', body: `Hasta ${settings.deliveryEtaMinutes} minutos en tu zona` },
          { icon: ShoppingBag, title: 'Sin mínimos', body: 'Pedí lo que quieras, sin mínimo de compra' },
          { icon: MessageCircle, title: 'Atención por WhatsApp', body: 'Te ayudamos en todo lo que necesites' },
        ].map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-center gap-3 rounded-2xl p-4" style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: ACCENT_SOFT }}>
              <Icon className="h-5 w-5" style={{ color: ACCENT }} />
            </span>
            <div>
              <div className="text-[13px] font-bold">{title}</div>
              <div className="text-[11.5px]" style={{ color: MUTED }}>{body}</div>
            </div>
          </div>
        ))}
      </div>

      {loading && <div className="px-4 pb-8 text-center text-[12px]" style={{ color: MUTED }}>Cargando catálogo…</div>}

      <MobileNav cartCount={cart.count} />
    </div>
  );
}
