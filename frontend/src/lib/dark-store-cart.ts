'use client';

// Carrito de Dark Store: a diferencia de Tienda (bulto cerrado), acá cada línea es un
// artículo individual — puede ser del catálogo mayorista (identificado por sku) o un
// Vapeador propio (identificado por id, más un sabor opcional si el vape tiene varios —
// dos sabores del mismo vape son líneas distintas). Se persiste en localStorage: a
// diferencia de Tienda, acá sí importa que sobreviva un refresh (compra rápida, sesión corta).
import { useCallback, useEffect, useState } from 'react';

const KEY = 'compven_dark_store_cart';

export interface DarkStoreCartLine {
  kind: 'product' | 'vape';
  id: string; // sku para product, id para vape
  flavor?: string; // solo vapes con más de un sabor
  qty: number;
}

const sameLine = (l: DarkStoreCartLine, kind: DarkStoreCartLine['kind'], id: string, flavor?: string) =>
  l.kind === kind && l.id === id && (l.flavor ?? '') === (flavor ?? '');

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

  const qtyOf = useCallback((kind: DarkStoreCartLine['kind'], id: string, flavor?: string) =>
    lines.find((l) => sameLine(l, kind, id, flavor))?.qty ?? 0, [lines]);

  const add = useCallback((kind: DarkStoreCartLine['kind'], id: string, delta = 1, flavor?: string) => {
    setLines((prev) => {
      const found = prev.find((l) => sameLine(l, kind, id, flavor));
      if (!found) return delta > 0 ? [...prev, { kind, id, flavor, qty: delta }] : prev;
      const qty = found.qty + delta;
      if (qty <= 0) return prev.filter((l) => !sameLine(l, kind, id, flavor));
      return prev.map((l) => (sameLine(l, kind, id, flavor) ? { ...l, qty } : l));
    });
  }, []);

  const setQty = useCallback((kind: DarkStoreCartLine['kind'], id: string, qty: number, flavor?: string) => {
    setLines((prev) => {
      if (qty <= 0) return prev.filter((l) => !sameLine(l, kind, id, flavor));
      const found = prev.find((l) => sameLine(l, kind, id, flavor));
      if (!found) return qty > 0 ? [...prev, { kind, id, flavor, qty }] : prev;
      return prev.map((l) => (sameLine(l, kind, id, flavor) ? { ...l, qty } : l));
    });
  }, []);

  const remove = useCallback((kind: DarkStoreCartLine['kind'], id: string, flavor?: string) => {
    setLines((prev) => prev.filter((l) => !sameLine(l, kind, id, flavor)));
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const count = lines.reduce((a, l) => a + l.qty, 0);

  return { lines, hydrated, qtyOf, add, setQty, remove, clear, count };
}
