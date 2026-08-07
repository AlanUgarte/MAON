'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ShoppingCart, Zap, Clock, MapPin, ChevronDown, History } from 'lucide-react';
import { BG_SOFT, CARD, CARD_BORDER, ACCENT, ACCENT_SOFT, NEON, TEXT, MUTED, money, isWithinSchedule, addSearchHistory, getSearchHistory, clearSearchHistory, getRecentProducts } from '../_lib';
import type { DarkStoreSettings } from '@/lib/dark-store-settings-store';
import { DARK_STORE_CATEGORIES, VISIBLE_CATEGORIES, type DarkStoreItem } from '@/lib/dark-store-catalog';
import { linesOf } from '@/lib/dark-store-lines';

export function Header({
  settings, cartCount, cartTotal, defaultSearch = '', items = [],
}: {
  settings: DarkStoreSettings; cartCount: number; cartTotal: number; defaultSearch?: string;
  /** Catálogo cargado: de acá salen las líneas de cada categoría para el desplegable. */
  items?: DarkStoreItem[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = useState(defaultSearch);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const open = settings.storeOpen && isWithinSchedule(settings.scheduleStart, settings.scheduleEnd);

  // Autocomplete del buscador: sugerencias en vivo mientras se tipea, historial y
  // "vistos recientemente" cuando el campo está vacío — todo local (localStorage), no
  // hace falta backend para esto.
  const [searchOpen, setSearchOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [recent, setRecent] = useState<ReturnType<typeof getRecentProducts>>([]);
  const searchRef = useRef<HTMLFormElement>(null);

  const refreshHistoryAndRecent = () => {
    setHistory(getSearchHistory());
    setRecent(getRecentProducts());
  };

  const tokens = useMemo(() => q.trim().toLowerCase().split(/\s+/).filter(Boolean), [q]);
  const suggestions = useMemo(() => {
    if (!tokens.length) return [];
    return items
      .filter((i) => i.stock > 0 && tokens.every((t) => `${i.name} ${i.brand} ${i.category}`.toLowerCase().includes(t)))
      .slice(0, 6);
  }, [items, tokens]);

  useEffect(() => {
    if (!searchOpen) return;
    const onDown = (e: MouseEvent) => {
      if (!searchRef.current?.contains(e.target as Node)) setSearchOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [searchOpen]);

  const goToProduct = (i: DarkStoreItem) => {
    setSearchOpen(false);
    router.push(`/dark-store/producto/${i.kind === 'vape' ? 'v' : 'p'}-${i.id}`);
  };

  // Una sola pasada por el catálogo para todas las categorías (son 12k productos).
  const linesByCategory = useMemo(() => {
    const m: Record<string, ReturnType<typeof linesOf>> = {};
    for (const c of DARK_STORE_CATEGORIES) m[c] = linesOf(items, c);
    return m;
  }, [items]);

  // Cerrar el desplegable al clickear afuera o con Escape.
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!navRef.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpenMenu(null); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey); };
  }, [openMenu]);

  const goToLine = (category: string, slug?: string) => {
    setOpenMenu(null);
    const base = `/dark-store/categoria/${category.toLowerCase()}`;
    router.push(slug ? `${base}?linea=${slug}` : base);
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    addSearchHistory(q);
    setSearchOpen(false);
    router.push(`/dark-store/buscar?q=${encodeURIComponent(q.trim())}`);
  };

  const searchHistoryChip = (h: string) => {
    setQ(h);
    addSearchHistory(h);
    setSearchOpen(false);
    router.push(`/dark-store/buscar?q=${encodeURIComponent(h)}`);
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

        <form ref={searchRef} onSubmit={submitSearch} className="relative order-3 w-full sm:order-none sm:w-auto sm:flex-1">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: MUTED }} />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => { refreshHistoryAndRecent(); setSearchOpen(true); }}
              placeholder="Buscar productos (papas, coca, chocolate...)"
              className="h-11 w-full rounded-full border pl-10 pr-4 text-sm outline-none"
              style={{ background: '#0D1017', borderColor: CARD_BORDER, color: TEXT }}
            />
          </div>

          <AnimatePresence>
            {searchOpen && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute top-full z-50 mt-2 max-h-[70vh] w-full overflow-y-auto rounded-2xl py-2 shadow-2xl sm:w-[420px]"
                style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}
              >
                {tokens.length > 0 ? (
                  suggestions.length > 0 ? (
                    <>
                      {suggestions.map((i) => (
                        <button
                          key={`${i.kind}:${i.id}`}
                          onClick={() => goToProduct(i)}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition hover:brightness-125"
                          style={{ color: TEXT }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_SOFT)}
                          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                        >
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: '#0D1017' }}>
                            {i.img ? <img src={i.img} alt="" className="h-full w-full object-cover" /> : <span className="text-base">📦</span>}
                          </div>
                          <span className="min-w-0 flex-1 truncate text-[12.5px]">{i.name}</span>
                          <span className="shrink-0 text-[11.5px] font-bold" style={{ color: MUTED }}>{money(i.price)}</span>
                        </button>
                      ))}
                      <div className="my-1 h-px" style={{ background: CARD_BORDER }} />
                      <button onClick={submitSearch} className="flex w-full items-center px-3.5 py-2 text-left text-[12.5px] font-bold" style={{ color: NEON }}>
                        Ver todos los resultados para "{q.trim()}"
                      </button>
                    </>
                  ) : (
                    <div className="px-3.5 py-3 text-[12.5px]" style={{ color: MUTED }}>Sin resultados para "{q.trim()}".</div>
                  )
                ) : (
                  <>
                    {history.length > 0 && (
                      <div className="px-3.5 pb-1 pt-1">
                        <div className="mb-1.5 flex items-center justify-between">
                          <span className="text-[10.5px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Búsquedas recientes</span>
                          <button onClick={() => { clearSearchHistory(); setHistory([]); }} className="text-[10.5px] font-semibold" style={{ color: MUTED }}>Borrar</button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {history.map((h) => (
                            <button
                              key={h}
                              onClick={() => searchHistoryChip(h)}
                              className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11.5px]"
                              style={{ background: '#0D1017', color: TEXT }}
                            >
                              <History className="h-3 w-3" style={{ color: MUTED }} /> {h}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    {recent.length > 0 && (
                      <>
                        {history.length > 0 && <div className="my-1.5 h-px" style={{ background: CARD_BORDER }} />}
                        <div className="px-3.5 pb-1 pt-1 text-[10.5px] font-bold uppercase tracking-wide" style={{ color: MUTED }}>Vistos recientemente</div>
                        {recent.slice(0, 5).map((r) => (
                          <button
                            key={`${r.kind}:${r.id}`}
                            onClick={() => goToProduct({ ...r } as DarkStoreItem)}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left transition hover:brightness-125"
                            style={{ color: TEXT }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_SOFT)}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg" style={{ background: '#0D1017' }}>
                              {r.img ? <img src={r.img} alt="" className="h-full w-full object-cover" /> : <span className="text-base">📦</span>}
                            </div>
                            <span className="min-w-0 flex-1 truncate text-[12.5px]">{r.name}</span>
                            <span className="shrink-0 text-[11.5px] font-bold" style={{ color: MUTED }}>{money(r.price)}</span>
                          </button>
                        ))}
                      </>
                    )}
                    {!history.length && !recent.length && (
                      <div className="px-3.5 py-3 text-[12.5px]" style={{ color: MUTED }}>Buscá papitas, coca, chocolate…</div>
                    )}
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <div className="ml-auto hidden items-center gap-3 text-[11px] md:flex" style={{ color: MUTED }}>
          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> Envío a: <span style={{ color: TEXT }}>Rosario Centro</span></span>
        </div>

        <motion.button
          onClick={() => router.push('/dark-store/carrito')}
          whileTap={{ scale: 0.94 }}
          className="ml-auto flex h-11 items-center gap-2 rounded-full px-4 text-sm font-bold sm:ml-0"
          style={{ background: ACCENT, color: TEXT }}
        >
          <ShoppingCart className="h-4 w-4" />
          <motion.span key={cartTotal} initial={{ opacity: 0.4 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>{money(cartTotal)}</motion.span>
          <AnimatePresence>
            {cartCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 500, damping: 20 }}
                className="flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-extrabold"
                style={{ background: NEON, color: '#0A0A0A' }}
              >
                <motion.span key={cartCount} initial={{ scale: 1.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 20 }}>{cartCount}</motion.span>
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <div className="border-t" style={{ borderColor: CARD_BORDER }} />
      <div ref={navRef} className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-1 px-4">
        {VISIBLE_CATEGORIES.map((c, i) => {
          const active = pathname === `/dark-store/categoria/${c.toLowerCase()}`;
          const lines = linesByCategory[c] ?? [];
          const isOpen = openMenu === c;
          // Las últimas categorías están cerca del borde derecho: si el panel se abre hacia
          // la derecha se sale de la pantalla en mobile, así que esas se alinean al revés.
          const alignRight = i >= VISIBLE_CATEGORIES.length / 2;
          return (
            <div
              key={c}
              className="relative"
              onMouseEnter={() => lines.length > 0 && setOpenMenu(c)}
              onMouseLeave={() => setOpenMenu(null)}
            >
              <button
                onClick={() => (lines.length > 0 ? setOpenMenu(isOpen ? null : c) : goToLine(c))}
                className="relative flex items-center gap-1 px-3 py-2.5 text-[12.5px] font-semibold transition-colors"
                style={{ color: active || isOpen ? TEXT : MUTED }}
              >
                {c}
                {lines.length > 0 && (
                  <ChevronDown className="h-3 w-3 transition-transform" style={{ transform: isOpen ? 'rotate(180deg)' : undefined }} />
                )}
                {(active || isOpen) && (
                  <motion.span
                    layoutId="dark-store-nav-underline"
                    className="absolute -bottom-px left-0 right-0 h-[2px]"
                    style={{ background: ACCENT }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>

              {isOpen && lines.length > 0 && (
                <div
                  className={`absolute top-full z-50 max-h-[70vh] w-60 max-w-[calc(100vw-2rem)] overflow-y-auto rounded-2xl py-1.5 shadow-2xl ${alignRight ? 'right-0' : 'left-0'}`}
                  style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}
                >
                  <button
                    onClick={() => goToLine(c)}
                    className="flex w-full items-center justify-between px-3.5 py-2 text-left text-[12.5px] font-bold"
                    style={{ color: NEON }}
                  >
                    Ver todo {c}
                    <span style={{ color: MUTED }}>{lines.reduce((a, l) => a + l.count, 0)}</span>
                  </button>
                  <div className="my-1 h-px" style={{ background: CARD_BORDER }} />
                  {lines.map((l) => (
                    <button
                      key={l.slug}
                      onClick={() => goToLine(c, l.slug)}
                      className="flex w-full items-center justify-between gap-2 px-3.5 py-2 text-left text-[12.5px] transition hover:brightness-125"
                      style={{ color: TEXT }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = ACCENT_SOFT)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span className="truncate">{l.label}</span>
                      <span className="shrink-0 text-[11px]" style={{ color: MUTED }}>{l.count}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          );
        })}
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
