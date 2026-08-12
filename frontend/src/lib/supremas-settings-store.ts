'use client';

// Mismo patrón que dark-store-settings-store.ts: fila única compartida en el backend
// (GET para cualquier rol logueado, PATCH solo admin/supervisor), con fallback a
// localStorage si el fetch falla.
import { useEffect, useRef, useState } from 'react';
import { api } from './api';

const KEY = 'compven_supremas_settings';
const SAVE_DEBOUNCE_MS = 600;

export interface SupremasSettings {
  priceConsumidorFinal: number;
  priceKiosco: number;
  priceMayorista: number;
  kioscoMinKg: number;
  mayoristaMinKg: number;
  envaseCostPerKg: number;
  pechugaBaseKg: number;
  produccionBaseKg: number;
  blockNegativeStock: boolean;
}

export const DEFAULT_SUPREMAS_SETTINGS: SupremasSettings = {
  priceConsumidorFinal: 7000,
  priceKiosco: 6500,
  priceMayorista: 6000,
  kioscoMinKg: 6,
  mayoristaMinKg: 16,
  envaseCostPerKg: 500,
  pechugaBaseKg: 5,
  produccionBaseKg: 9,
  blockNegativeStock: false,
};

function sanitize(raw: any): SupremasSettings {
  return {
    priceConsumidorFinal: Number(raw?.priceConsumidorFinal ?? DEFAULT_SUPREMAS_SETTINGS.priceConsumidorFinal),
    priceKiosco: Number(raw?.priceKiosco ?? DEFAULT_SUPREMAS_SETTINGS.priceKiosco),
    priceMayorista: Number(raw?.priceMayorista ?? DEFAULT_SUPREMAS_SETTINGS.priceMayorista),
    kioscoMinKg: Number(raw?.kioscoMinKg ?? DEFAULT_SUPREMAS_SETTINGS.kioscoMinKg),
    mayoristaMinKg: Number(raw?.mayoristaMinKg ?? DEFAULT_SUPREMAS_SETTINGS.mayoristaMinKg),
    envaseCostPerKg: Number(raw?.envaseCostPerKg ?? DEFAULT_SUPREMAS_SETTINGS.envaseCostPerKg),
    pechugaBaseKg: Number(raw?.pechugaBaseKg ?? DEFAULT_SUPREMAS_SETTINGS.pechugaBaseKg),
    produccionBaseKg: Number(raw?.produccionBaseKg ?? DEFAULT_SUPREMAS_SETTINGS.produccionBaseKg),
    blockNegativeStock: !!raw?.blockNegativeStock,
  };
}

function load(): SupremasSettings {
  if (typeof window === 'undefined') return DEFAULT_SUPREMAS_SETTINGS;
  const raw = localStorage.getItem(KEY);
  if (raw) return sanitize(JSON.parse(raw));
  return DEFAULT_SUPREMAS_SETTINGS;
}

export function useSupremasSettings() {
  const [settings, setSettings] = useState<SupremasSettings>(load);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.supremasSettings()
      .then((res) => { if (!cancelled) setSettings(sanitize(res)); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const save = (next: SupremasSettings) => {
    setSettings(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.updateSupremasSettings(sanitize(next))
        .then(() => setSaveError(null))
        .catch((err) => setSaveError(err?.message || 'No se pudo guardar la configuración.'));
    }, SAVE_DEBOUNCE_MS);
  };

  return { settings, save, saveError };
}
