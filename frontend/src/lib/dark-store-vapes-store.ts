'use client';

// Catálogo de Vapeadores de Dark Store: administrado a mano (no viene del maestro del
// proveedor), vive en su propio modelo (DarkStoreVape). La tienda pública lee el
// endpoint público (solo activos); el panel admin lee todo (incluye inactivos).
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export interface DarkStoreVape {
  id: string;
  name: string;
  description?: string;
  brand?: string;
  price: number;
  stock: number;
  images: string[];
  /** Sabores/variantes — si hay más de uno, el detalle muestra un desplegable. */
  flavors: string[];
  featured: boolean;
  isActive: boolean;
}

function fromBackend(v: any): DarkStoreVape {
  return {
    id: v.id, name: v.name, description: v.description ?? undefined, brand: v.brand ?? undefined,
    price: Number(v.price), stock: v.stock ?? 0, images: v.images ?? [], flavors: v.flavors ?? [],
    featured: !!v.featured, isActive: v.isActive ?? true,
  };
}

export function useDarkStoreVapes(admin = false) {
  const [vapes, setVapes] = useState<DarkStoreVape[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = admin ? await api.darkStoreVapes() : await api.darkStoreVapesPublic();
      setVapes(rows.map(fromBackend));
    } catch {
      // sin conexión: se queda con lo que ya tenía cargado
    } finally {
      setLoading(false);
    }
  }, [admin]);

  useEffect(() => { refresh(); }, [refresh]);

  return { vapes, loading, refresh };
}
