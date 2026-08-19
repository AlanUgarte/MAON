'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export interface InsumosProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: string[];
  description?: string;
  ratingAvg?: number;
  ratingCount: number;
  isActive: boolean;
}

function fromBackend(p: any): InsumosProduct {
  return {
    id: p.id, name: p.name, slug: p.slug,
    price: Number(p.price), compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : undefined,
    stock: p.stock ?? 0, images: p.images ?? [], description: p.description ?? undefined,
    ratingAvg: p.ratingAvg != null ? Number(p.ratingAvg) : undefined, ratingCount: p.ratingCount ?? 0,
    isActive: p.isActive ?? true,
  };
}

/** Pública — catálogo de /insumos (hoy es un solo producto, pero ya soporta varios). */
export function useInsumosProductsPublic() {
  const [products, setProducts] = useState<InsumosProduct[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    api.insumosProductsPublic()
      .then((rows) => { if (!cancelled) setProducts(rows.map(fromBackend)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return { products, loading };
}

/** Admin — /insumos-config, incluye inactivos. */
export function useInsumosProducts() {
  const [products, setProducts] = useState<InsumosProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.insumosProducts();
      setProducts(rows.map(fromBackend));
    } catch { /* sin permiso o sin conexión */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const update = async (id: string, dto: Partial<InsumosProduct>) => { await api.updateInsumosProduct(id, dto); await refresh(); };

  return { products, loading, refresh, update };
}
