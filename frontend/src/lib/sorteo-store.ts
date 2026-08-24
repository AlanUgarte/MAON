'use client';

// Mismo patrón que insumos-*-store.ts: hooks finos sobre el cliente HTTP, sin estado
// global. El sorteo es una sola entidad (settings singleton + paquetes + órdenes),
// así que va todo en un store en vez de tres.
import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from './api';

const SAVE_DEBOUNCE_MS = 600;

export type SorteoOrderStatus = 'PENDIENTE' | 'APROBADO' | 'RECHAZADO';

export interface SorteoSettings {
  edition: number;
  title: string;
  prize: string;
  images: string[];
  totalNumbers: number;
  drawDate: string;
  drawWhere: string;
  blessedNumbers: number[];
  blessedPrize: string;
  paymentAlias: string;
  paymentHolder: string;
  whatsappNumber: string;
  isActive: boolean;
}

export interface SorteoPackage {
  id: string;
  chances: number;
  price: number;
  isPopular: boolean;
}

export interface SorteoOrder {
  id: string;
  orderNumber: string;
  status: SorteoOrderStatus;
  buyerName: string;
  buyerEmail: string;
  buyerPhone: string;
  chances: number;
  amount: number;
  receiptUrl?: string | null;
  holderName?: string | null;
  createdAt: string;
  approvedAt?: string | null;
  approvedBy?: { fullName: string } | null;
  numbers: { number: number }[];
}

export const DEFAULT_SORTEO_SETTINGS: SorteoSettings = {
  edition: 1,
  title: '',
  prize: '',
  images: [],
  totalNumbers: 10000,
  drawDate: '',
  drawWhere: '',
  blessedNumbers: [],
  blessedPrize: '',
  paymentAlias: '',
  paymentHolder: '',
  whatsappNumber: '',
  isActive: true,
};

function sanitize(raw: any): SorteoSettings {
  return {
    edition: Number(raw?.edition ?? 1),
    title: raw?.title ?? '',
    prize: raw?.prize ?? '',
    images: Array.isArray(raw?.images) ? raw.images : [],
    totalNumbers: Number(raw?.totalNumbers ?? 10000),
    drawDate: raw?.drawDate ?? '',
    drawWhere: raw?.drawWhere ?? '',
    blessedNumbers: Array.isArray(raw?.blessedNumbers) ? raw.blessedNumbers.map(Number) : [],
    blessedPrize: raw?.blessedPrize ?? '',
    paymentAlias: raw?.paymentAlias ?? '',
    paymentHolder: raw?.paymentHolder ?? '',
    whatsappNumber: raw?.whatsappNumber ?? '',
    isActive: raw?.isActive !== false,
  };
}

/** Config del sorteo (admin). Guarda con debounce, igual que insumos. */
export function useSorteoSettings() {
  const [settings, setSettings] = useState<SorteoSettings>(DEFAULT_SORTEO_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.sorteoSettings()
      .then((res) => { if (!cancelled) setSettings(sanitize(res)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const save = (next: SorteoSettings) => {
    setSettings(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // `edition` no se toca por acá: se cambia solo con "arrancar sorteo nuevo".
      const { edition, ...patch } = next;
      api.updateSorteoSettings(patch)
        .then(() => setSaveError(null))
        .catch((err) => setSaveError(err?.message || 'No se pudo guardar la configuración.'));
    }, SAVE_DEBOUNCE_MS);
  };

  const nextEdition = async () => {
    const res = await api.sorteoNextEdition();
    setSettings(sanitize(res));
  };

  return { settings, loading, save, saveError, nextEdition };
}

export function useSorteoPackages() {
  const [packages, setPackages] = useState<SorteoPackage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const rows = await api.sorteoPackages();
      setPackages(rows.filter((p: any) => p.isActive).map((p: any) => ({
        id: p.id, chances: p.chances, price: Number(p.price), isPopular: p.isPopular,
      })));
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar los paquetes.');
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const replace = async (rows: { chances: number; price: number; isPopular?: boolean }[]) => {
    await api.replaceSorteoPackages(rows);
    await refresh();
  };

  return { packages, error, refresh, replace };
}

export function useSorteoOrders() {
  const [orders, setOrders] = useState<SorteoOrder[]>([]);
  const [status, setStatus] = useState<string>('PENDIENTE');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await api.sorteoOrders(status, query);
      setOrders(rows.map((o: any) => ({ ...o, amount: Number(o.amount) })));
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'No se pudieron cargar las compras.');
    } finally { setLoading(false); }
  }, [status, query]);

  useEffect(() => { refresh(); }, [refresh]);

  const approve = async (id: string) => { await api.approveSorteoOrder(id); await refresh(); };
  const reject = async (id: string) => { await api.rejectSorteoOrder(id); await refresh(); };

  return { orders, loading, error, status, setStatus, query, setQuery, refresh, approve, reject };
}
