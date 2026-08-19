'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export type InsumosOrderStatus =
  | 'NUEVO' | 'PAGO_PENDIENTE' | 'COMPROBANTE_RECIBIDO' | 'PAGO_VERIFICADO'
  | 'LISTO_PARA_DESPACHAR' | 'DESPACHADO' | 'EN_TRANSITO' | 'ENTREGADO' | 'CANCELADO';

export interface InsumosOrder {
  id: string;
  orderNumber: string;
  status: InsumosOrderStatus;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  subtotal: number;
  shippingCost: number;
  total: number;
  province: string; city: string; postalCode: string; street: string; streetNumber: string; floorApt?: string;
  shippingNotes?: string;
  docNumber?: string;
  trackingNumber?: string;
  carrier?: string;
  approvedByName?: string;
  approvedAt?: string;
  createdAt: string;
  items: { productName: string; size?: string; quantity: number; unitPrice: number; subtotal: number }[];
  paymentProof?: { imageUrl?: string; holderName: string };
}

function fromBackend(o: any): InsumosOrder {
  return {
    id: o.id, orderNumber: o.orderNumber, status: o.status,
    clientName: `${o.client?.firstName ?? ''} ${o.client?.lastName ?? ''}`.trim(),
    clientPhone: o.client?.phone ?? '', clientEmail: o.client?.email ?? '',
    subtotal: Number(o.subtotal), shippingCost: Number(o.shippingCost), total: Number(o.total),
    province: o.province, city: o.city, postalCode: o.postalCode, street: o.street, streetNumber: o.streetNumber,
    floorApt: o.floorApt ?? undefined, shippingNotes: o.shippingNotes ?? undefined, docNumber: o.docNumber ?? undefined,
    trackingNumber: o.trackingNumber ?? undefined, carrier: o.carrier ?? undefined,
    approvedByName: o.approvedBy?.fullName ?? undefined, approvedAt: o.approvedAt ?? undefined,
    createdAt: o.createdAt,
    items: (o.items ?? []).map((i: any) => ({ productName: i.product?.name ?? 'N/D', size: i.size ?? undefined, quantity: i.quantity, unitPrice: Number(i.unitPrice), subtotal: Number(i.subtotal) })),
    paymentProof: o.paymentProof ? { imageUrl: o.paymentProof.imageUrl, holderName: o.paymentProof.holderName } : undefined,
  };
}

export function useInsumosOrders() {
  const [orders, setOrders] = useState<InsumosOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.insumosOrders();
      setOrders(rows.map(fromBackend));
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los pedidos.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const approve = async (id: string) => { await api.approveInsumosOrder(id); await refresh(); };
  const setStatus = async (id: string, status: InsumosOrderStatus, extra?: { trackingNumber?: string; carrier?: string }) => {
    await api.setInsumosOrderStatus(id, { status, ...extra });
    await refresh();
  };

  return { orders, loading, error, refresh, approve, setStatus };
}
