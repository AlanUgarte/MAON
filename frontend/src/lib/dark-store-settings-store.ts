'use client';

// Mismo patrón que tienda-settings-store.ts: fila compartida en el backend (GET público,
// PATCH atrás de login), con fallback a localStorage si el fetch falla. Sin la migración
// de localStorage->backend de Tienda porque Dark Store es nuevo, no tiene config vieja
// que rescatar.
import { useEffect, useRef, useState } from 'react';
import { api, getToken } from './api';
import type { BannerImage } from './tienda-settings-store';

const KEY = 'compven_dark_store_settings';
const SAVE_DEBOUNCE_MS = 600;

export interface DarkStoreSettings {
  storeOpen: boolean;
  storeName: string;
  tagline: string;
  logoUrl?: string;
  heroCarousel: BannerImage[];
  promoCards: BannerImage[];
  /** "HH:mm", America/Argentina/Buenos_Aires */
  scheduleStart: string;
  scheduleEnd: string;
  deliveryEtaMinutes: number;
  /** Costo de envío fijo (no varía por distancia ni por monto del pedido). */
  deliveryFee: number;
  deliveryBarrios: string[];
  /** Porcentaje (25 = 25%), no fracción. */
  margenPct: number;
  lowStockThreshold: number;
  minOrderAmount: number;
  maxOrderAmount?: number;
  whatsappNumber: string;
  whatsappTemplate?: string;
  /** Alias bancario para transferencias — se adjunta al mensaje de WhatsApp del pedido. */
  paymentAlias: string;
  hiddenProductIds: string[];
}

export const DEFAULT_DARK_STORE_SETTINGS: DarkStoreSettings = {
  storeOpen: true,
  storeName: 'MAON Dark Store',
  tagline: 'Tu pedido en hasta 20 minutos.',
  heroCarousel: [],
  promoCards: [],
  scheduleStart: '18:00',
  scheduleEnd: '23:00',
  deliveryEtaMinutes: 20,
  deliveryFee: 2000,
  deliveryBarrios: ['Las Malvinas', 'Refinería', 'Luis Agote', 'Alberto Olmedo', 'Azcuénaga', 'Barrio Parque', 'Centro', 'Bella Vista', 'Latinoamérica', 'Puerto Norte'],
  margenPct: 25,
  lowStockThreshold: 5,
  minOrderAmount: 0,
  whatsappNumber: '5493413807110',
  paymentAlias: 'Alan.ugarte7',
  hiddenProductIds: [],
};

// El backend devuelve además id/updatedAt — no se reenvían en el PATCH (forbidNonWhitelisted).
function sanitize(raw: any): DarkStoreSettings {
  return {
    storeOpen: raw?.storeOpen ?? DEFAULT_DARK_STORE_SETTINGS.storeOpen,
    storeName: raw?.storeName ?? DEFAULT_DARK_STORE_SETTINGS.storeName,
    tagline: raw?.tagline ?? DEFAULT_DARK_STORE_SETTINGS.tagline,
    logoUrl: raw?.logoUrl ?? undefined,
    heroCarousel: raw?.heroCarousel ?? [],
    promoCards: raw?.promoCards ?? [],
    scheduleStart: raw?.scheduleStart ?? DEFAULT_DARK_STORE_SETTINGS.scheduleStart,
    scheduleEnd: raw?.scheduleEnd ?? DEFAULT_DARK_STORE_SETTINGS.scheduleEnd,
    deliveryEtaMinutes: raw?.deliveryEtaMinutes ?? DEFAULT_DARK_STORE_SETTINGS.deliveryEtaMinutes,
    deliveryFee: raw?.deliveryFee ?? DEFAULT_DARK_STORE_SETTINGS.deliveryFee,
    deliveryBarrios: raw?.deliveryBarrios?.length ? raw.deliveryBarrios : DEFAULT_DARK_STORE_SETTINGS.deliveryBarrios,
    margenPct: raw?.margenPct ?? DEFAULT_DARK_STORE_SETTINGS.margenPct,
    lowStockThreshold: raw?.lowStockThreshold ?? DEFAULT_DARK_STORE_SETTINGS.lowStockThreshold,
    minOrderAmount: raw?.minOrderAmount ?? DEFAULT_DARK_STORE_SETTINGS.minOrderAmount,
    maxOrderAmount: raw?.maxOrderAmount ?? undefined,
    whatsappNumber: raw?.whatsappNumber ?? DEFAULT_DARK_STORE_SETTINGS.whatsappNumber,
    whatsappTemplate: raw?.whatsappTemplate ?? undefined,
    paymentAlias: raw?.paymentAlias ?? DEFAULT_DARK_STORE_SETTINGS.paymentAlias,
    hiddenProductIds: raw?.hiddenProductIds ?? [],
  };
}

function load(): DarkStoreSettings {
  if (typeof window === 'undefined') return DEFAULT_DARK_STORE_SETTINGS;
  const raw = localStorage.getItem(KEY);
  if (raw) return sanitize(JSON.parse(raw));
  return DEFAULT_DARK_STORE_SETTINGS;
}

export function useDarkStoreSettings() {
  const [settings, setSettings] = useState<DarkStoreSettings>(DEFAULT_DARK_STORE_SETTINGS);
  // Antes el error del PATCH se tragaba en silencio (.catch(() => {})): si el guardado
  // fallaba (ej. sesión vencida), el panel igual mostraba "Guardado" — no había forma de
  // notarlo hasta que se perdía un cambio real, como pasó acá con el horario.
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.darkStoreSettings()
      .then((res) => { if (!cancelled) setSettings(sanitize(res)); })
      .catch(() => { if (!cancelled) setSettings(load()); });
    return () => { cancelled = true; };
  }, []);

  const save = (next: DarkStoreSettings) => {
    setSettings(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    // El panel admin es una pantalla logueada; la tienda pública solo lee, nunca llama a save().
    if (!getToken()) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.updateDarkStoreSettings(sanitize(next))
        .then(() => setSaveError(null))
        .catch((err) => setSaveError(err?.message || 'No se pudo guardar — probá recargar la página e iniciar sesión de nuevo.'));
    }, SAVE_DEBOUNCE_MS);
  };

  return { settings, save, saveError };
}
