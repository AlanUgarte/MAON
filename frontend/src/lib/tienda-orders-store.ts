'use client';

// Los pedidos de la tienda pública se leen del backend real (GET /sales) — antes el
// localStorage de cada navegador era la fuente de verdad, así que dos sesiones distintas
// podían mostrar listas de pedidos distintas, y si fallaba el guardado real nadie se
// enteraba (quedaba solo en ese navegador). Ahora crear un pedido espera la confirmación
// real del backend antes de decir que se envió.
import { useEffect, useState } from 'react';
import { api } from './api';

export interface TiendaOrderItem {
  productId: string; sku: string; name: string; qty: number; unitPrice: number;
  // Aclara el modo de venta cuando no es bulto cerrado (ej. "unidad") — se manda al
  // backend y vuelve en la respuesta, así el remito no confunde bultos con unidades.
  note?: string;
}

export interface TiendaOrder {
  id: string;
  createdAt: string;
  customerName: string;
  customerPhone: string;
  clientId?: string;
  status: string;
  items: TiendaOrderItem[];
  subtotal: number;
  envioGratis: boolean;
  invoiced?: boolean;
  comprobanteNumero?: string;
  seller?: string;
  wantsShipping: boolean;
  shippingAddress?: string;
  availableSchedule?: string;
  // Dark Store
  barrio?: string;
  vapeItems?: { vapeId: string; name: string; quantity: number; unitPrice: number }[];
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
    status: s.status ?? 'PENDIENTE',
    items: (s.items ?? []).map((it: any) => ({
      productId: it.productId,
      sku: it.product?.sku ?? '',
      name: it.note ? `${it.product?.name ?? 'N/D'} (${it.note})` : (it.product?.name ?? 'N/D'),
      qty: it.quantity,
      unitPrice: Number(it.unitPrice),
      note: it.note ?? undefined,
    })),
    subtotal: Number(s.total),
    envioGratis: !!s.envioGratis,
    invoiced: !!s.invoiced,
    comprobanteNumero: s.comprobanteNumero ?? undefined,
    seller: s.seller?.fullName ?? undefined,
    wantsShipping: !!s.wantsShipping,
    shippingAddress: s.shippingAddress ?? undefined,
    availableSchedule: s.availableSchedule ?? undefined,
    barrio: s.barrio ?? undefined,
    vapeItems: Array.isArray(s.vapeItems) && s.vapeItems.length ? s.vapeItems : undefined,
  };
}

export function useTiendaOrders() {
  const [orders, setOrders] = useState<TiendaOrder[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  // Antes se tragaba el motivo del error (.catch(() => setStatus('error'))) — un token
  // vencido (401) y una caída real del servidor mostraban el mismo cartel genérico, que
  // encima sugería "recargá la página" cuando eso no arregla una sesión vencida.
  const [error, setError] = useState<string | null>(null);

  const reload = () => {
    api.sales()
      .then((rows) => { setOrders(rows.map(fromBackend)); setStatus('ready'); setError(null); })
      .catch((err: any) => {
        setStatus('error');
        const msg = String(err?.message || '');
        setError(/unauthorized/i.test(msg) ? 'Tu sesión venció — cerrá sesión y volvé a entrar.' : msg || 'No se pudieron cargar los pedidos.');
      });
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
      items: o.items.map((i) => ({ sku: i.sku, quantity: i.qty, unitPrice: i.unitPrice, note: i.note })),
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

  // Marca "en camino" y le avisa al cliente por WhatsApp (lo hace el backend) — acá
  // devolvemos el teléfono para que la pantalla abra el chat y el admin comparta su
  // ubicación en vivo a mano (WhatsApp no tiene forma de disparar eso desde un bot).
  const markShipped = async (orderId: string) => {
    const res = await api.markSaleShipped(orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'ENVIADA' } : o)));
    return res.clientPhone;
  };

  const markDelivered = async (orderId: string) => {
    await api.markSaleDelivered(orderId);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: 'ENTREGADA' } : o)));
  };

  // Cambio de estado libre desde el desplegable de Pedidos (Preparando/En camino/
  // Entregado, para cualquier lado) — a diferencia de markShipped/markDelivered, que
  // solo van "hacia adelante".
  const setOrderStatus = async (orderId: string, newStatus: 'PENDIENTE' | 'ENVIADA' | 'ENTREGADA') => {
    const res = await api.setSaleStatus(orderId, newStatus);
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
    return res.clientPhone;
  };

  return { orders, status, error, addOrder, markInvoiced, markShipped, markDelivered, setOrderStatus, reload };
}
