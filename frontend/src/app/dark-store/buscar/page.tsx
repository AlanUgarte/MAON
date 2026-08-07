'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Search as SearchIcon, History } from 'lucide-react';
import { BG, CARD, CARD_BORDER, MUTED, TEXT, getSearchHistory, clearSearchHistory, getRecentProducts, addSearchHistory, type RecentProduct } from '../_lib';
import { useDarkStoreShell } from '../_useShell';
import { Header } from '../_components/Header';
import { MobileNav } from '../_components/MobileNav';
import { ProductCard } from '../_components/ProductCard';

export default function DarkStoreSearchPage() {
  const router = useRouter();
  const { settings, items, cart, cartTotal } = useDarkStoreShell();
  // ponytail: se lee directo de la URL en vez de useSearchParams() — evita envolver la
  // página en Suspense solo por esto (mismo criterio que /tienda).
  const [q, setQ] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [recent, setRecent] = useState<RecentProduct[]>([]);
  useEffect(() => {
    setQ(new URLSearchParams(window.location.search).get('q')?.trim() || '');
    setHistory(getSearchHistory());
    setRecent(getRecentProducts());
  }, []);

  const goToRecent = (r: RecentProduct) => router.push(`/dark-store/producto/${r.kind === 'vape' ? 'v' : 'p'}-${r.id}`);
  const searchHistoryChip = (h: string) => {
    addSearchHistory(h);
    setQ(h);
    router.push(`/dark-store/buscar?q=${encodeURIComponent(h)}`);
  };

  const tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = useMemo(() => {
    if (!tokens.length) return [];
    return items.filter((i) => {
      const haystack = `${i.name} ${i.brand} ${i.category}`.toLowerCase();
      return tokens.every((t) => haystack.includes(t));
    });
  }, [items, q]);

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: BG, color: TEXT }}>
      <Header settings={settings} items={items} cartCount={cart.count} cartTotal={cartTotal} defaultSearch={q} />

      <div className="mx-auto max-w-[1400px] px-4 py-5">
        {!q ? (
          history.length || recent.length ? (
            <div className="space-y-6">
              {history.length > 0 && (
                <div>
                  <div className="mb-2 flex items-center justify-between">
                    <h2 className="text-[13px] font-bold">Búsquedas recientes</h2>
                    <button onClick={() => { clearSearchHistory(); setHistory([]); }} className="text-[11.5px] font-semibold" style={{ color: MUTED }}>Borrar</button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((h) => (
                      <button
                        key={h}
                        onClick={() => searchHistoryChip(h)}
                        className="flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium"
                        style={{ background: CARD, border: `1px solid ${CARD_BORDER}`, color: TEXT }}
                      >
                        <History className="h-3.5 w-3.5" style={{ color: MUTED }} /> {h}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {recent.length > 0 && (
                <div>
                  <h2 className="mb-2 text-[13px] font-bold">Vistos recientemente</h2>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                    {recent.map((r) => (
                      <button key={`${r.kind}:${r.id}`} onClick={() => goToRecent(r)} className="flex flex-col rounded-2xl p-3 text-left" style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}>
                        <div className="flex aspect-square items-center justify-center overflow-hidden rounded-xl" style={{ background: '#0D1017' }}>
                          {r.img ? <img src={r.img} alt="" className="h-full w-full object-cover" /> : <span className="text-4xl">📦</span>}
                        </div>
                        <div className="mt-2.5 line-clamp-2 min-h-[36px] text-[13px] font-medium" style={{ color: TEXT }}>{r.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border py-20 text-center" style={{ borderColor: CARD_BORDER, color: MUTED }}>
              <SearchIcon className="h-8 w-8" />
              Buscá papitas, gaseosas, chocolate…
            </div>
          )
        ) : (
          <>
            <h1 className="mb-1 text-xl font-extrabold">Resultados para "{q}"</h1>
            <div className="mb-5 text-[12.5px]" style={{ color: MUTED }}>{results.length} producto{results.length === 1 ? '' : 's'}</div>
            {!results.length ? (
              <div className="rounded-2xl border py-16 text-center text-[13px]" style={{ borderColor: CARD_BORDER, color: MUTED }}>
                No encontramos nada con "{q}". Probá con otra palabra.
              </div>
            ) : (
              <motion.div
                key={q}
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.035 } } }}
                className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              >
                {results.map((item) => (
                  <motion.div
                    key={`${item.kind}:${item.id}`}
                    variants={{ hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 320, damping: 28 } } }}
                  >
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
            )}
          </>
        )}
      </div>

      <MobileNav cartCount={cart.count} />
    </div>
  );
}
