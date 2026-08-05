'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon } from 'lucide-react';
import { BG, CARD_BORDER, MUTED, TEXT } from '../_lib';
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
  useEffect(() => {
    setQ(new URLSearchParams(window.location.search).get('q')?.trim() || '');
  }, []);

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
      <Header settings={settings} cartCount={cart.count} cartTotal={cartTotal} defaultSearch={q} />

      <div className="mx-auto max-w-[1400px] px-4 py-5">
        {!q ? (
          <div className="flex flex-col items-center justify-center gap-2 rounded-2xl border py-20 text-center" style={{ borderColor: CARD_BORDER, color: MUTED }}>
            <SearchIcon className="h-8 w-8" />
            Buscá papitas, gaseosas, chocolate…
          </div>
        ) : (
          <>
            <h1 className="mb-1 text-xl font-extrabold">Resultados para "{q}"</h1>
            <div className="mb-5 text-[12.5px]" style={{ color: MUTED }}>{results.length} producto{results.length === 1 ? '' : 's'}</div>
            {!results.length ? (
              <div className="rounded-2xl border py-16 text-center text-[13px]" style={{ borderColor: CARD_BORDER, color: MUTED }}>
                No encontramos nada con "{q}". Probá con otra palabra.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                {results.map((item) => (
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
            )}
          </>
        )}
      </div>

      <MobileNav cartCount={cart.count} />
    </div>
  );
}
