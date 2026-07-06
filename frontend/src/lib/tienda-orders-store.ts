'use client';

// El localStorage sigue siendo la fuente de verdad para el panel de Pedidos
// (tienda-config), pero además se manda un best-effort al backend real para
// que quede un registro de Sale/SaleItem en la base (reportes, stock, etc.).
import { useEffect, useState } from 'react';
import { api } from './api';

const KEY = 'compven_tienda_orders';

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
  // Datos logísticos elegidos en el checkout de la tienda.
  wantsShipping: boolean;
  shippingAddress?: string;
  availableSchedule?: string;
}

function load(): TiendaOrder[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function useTiendaOrders() {
  const [orders, setOrders] = useState<TiendaOrder[]>([]);

  useEffect(() => { setOrders(load()); }, []);

  const addOrder = (o: Omit<TiendaOrder, 'id' | 'createdAt'>) => {
    const order: TiendaOrder = { ...o, id: `o_${Date.now()}`, createdAt: new Date().toISOString() };
    const next = [order, ...load()];
    setOrders(next);
    localStorage.setItem(KEY, JSON.stringify(next));

    // Best-effort: no bloquea ni rompe el pedido local si el backend no está disponible.
    api.salesStorefront({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      sellerName: order.seller,
      items: order.items.map((i) => ({ sku: i.sku, quantity: i.qty })),
    }).catch(() => {});

    return order;
  };

  const markInvoiced = (orderId: string, comprobanteNumero: string) => {
    const next = load().map((o) => (o.id === orderId ? { ...o, invoiced: true, comprobanteNumero } : o));
    setOrders(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return { orders, addOrder, markInvoiced };
}
