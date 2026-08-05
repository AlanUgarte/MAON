'use client';

// Carrito de Dark Store: a diferencia de Tienda (bulto cerrado), acá cada línea es un
// artículo individual — puede ser del catálogo mayorista (identificado por sku) o un
// Vapeador propio (identificado por id). Se persiste en localStorage: a diferencia de
// Tienda, acá sí importa que sobreviva un refresh (compra rápida, sesión corta).
import { useCallback, useEffect, useState } from 'react';

const KEY = 'compven_dark_store_cart';

export interface DarkStoreCartLine {
  kind: 'product' | 'vape';
  id: string; // sku para product, id para vape
  qty: number;
}

function load(): DarkStoreCartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function useDarkStoreCart() {
  const [lines, setLines] = useState<DarkStoreCartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setLines(load()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(KEY, JSON.stringify(lines)); }, [lines, hydrated]);

  const qtyOf = useCallback((kind: DarkStoreCartLine['kind'], id: string) => lines.find((l) => l.kind === kind && l.id === id)?.qty ?? 0, [lines]);

  const add = useCallback((kind: DarkStoreCartLine['kind'], id: string, delta = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.kind === kind && l.id === id);
      if (!found) return delta > 0 ? [...prev, { kind, id, qty: delta }] : prev;
      const qty = found.qty + delta;
      if (qty <= 0) return prev.filter((l) => !(l.kind === kind && l.id === id));
      return prev.map((l) => (l.kind === kind && l.id === id ? { ...l, qty } : l));
    });
  }, []);

  const setQty = useCallback((kind: DarkStoreCartLine['kind'], id: string, qty: number) => {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => !(l.kind === kind && l.id === id));
      const found = prev.find((l) => l.kind === kind && l.id === id);
      if (!found) return qty > 0 ? [...prev, { kind, id, qty }] : prev;
      return prev.map((l) => (l.kind === kind && l.id === id ? { ...l, qty } : l));
    });
  }, []);

  const remove = useCallback((kind: DarkStoreCartLine['kind'], id: string) => {
    setLines((prev) => prev.filter((l) => !(l.kind === kind && l.id === id)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = lines.reduce((a, l) => a + l.qty, 0);

  return { lines, hydrated, qtyOf, add, setQty, remove, clear, count };
}
