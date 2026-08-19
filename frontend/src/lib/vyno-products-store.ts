'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export interface VynoProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  images: string[];
  description?: string;
  installments?: number;
  ratingAvg?: number;
  ratingCount: number;
  isActive: boolean;
}

function fromBackend(p: any): VynoProduct {
  return {
    id: p.id, name: p.name, slug: p.slug,
    price: Number(p.price), compareAtPrice: p.compareAtPrice != null ? Number(p.compareAtPrice) : undefined,
    stock: p.stock ?? 0, images: p.images ?? [], description: p.description ?? undefined,
    installments: p.installments ?? undefined,
    ratingAvg: p.ratingAvg != null ? Number(p.ratingAvg) : undefined, ratingCount: p.ratingCount ?? 0,
    isActive: p.isActive ?? true,
  };
}

/** Pública — catálogo de /vyno (hoy es un solo producto, pero ya soporta varios). */
export function useVynoProductsPublic() {
  const [products, setProducts] = useState<VynoProduct[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    api.vynoProductsPublic()
      .then((rows) => { if (!cancelled) setProducts(rows.map(fromBackend)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return { products, loading };
}

/** Admin — /vyno-config, incluye inactivos. */
export function useVynoProducts() {
  const [products, setProducts] = useState<VynoProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.vynoProducts();
      setProducts(rows.map(fromBackend));
    } catch { /* sin permiso o sin conexión */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const update = async (id: string, dto: Partial<VynoProduct>) => { await api.updateVynoProduct(id, dto); await refresh(); };

  return { products, loading, refresh, update };
}
