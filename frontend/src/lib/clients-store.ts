'use client';

// Intenta el backend real (/clients) primero. Si no responde (sin DB/backend levantado
// todavía), sigue funcionando con la copia en localStorage como hasta ahora — sin romper nada.
import { useEffect, useState } from 'react';
import { api } from './api';
import { CLIENTS, type Client } from './mock';

const KEY = 'compven_clients';

function load(): Client[] {
  if (typeof window === 'undefined') return CLIENTS;
  const raw = localStorage.getItem(KEY);
  if (raw) return JSON.parse(raw);
  localStorage.setItem(KEY, JSON.stringify(CLIENTS));
  return CLIENTS;
}

/** El backend devuelve los campos del modelo Prisma; acá se completan los campos de UI (mock) que no existen ahí. */
export function fromBackend(bc: any): Client {
  const score = bc.leadScore ?? 0;
  return {
    id: bc.id,
    firstName: bc.firstName,
    lastName: bc.lastName ?? '',
    phone: bc.phone,
    city: bc.city ?? '',
    province: bc.province ?? '',
    stage: bc.stage ?? 'NUEVO_LEAD',
    product: bc.interestedProduct?.name ?? '',
    source: bc.source === 'META_ADS' ? 'META_ADS' : 'WHATSAPP',
    leadScore: score,
    intent: bc.buyingIntent ?? (score >= 70 ? 'ALTA' : score >= 45 ? 'MEDIA' : 'BAJA'),
    sentiment: bc.sentiment ?? 'NEUTRO',
    tags: (bc.tags ?? []).map((t: any) => ({ name: t.tag?.name ?? t.name, color: t.tag?.color ?? t.color })),
    lastInboundAt: bc.lastInboundAt ?? bc.lastContactAt ?? bc.createdAt ?? new Date().toISOString(),
    unread: 0,
    summary: bc.aiSummary ?? '',
    objection: bc.lastObjection ?? 'NINGUNA',
    seller: bc.assignedSeller?.fullName ?? '-',
    businessName: bc.businessName ?? undefined,
    cuit: bc.cuit ?? undefined,
    ivaCondition: bc.ivaCondition ?? 'CONSUMIDOR_FINAL',
    address: bc.address ?? undefined,
    postalCode: bc.postalCode ?? undefined,
    clientCode: bc.clientCode ?? undefined,
    condicionVenta: bc.condicionVenta ?? 'Contado',
  };
}

export function useClients() {
  const [clients, setClients] = useState<Client[]>(CLIENTS);
  const [source, setSource] = useState<'backend' | 'local'>('local');

  useEffect(() => {
    let cancelled = false;
    api.clients()
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data ?? res).map(fromBackend);
        setClients(rows);
        setSource('backend');
      })
      .catch(() => {
        if (!cancelled) { setClients(load()); setSource('local'); }
      });
    return () => { cancelled = true; };
  }, []);

  const save = (next: Client[]) => {
    setClients(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const addClient = async (c: Omit<Client, 'id'>) => {
    if (source === 'backend') {
      try {
        const created = await api.createClient({
          firstName: c.firstName, lastName: c.lastName, phone: c.phone, email: undefined,
          city: c.city, province: c.province, businessName: c.businessName, cuit: c.cuit,
          ivaCondition: c.ivaCondition, address: c.address, postalCode: c.postalCode,
          clientCode: c.clientCode, condicionVenta: c.condicionVenta,
        });
        const client = fromBackend(created);
        setClients((prev) => [client, ...prev]);
        return client;
      } catch {
        // si el POST falla igual lo dejamos ver localmente para no perder la carga
      }
    }
    const client: Client = { ...c, id: `c_${Date.now()}` };
    save([client, ...clients]);
    return client;
  };

  const updateClient = (id: string, patch: Partial<Client>) => {
    save(clients.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  return { clients, addClient, updateClient, source };
}
