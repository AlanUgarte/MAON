'use client';

// Carrito real de Insumos Carnicería — persistido en localStorage (sobrevive a un
// refresh), guarda productId+medida+cantidad (nunca el precio: el total siempre se
// recalcula contra el precio vigente del producto). La medida es parte de la
// identidad de la línea: 2×3.50m y 1×2.00m son líneas distintas, no se suman.
import { useCallback, useEffect, useState } from 'react';

const KEY = 'insumos_cart';

export interface InsumosCartLine { productId: string; size: string; quantity: number }

const lineKey = (productId: string, size: string) => `${productId}::${size}`;

function load(): InsumosCartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useInsumosCart() {
  const [lines, setLines] = useState<InsumosCartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setLines(load()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(KEY, JSON.stringify(lines)); }, [lines, hydrated]);

  const add = useCallback((productId: string, size: string, delta: number = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => lineKey(l.productId, l.size) === lineKey(productId, size));
      if (!existing) return delta > 0 ? [...prev, { productId, size, quantity: delta }] : prev;
      const quantity = existing.quantity + delta;
      if (quantity <= 0) return prev.filter((l) => lineKey(l.productId, l.size) !== lineKey(productId, size));
      return prev.map((l) => (lineKey(l.productId, l.size) === lineKey(productId, size) ? { ...l, quantity } : l));
    });
  }, []);

  const setQuantity = useCallback((productId: string, size: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => lineKey(l.productId, l.size) !== lineKey(productId, size));
      const existing = prev.find((l) => lineKey(l.productId, l.size) === lineKey(productId, size));
      if (!existing) return [...prev, { productId, size, quantity }];
      return prev.map((l) => (lineKey(l.productId, l.size) === lineKey(productId, size) ? { ...l, quantity } : l));
    });
  }, []);

  const remove = useCallback((productId: string, size: string) => setLines((prev) => prev.filter((l) => lineKey(l.productId, l.size) !== lineKey(productId, size))), []);
  const clear = useCallback(() => setLines([]), []);
  const count = lines.reduce((a, l) => a + l.quantity, 0);

  return { lines, hydrated, add, setQuantity, remove, clear, count };
}
