'use client';

import { useMemo } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, X } from 'lucide-react';
import { BG, CARD, CARD_BORDER, ACCENT, MUTED, TEXT } from '../../_lib';
import { useDarkStoreShell } from '../../_useShell';
import { DARK_STORE_CATEGORIES, type DarkStoreCategory } from '@/lib/dark-store-catalog';
import { linesOf } from '@/lib/dark-store-lines';
import { Header } from '../../_components/Header';
import { MobileNav } from '../../_components/MobileNav';
import { ProductCard } from '../../_components/ProductCard';

export default function DarkStoreCategoryPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const { settings, items, loading, cart, cartTotal } = useDarkStoreShell();

  const searchParams = useSearchParams();
  const lineSlugParam = searchParams.get('linea');

  const category = DARK_STORE_CATEGORIES.find((c) => c.toLowerCase() === params.slug) as DarkStoreCategory | undefined;

  const lines = useMemo(() => (category ? linesOf(items, category) : []), [items, category]);
  const activeLine = lines.find((l) => l.slug === lineSlugParam);

  const filtered = useMemo(
    () => items.filter((i) => i.category === category && (!activeLine || i.line === activeLine.key)),
    [items, category, activeLine],
  );

  const setLine = (slug?: string) =>
    router.push(`/dark-store/categoria/${params.slug}${slug ? `?linea=${slug}` : ''}`, { scroll: false });

  return (
    <div className="min-h-screen pb-20 md:pb-0" style={{ background: BG, color: TEXT }}>
      <Header settings={settings} items={items} cartCount={cart.count} cartTotal={cartTotal} />

      <div className="mx-auto max-w-[1400px] px-4 py-5">
        <button onClick={() => router.push('/dark-store')} className="mb-3 flex items-center gap-1.5 text-[12.5px] font-semibold" style={{ color: MUTED }}>
          <ArrowLeft className="h-3.5 w-3.5" /> Volver
        </button>

        {!category ? (
          <div className="py-16 text-center" style={{ color: MUTED }}>Categoría no encontrada.</div>
        ) : (
          <>
            <h1 className="mb-1 text-2xl font-extrabold">
              {category}
              {activeLine && <span style={{ color: MUTED }}> · {activeLine.label}</span>}
            </h1>
            <div className="mb-3 text-[12.5px]" style={{ color: MUTED }}>{filtered.length} producto{filtered.length === 1 ? '' : 's'}</div>

            {/* Líneas de la categoría — el mismo filtro que el desplegable del header */}
            {lines.length > 0 && (
              <div className="mb-5 flex flex-wrap gap-2">
                <button
                  onClick={() => setLine()}
                  className="rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                  style={{
                    background: !activeLine ? ACCENT : CARD,
                    border: `1px solid ${!activeLine ? ACCENT : CARD_BORDER}`,
                    color: TEXT,
                  }}
                >
                  Todo
                </button>
                {lines.map((l) => {
                  const on = activeLine?.slug === l.slug;
                  return (
                    <button
                      key={l.slug}
                      onClick={() => setLine(on ? undefined : l.slug)}
                      className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold transition"
                      style={{
                        background: on ? ACCENT : CARD,
                        border: `1px solid ${on ? ACCENT : CARD_BORDER}`,
                        color: on ? TEXT : MUTED,
                      }}
                    >
                      {l.label}
                      <span className="text-[10.5px] opacity-70">{l.count}</span>
                      {on && <X className="h-3 w-3" />}
                    </button>
                  );
                })}
              </div>
            )}

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
