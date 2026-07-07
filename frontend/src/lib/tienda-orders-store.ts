'use client';

// Los pedidos de la tienda pública se leen del backend real (GET /sales) — antes el
// localStorage de cada navegador era la fuente de verdad, así que dos sesiones distintas
// podían mostrar listas de pedidos distintas, y si fallaba el guardado real nadie se
// enteraba (quedaba solo en ese navegador). Ahora crear un pedido espera la confirmación
// real del backend antes de decir que se envió.
import { useEffect, useState } from 'react';
import { api } from './api';

export interface TiendaOrderItem { productId: string; sku: string; name: string; qty: number; unitPrice: number }

export interface TiendaOrder {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  clientId?: string;
  items: TiendaOrderItem[];
  subtotal: number;
  envioGratis: boolean;
  invoiced?: boolean;
  comprobanteNumero?: string;
  seller?: string;
  wantsShipping: boolean;
  shippingAddress?: string;
  availableSchedule?: string;
}

export interface NewTiendaOrder {
  customerName: string;
  customerPhone: string;
  sellerName?: string;
  items: TiendaOrderItem[];
  subtotal: number;
  envioGratis: boolean;
  wantsShipping: boolean;
  shippingAddress?: string;
  availableSchedule?: string;
}

function fromBackend(s: any): TiendaOrder {
  return {
    id: s.id,
    createdAt: s.createdAt,
    customerName: `${s.client?.firstName ?? ''} ${s.client?.lastName ?? ''}`.trim(),
    customerPhone: s.client?.phone ?? '',
    clientId: s.clientId,
    items: (s.items ?? []).map((it: any) => ({
      productId: it.productId,
      sku: it.product?.sku ?? '',
      name: it.product?.name ?? 'N/D',
      qty: it.quantity,
      unitPrice: Number(it.unitPrice),
    })),
    subtotal: Number(s.total),
    envioGratis: !!s.envioGratis,
    invoiced: !!s.invoiced,
    comprobanteNumero: s.comprobanteNumero ?? undefined,
    seller: s.seller?.fullName ?? undefined,
    wantsShipping: !!s.wantsShipping,
    shippingAddress: s.shippingAddress ?? undefined,
    availableSchedule: s.availableSchedule ?? undefined,
  };
}

export function useTiendaOrders() {
  const [orders, setOrders] = useState<TiendaOrder[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');

  const reload = () => {
    api.sales()
      .then((rows) => { setOrders(rows.map(fromBackend)); setStatus('ready'); })
      .catch(() => setStatus('error'));
  };
  useEffect(reload, []);

  // Usado por el checkout público de /tienda. A propósito NO atrapa el error: el
  // checkout tiene que enterarse si el pedido no se pudo registrar de verdad, en vez
  // de mostrar "listo" con un pedido que en realidad no quedó guardado en ningún lado.
  const addOrder = async (o: NewTiendaOrder) => {
    const res = await api.salesStorefront({
      customerName: o.customerName,
      customerPhone: o.customerPhone,
      sellerName: o.sellerName,
      items: o.items.map((i) => ({ sku: i.sku, quantity: i.qty })),
      wantsShipping: o.wantsShipping,
      shippingAddress: o.shippingAddress,
      availableSchedule: o.availableSchedule,
      envioGratis: o.envioGratis,
    });
    if (!res.ok || !res.saleId) throw new Error(res.reason || 'No se pudo registrar el pedido');
    reload();
    return res.saleId;
  };

  // Optimista en pantalla (no hace esperar al vendedor mirando el PDF ya generado),
  // pero si el PATCH real falla se recarga desde el backend para no quedar mostrando
  // "facturado" en una pantalla cuando en la base no quedó así.
  const markInvoiced = (orderId: string, comprobanteNumero: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, invoiced: true, comprobanteNumero } : o)));
    api.markSaleInvoiced(orderId, comprobanteNumero).catch(() => reload());
  };

  return { orders, status, addOrder, markInvoiced, reload };
}
