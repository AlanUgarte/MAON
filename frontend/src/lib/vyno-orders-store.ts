'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export type VynoOrderStatus =
  | 'NUEVO' | 'PAGO_PENDIENTE' | 'COMPROBANTE_RECIBIDO' | 'PAGO_VERIFICADO'
  | 'LISTO_PARA_DESPACHAR' | 'DESPACHADO' | 'EN_TRANSITO' | 'ENTREGADO' | 'CANCELADO';

export interface VynoOrder {
  id: string;
  orderNumber: string;
  status: VynoOrderStatus;
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
  items: { productName: string; quantity: number; unitPrice: number; subtotal: number }[];
  paymentProof?: { imageUrl: string; operationNumber?: string; transferredAt?: string; holderName?: string; comment?: string };
}

function fromBackend(o: any): VynoOrder {
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
    items: (o.items ?? []).map((i: any) => ({ productName: i.product?.name ?? 'N/D', quantity: i.quantity, unitPrice: Number(i.unitPrice), subtotal: Number(i.subtotal) })),
    paymentProof: o.paymentProof ? {
      imageUrl: o.paymentProof.imageUrl, operationNumber: o.paymentProof.operationNumber ?? undefined,
      transferredAt: o.paymentProof.transferredAt ?? undefined, holderName: o.paymentProof.holderName ?? undefined,
      comment: o.paymentProof.comment ?? undefined,
    } : undefined,
  };
}

export function useVynoOrders() {
  const [orders, setOrders] = useState<VynoOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.vynoOrders();
      setOrders(rows.map(fromBackend));
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los pedidos.');
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const approve = async (id: string) => { await api.approveVynoOrder(id); await refresh(); };
  const setStatus = async (id: string, status: VynoOrderStatus, extra?: { trackingNumber?: string; carrier?: string }) => {
    await api.setVynoOrderStatus(id, { status, ...extra });
    await refresh();
  };

  return { orders, loading, error, refresh, approve, setStatus };
}
