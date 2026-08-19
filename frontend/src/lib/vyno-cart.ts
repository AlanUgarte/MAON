'use client';

// Carrito real de VYNO — persistido en localStorage (sobrevive a un refresh), guarda
// solo productId+cantidad (nunca el precio: el total siempre se recalcula contra el
// precio vigente del producto, igual criterio que el resto del CRM).
import { useCallback, useEffect, useState } from 'react';

const KEY = 'vyno_cart';

export interface VynoCartLine { productId: string; quantity: number }

function load(): VynoCartLine[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function useVynoCart() {
  const [lines, setLines] = useState<VynoCartLine[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => { setLines(load()); setHydrated(true); }, []);
  useEffect(() => { if (hydrated) localStorage.setItem(KEY, JSON.stringify(lines)); }, [lines, hydrated]);

  const add = useCallback((productId: string, delta: number = 1) => {
    setLines((prev) => {
      const existing = prev.find((l) => l.productId === productId);
      if (!existing) return delta > 0 ? [...prev, { productId, quantity: delta }] : prev;
      const quantity = existing.quantity + delta;
      if (quantity <= 0) return prev.filter((l) => l.productId !== productId);
      return prev.map((l) => (l.productId === productId ? { ...l, quantity } : l));
    });
  }, []);

  const setQuantity = useCallback((productId: string, quantity: number) => {
    setLines((prev) => {
      if (quantity <= 0) return prev.filter((l) => l.productId !== productId);
      const existing = prev.find((l) => l.productId === productId);
      if (!existing) return [...prev, { productId, quantity }];
      return prev.map((l) => (l.productId === productId ? { ...l, quantity } : l));
    });
  }, []);

  const remove = useCallback((productId: string) => setLines((prev) => prev.filter((l) => l.productId !== productId)), []);
  const clear = useCallback(() => setLines([]), []);
  const qtyOf = useCallback((productId: string) => lines.find((l) => l.productId === productId)?.quantity ?? 0, [lines]);
  const count = lines.reduce((a, l) => a + l.quantity, 0);

  return { lines, hydrated, add, setQuantity, remove, clear, qtyOf, count };
}
