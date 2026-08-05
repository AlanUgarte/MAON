'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ShoppingCart, Zap, Clock, MapPin } from 'lucide-react';
import { BG_SOFT, CARD_BORDER, ACCENT, NEON, TEXT, MUTED, money, isWithinSchedule } from '../_lib';
import type { DarkStoreSettings } from '@/lib/dark-store-settings-store';
import { DARK_STORE_CATEGORIES } from '@/lib/dark-store-catalog';

export function Header({
  settings, cartCount, cartTotal, defaultSearch = '',
}: {
  settings: DarkStoreSettings; cartCount: number; cartTotal: number; defaultSearch?: string;
}) {
  const router = useRouter();
  const [q, setQ] = useState(defaultSearch);
  const open = settings.storeOpen && isWithinSchedule(settings.scheduleStart, settings.scheduleEnd);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (q.trim()) router.push(`/dark-store/buscar?q=${encodeURIComponent(q.trim())}`);
  };

  return (
    <header className="sticky top-0 z-40" style={{ background: BG_SOFT, borderBottom: `1px solid ${CARD_BORDER}` }}>
      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-3 px-4 py-3">
        <button onClick={() => router.push('/dark-store')} className="flex items-center gap-2 shrink-0">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl" style={{ background: ACCENT }}>
            <Zap className="h-5 w-5" style={{ color: TEXT }} fill={TEXT} />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-[15px] font-extrabold tracking-tight" style={{ color: TEXT }}>MAON</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: MUTED }}>Dark Store</span>
          </span>
        </button>

        <form onSubmit={submitSearch} className="order-3 w-full sm:order-none sm:w-auto sm:flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: MUTED }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar productos (papas, coca, chocolate...)"
              className="h-11 w-full rounded-full border pl-10 pr-4 text-sm outline-none"
              style={{ background: '#0D1017', borderColor: CARD_BORDER, color: TEXT }}
            />
          </div>
        </form>

        <div className="ml-auto hidden items-center gap-3 text-[11px] md:flex" style={{ color: MUTED }}>
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Envío a: <span style={{ color: TEXT }}>Rosario Centro</span></span>
        </div>

        <button
          onClick={() => router.push('/dark-store/carrito')}
          className="ml-auto flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold sm:ml-0"
          style={{ background: ACCENT, color: TEXT }}
        >
          <ShoppingCart className="h-4 w-4" />
          {money(cartTotal)}
          {cartCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-extrabold" style={{ background: NEON, color: '#0A0A0A' }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-1.5 px-4 pb-3">
        {DARK_STORE_CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => router.push(`/dark-store/categoria/${c.toLowerCase()}`)}
            className="rounded-full px-3 py-1.5 text-[12px] font-semibold"
            style={{ background: '#0D1017', border: `1px solid ${CARD_BORDER}`, color: TEXT }}
          >
            {c}
          </button>
        ))}
        <span className="ml-auto flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold" style={{ color: open ? NEON : MUTED }}>
          <span className="h-1.5 w-1.5 rounded-full" style={{ background: open ? NEON : MUTED }} />
          {open ? 'Estamos abiertos' : 'Cerrado ahora'}
        </span>
        <span className="hidden items-center gap-1.5 text-[11px] sm:flex" style={{ color: MUTED }}>
          <Clock className="h-3.5 w-3.5" /> {settings.scheduleStart} a {settings.scheduleEnd} hs
        </span>
        <span className="hidden items-center gap-1.5 text-[11px] sm:flex" style={{ color: NEON }}>
          <Zap className="h-3.5 w-3.5" /> Hasta {settings.deliveryEtaMinutes} min
        </span>
      </div>
    </header>
  );
}
