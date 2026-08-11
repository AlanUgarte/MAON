'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export type SupremaClientType = 'CONSUMIDOR_FINAL' | 'KIOSCO' | 'MAYORISTA';
export type SupremaPaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADO_PAGO' | 'OTRO';

export interface SupremaSale {
  id: string;
  clientId: string;
  clientName: string;
  clientPhone: string;
  clientAddress?: string;
  sellerName?: string;
  clientType: SupremaClientType;
  kg: number;
  pricePerKg: number;
  costPerKg: number;
  total: number;
  cost: number;
  profit: number;
  marginPct: number;
  paymentMethod: SupremaPaymentMethod;
  observaciones?: string;
  fecha: string;
}

export interface NewSupremaSale {
  clientId?: string;
  newClient?: { name: string; phone: string; address?: string; email?: string };
  clientType: SupremaClientType;
  kg: number;
  pricePerKg?: number;
  paymentMethod: SupremaPaymentMethod;
  observaciones?: string;
  fecha?: string;
}

function fromBackend(s: any): SupremaSale {
  return {
    id: s.id,
    clientId: s.clientId,
    clientName: `${s.client?.firstName ?? ''} ${s.client?.lastName ?? ''}`.trim() || 'N/D',
    clientPhone: s.client?.phone ?? '',
    clientAddress: s.client?.address ?? undefined,
    sellerName: s.seller?.fullName ?? undefined,
    clientType: s.clientType,
    kg: Number(s.kg),
    pricePerKg: Number(s.pricePerKg),
    costPerKg: Number(s.costPerKg),
    total: Number(s.total),
    cost: Number(s.cost),
    profit: Number(s.profit),
    marginPct: Number(s.marginPct),
    paymentMethod: s.paymentMethod,
    observaciones: s.observaciones ?? undefined,
    fecha: s.fecha,
  };
}

export function useSupremasSales() {
  const [sales, setSales] = useState<SupremaSale[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.supremasSales();
      setSales(rows.map(fromBackend));
    } catch {
      // sin conexión: se queda con lo último cargado
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  // A propósito NO atrapa el error: el form de Nueva Venta tiene que enterarse si la
  // venta no se pudo registrar de verdad (stock insuficiente, cliente inválido, etc.)
  const createSale = async (dto: NewSupremaSale) => {
    const created = await api.createSupremasSale(dto);
    await refresh();
    return created;
  };

  const removeSale = async (id: string) => {
    await api.deleteSupremasSale(id);
    await refresh();
  };

  return { sales, loading, refresh, createSale, removeSale };
}
