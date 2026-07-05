'use client';

// Intenta el backend real (/clients) primero. Si no responde (sin DB/backend levantado
// todavía), sigue funcionando con la copia en localStorage como hasta ahora — sin romper nada.
import { useEffect, useState } from 'react';
import { api } from './api';
import { CLIENTS, type Client } from './mock';

const KEY = 'compven_clients';

// Los clientes de ejemplo tienen id "c_1".."c_N" (N = cantidad de nombres de mock.ts, siempre corto);
// los reales se crean como "c_<Date.now()>", un timestamp de 13+ dígitos. Sirve para poder
// limpiar los de ejemplo del localStorage de un usuario sin tocar los pedidos reales.
const DEMO_ID_RE = /^c_\d{1,4}$/;

function load(): Client[] {
  if (typeof window === 'undefined') return CLIENTS;
  const raw = localStorage.getItem(KEY);
  if (!raw) { localStorage.setItem(KEY, JSON.stringify(CLIENTS)); return CLIENTS; }
  const stored: Client[] = JSON.parse(raw);
  const real = stored.filter((c) => !DEMO_ID_RE.test(c.id));
  if (real.length !== stored.length) localStorage.setItem(KEY, JSON.stringify(real));
  return real;
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
    // Se parte de load() (lo que hay AHORA en localStorage), no del estado de React —
    // que puede seguir en el seed de demo si esto se llama antes de que el efecto de
    // carga real termine, y pisaría datos reales con el catálogo de ejemplo.
    const client: Client = { ...c, id: `c_${Date.now()}` };
    if (source === 'backend') {
      // El POST falló: se guarda local para no perder la carga, pero el estado en memoria
      // (que tiene los clientes del backend) se extiende en vez de pisarse con load().
      localStorage.setItem(KEY, JSON.stringify([client, ...load()]));
      setClients((prev) => [client, ...prev]);
    } else {
      save([client, ...load()]);
    }
    return client;
  };

  const updateClient = async (id: string, patch: Partial<Client>) => {
    if (source === 'backend') {
      // El estado vive en memoria (localStorage no tiene los clientes del backend):
      // pisarlo con load() haría desaparecer la lista hasta recargar la página.
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      try {
        await api.updateClient(id, {
          firstName: patch.firstName, lastName: patch.lastName, phone: patch.phone,
          city: patch.city, province: patch.province, businessName: patch.businessName, cuit: patch.cuit,
          ivaCondition: patch.ivaCondition, address: patch.address, postalCode: patch.postalCode,
          clientCode: patch.clientCode, condicionVenta: patch.condicionVenta,
        });
      } catch {
        // si falla el PATCH, el cambio queda igual reflejado en la UI (modo degradado)
      }
      return;
    }
    save(load().map((c) => (c.id === id ? { ...c, ...patch } : c)));
  };

  const deleteClient = async (id: string) => {
    if (source === 'backend') {
      setClients((prev) => prev.filter((c) => c.id !== id));
      try { await api.deleteClient(id); } catch { /* si falla el DELETE, lo sacamos igual de la vista */ }
      return;
    }
    save(load().filter((c) => c.id !== id));
  };

  return { clients, addClient, updateClient, deleteClient, source };
}
