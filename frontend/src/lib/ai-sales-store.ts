'use client';

// Control IA/humano + carrito de una conversación puntual (MAON AI Sales).
// Se consulta aparte de chat-store.ts porque es información propia de la
// conversación (no de los mensajes) y solo hace falta cuando el panel está abierto.
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

export type AIMode = 'AI_ACTIVE' | 'HUMAN_REQUESTED' | 'HUMAN_ACTIVE' | 'AI_PAUSED';

export interface CartItemView {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: string;
  product: { name: string; sku: string; images: string[] };
}
export interface CartView {
  id: string;
  status: 'ABIERTO' | 'CONFIRMADO' | 'ABANDONADO';
  subtotal: number;
  wantsShipping: boolean | null;
  shippingAddress: string | null;
  items: CartItemView[];
  sale?: {
    id: string;
    payment?: { status: 'PENDIENTE' | 'EN_PROCESO' | 'APROBADO' | 'RECHAZADO' | 'CANCELADO' | 'REEMBOLSADO' } | null;
  } | null;
}

export function useConversationControl(conversationId: string | null) {
  const [aiMode, setAiMode] = useState<AIMode | null>(null);
  const [cart, setCart] = useState<CartView | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    if (!conversationId) { setAiMode(null); setCart(null); return; }
    try {
      const conv = await api.messages(conversationId);
      setAiMode(conv.aiMode ?? null);
    } catch { /* backend caído: se queda con lo último que tenía */ }
    try {
      setCart(await api.getCart(conversationId));
    } catch {
      setCart(null);
    }
  }, [conversationId]);

  useEffect(() => { refresh(); }, [refresh]);

  const run = async (action: (id: string) => Promise<any>) => {
    if (!conversationId) return;
    setBusy(true);
    try { await action(conversationId); await refresh(); } finally { setBusy(false); }
  };

  const confirmPayment = async () => {
    if (!cart?.sale) return;
    setBusy(true);
    try { await api.confirmPayment(cart.sale.id); await refresh(); } finally { setBusy(false); }
  };

  return {
    aiMode,
    cart,
    busy,
    takeOver: () => run(api.takeOverConversation),
    returnToAI: () => run(api.returnToAI),
    pauseAI: () => run(api.pauseAI),
    confirmCart: () => run(api.confirmCart),
    confirmPayment,
    refresh,
  };
}
