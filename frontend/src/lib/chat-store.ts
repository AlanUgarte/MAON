'use client';

// ponytail: persistencia simple en localStorage hasta conectar el envío real de WhatsApp.
import { useEffect, useState } from 'react';
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

export function useChatThreads() {
  const [threads, setThreadsState] = useState<Record<string, ChatMessage[]>>({});
  useEffect(() => setThreadsState(load()), []);

  const save = (next: Record<string, ChatMessage[]>) => {
    setThreadsState(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const getThread = (client: Client) => threads[client.id] ?? mockThread(client);

  const appendMessage = (client: Client, msg: Partial<ChatMessage> & { content: string }) => {
    // Se parte de load() (localStorage actual), no del estado de React, para no pisar
    // hilos reales con {} si esto se llama antes de que el efecto de carga termine.
    const fresh = load();
    const current = fresh[client.id] ?? mockThread(client);
    save({
      ...fresh,
      [client.id]: [...current, { id: `m${Date.now()}`, direction: 'SALIENTE', author: 'VENDEDOR', at: new Date().toISOString(), type: 'TEXTO', ...msg }],
    });
  };

  return { getThread, appendMessage };
}
