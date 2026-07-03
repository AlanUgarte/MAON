'use client';

// ponytail: solo localStorage, no hay modelo de backend para pedidos de la tienda todavía.
import { useEffect, useState } from 'react';

const KEY = 'compven_tienda_orders';

export interface TiendaOrderItem { productId: string; name: string; qty: number; unitPrice: number }

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
    return order;
  };

  const markInvoiced = (orderId: string, comprobanteNumero: string) => {
    const next = load().map((o) => (o.id === orderId ? { ...o, invoiced: true, comprobanteNumero } : o));
    setOrders(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return { orders, addOrder, markInvoiced };
}
