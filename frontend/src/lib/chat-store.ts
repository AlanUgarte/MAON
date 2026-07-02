'use client';

// ponytail: persistencia simple en localStorage hasta conectar el envío real de WhatsApp.
import { useEffect, useState } from 'react';
import { mockThread, type Client, type ChatMessage } from './mock';

const KEY = 'compven_threads';

function load(): Record<string, ChatMessage[]> {
  if (typeof window === 'undefined') return {};
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : {};
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
    const current = threads[client.id] ?? mockThread(client);
    save({
      ...threads,
      [client.id]: [...current, { id: `m${Date.now()}`, direction: 'SALIENTE', author: 'VENDEDOR', at: new Date().toISOString(), type: 'TEXTO', ...msg }],
    });
  };

  return { getThread, appendMessage };
}
