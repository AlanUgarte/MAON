'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export interface SupremaBatch {
  id: string;
  fecha: string;
  lote: string;
  kgProducidos: number;
  costoTotal: number;
  costoPorKg: number;
  observaciones?: string;
  createdAt: string;
}

export interface SupremaStock { producidoKg: number; vendidoKg: number; stockKg: number }

function fromBackend(b: any): SupremaBatch {
  return {
    id: b.id, fecha: b.fecha, lote: b.lote, kgProducidos: Number(b.kgProducidos),
    costoTotal: Number(b.costoTotal), costoPorKg: Number(b.costoPorKg),
    observaciones: b.observaciones ?? undefined, createdAt: b.createdAt,
  };
}

export function useSupremasBatches() {
  const [batches, setBatches] = useState<SupremaBatch[]>([]);
  const [stock, setStock] = useState<SupremaStock>({ producidoKg: 0, vendidoKg: 0, stockKg: 0 });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const stockRes = await api.supremasStock();
      setStock(stockRes);
      // Detalle de lotes (con costo) es admin/supervisor únicamente — si falla (vendedor
      // sin permiso) el stock ya se cargó arriba y la pantalla igual funciona.
      try {
        const rows = await api.supremasBatches();
        setBatches(rows.map(fromBackend));
      } catch { setBatches([]); }
    } catch {
      // sin conexión
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (dto: { fecha?: string; lote?: string; kgProducidos: number; costoTotal: number; observaciones?: string }) => {
    await api.createSupremasBatch(dto);
    await refresh();
  };
  const remove = async (id: string) => {
    await api.deleteSupremasBatch(id);
    await refresh();
  };

  return { batches, stock, loading, refresh, create, remove };
}
