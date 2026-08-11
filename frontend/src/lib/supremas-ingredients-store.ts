'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export interface SupremaIngredient {
  id: string;
  name: string;
  purchaseQty: number;
  unit: string;
  purchasePrice: number;
  usedQty: number;
  supplier?: string;
  updatedAt: string;
}

export interface SupremaCosteo {
  ingredientes: { id: string; name: string; costoUtilizado: number }[];
  ingredientesCost: number;
  envaseCost: number;
  costoTotal: number;
  produccionKg: number;
  costoPorKg: number;
}

function fromBackend(i: any): SupremaIngredient {
  return {
    id: i.id, name: i.name, purchaseQty: Number(i.purchaseQty), unit: i.unit,
    purchasePrice: Number(i.purchasePrice), usedQty: Number(i.usedQty),
    supplier: i.supplier ?? undefined, updatedAt: i.updatedAt,
  };
}

export function useSupremasIngredients() {
  const [ingredients, setIngredients] = useState<SupremaIngredient[]>([]);
  const [costeo, setCosteo] = useState<SupremaCosteo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const [rows, c] = await Promise.all([api.supremasIngredients(), api.supremasCosteo()]);
      setIngredients(rows.map(fromBackend));
      setCosteo(c);
    } catch {
      // sin permiso (vendedor) o sin conexión: se queda vacío, la pantalla lo maneja
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const create = async (dto: Omit<SupremaIngredient, 'id' | 'updatedAt'>) => {
    await api.createSupremasIngredient(dto);
    await refresh();
  };
  const update = async (id: string, dto: Partial<Omit<SupremaIngredient, 'id' | 'updatedAt'>>) => {
    await api.updateSupremasIngredient(id, dto);
    await refresh();
  };
  const remove = async (id: string) => {
    await api.deleteSupremasIngredient(id);
    await refresh();
  };

  return { ingredients, costeo, loading, refresh, create, update, remove };
}
