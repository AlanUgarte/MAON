'use client';

// Intenta el backend real (/conversations) primero. Si no responde, sigue con
// localStorage como hasta ahora — mismo patrón que clients-store.ts.
import { useEffect, useState } from 'react';
import { api, getToken } from './api';
import { mockThread, type Client, type ChatMessage } from './mock';

const KEY = 'compven_threads';
// Mismo criterio que clients-store: los hilos de clientes de ejemplo quedan bajo claves "c_1".."c_N".
const DEMO_ID_RE = /^c_\d{1,4}$/;

function load(): Record<string, ChatMessage[]> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(KEY);
  if (!raw) return {};
  const stored: Record<string, ChatMessage[]> = JSON.parse(raw);
  const real = Object.fromEntries(Object.entries(stored).filter(([id]) => !DEMO_ID_RE.test(id)));
  if (Object.keys(real).length !== Object.keys(stored).length) localStorage.setItem(KEY, JSON.stringify(real));
  return real;
}

function fromBackendMessage(m: any): ChatMessage {
  return {
    id: m.id,
    direction: m.direction,
    author: m.author,
    content: m.content,
    at: m.createdAt,
    type: m.type,
    mediaUrl: m.mediaUrl ?? undefined,
  };
}

export function useChatThreads() {
  const [threads, setThreadsState] = useState<Record<string, ChatMessage[]>>({});
  const [source, setSource] = useState<'backend' | 'local'>('local');
  // Mapea clientId -> id real de la conversación en el backend (son entidades separadas ahí).
  const [conversationIds, setConversationIds] = useState<Record<string, string>>({});

  useEffect(() => {
    // Sin token (ej. la tienda pública) el fetch va a 401 sí o sí — se ahorra el viaje de red.
    if (!getToken()) { setThreadsState(load()); setSource('local'); return; }
    let cancelled = false;
    api.conversations()
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data ?? res) as any[];
        const map: Record<string, string> = {};
        rows.forEach((c) => { map[c.clientId] = c.id; });
        setConversationIds(map);
        setSource('backend');
      })
      .catch(() => {
        if (!cancelled) { setThreadsState(load()); setSource('local'); }
      });
    return () => { cancelled = true; };
  }, []);

  const save = (next: Record<string, ChatMessage[]>) => {
    setThreadsState(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const getThread = (client: Client) => threads[client.id] ?? (source === 'local' ? mockThread(client) : []);

  /** Trae los mensajes reales de un cliente (lazy, se llama al abrir su chat). */
  const loadThread = async (client: Client) => {
    if (source !== 'backend') return;
    const conversationId = conversationIds[client.id];
    if (!conversationId) return;
    try {
      const conv = await api.messages(conversationId);
      const msgs = ((conv.messages ?? []) as any[]).map(fromBackendMessage);
      setThreadsState((prev) => ({ ...prev, [client.id]: msgs }));
    } catch {
      // si falla, se queda con lo que ya había en memoria (no se pisa nada)
    }
  };

  /** Devuelve null si se mandó bien, o un mensaje de error de negocio (ej. ventana de WhatsApp cerrada) para mostrar en la UI. */
  const appendMessage = async (client: Client, msg: Partial<ChatMessage> & { content: string }): Promise<string | null> => {
    const conversationId = conversationIds[client.id];
    if (source === 'backend' && conversationId) {
      try {
        const sent = await api.sendMessage(conversationId, msg.content);
        setThreadsState((prev) => ({ ...prev, [client.id]: [...(prev[client.id] ?? []), fromBackendMessage(sent)] }));
        return null;
      } catch (err: any) {
        if (err.message !== 'Failed to fetch') return err.message || 'No se pudo enviar el mensaje.';
        // backend caído: sigue con el guardado local para no perder el mensaje
      }
    }
    const fresh = load();
    const current = fresh[client.id] ?? mockThread(client);
    save({
      ...fresh,
      [client.id]: [...current, { id: `m${Date.now()}`, direction: 'SALIENTE', author: 'VENDEDOR', at: new Date().toISOString(), type: 'TEXTO', ...msg }],
    });
    return null;
  };

  return { getThread, appendMessage, loadThread, source };
}
