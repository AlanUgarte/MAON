'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { BG, CARD_BORDER, MUTED, TEXT } from '../../_lib';
import { useDarkStoreShell } from '../../_useShell';
import { DARK_STORE_CATEGORIES, type DarkStoreCategory } from '@/lib/dark-store-catalog';
import { Header } from '../../_components/Header';
import { MobileNav } from '../../_components/MobileNav';
import { ProductCard } from '../../_components/ProductCard';

export default function DarkStoreCategoryPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { settings, items, loading, cart, cartTotal } = useDarkStoreShell();

  const category = DARK_STORE_CATEGORIES.find((c) => c.toLowerCase() === params.slug) as DarkStoreCategory | undefined;
  const filtered = useMemo(() => items.filter((i) => i.category === category), [items, category]);

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: BG, color: TEXT }}>
      <Header settings={settings} cartCount={cart.count} cartTotal={cartTotal} />

      <div className="mx-auto max-w-[1400px] px-4 py-5">
        <button onClick={() => router.push('/dark-store')} className="mb-3 flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: MUTED }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </button>

        {!category ? (
          <div className="py-16 text-center" style={{ color: MUTED }}>Categoría no encontrada.</div>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-extrabold">{category}</h1>
            <div className="mb-5 text-[12.5px]" style={{ color: MUTED }}>{filtered.length} producto{filtered.length === 1 ? '' : 's'}</div>

            {loading && !filtered.length && <div className="py-10 text-center text-[12.5px]" style={{ color: MUTED }}>Cargando…</div>}
            {!loading && !filtered.length && (
              <div className="rounded-2xl border py-16 text-center text-[13px]" style={{ borderColor: CARD_BORDER, color: MUTED }}>
                Todavía no hay productos cargados en esta categoría.
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {filtered.map((item) => (
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
          </>
        )}
      </div>

      <MobileNav cartCount={cart.count} />
    </div>
  );
}
