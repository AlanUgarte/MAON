'use client';

// Mismo patrón que supremas-settings-store.ts: fila única compartida en el backend
// (GET público para el checkout, PATCH solo admin/supervisor).
import { useEffect, useRef, useState } from 'react';
import { api } from './api';

const SAVE_DEBOUNCE_MS = 600;

export interface VynoSettings {
  shippingFlatCost: number;
  paymentAlias: string;
  aboutText: string;
  privacyPolicy: string;
  termsAndConditions: string;
  returnsPolicy: string;
}

export const DEFAULT_VYNO_SETTINGS: VynoSettings = {
  shippingFlatCost: 0,
  paymentAlias: 'Alan.ugarte7',
  aboutText: '',
  privacyPolicy: '',
  termsAndConditions: '',
  returnsPolicy: '',
};

function sanitize(raw: any): VynoSettings {
  return {
    shippingFlatCost: Number(raw?.shippingFlatCost ?? 0),
    paymentAlias: raw?.paymentAlias ?? DEFAULT_VYNO_SETTINGS.paymentAlias,
    aboutText: raw?.aboutText ?? '',
    privacyPolicy: raw?.privacyPolicy ?? '',
    termsAndConditions: raw?.termsAndConditions ?? '',
    returnsPolicy: raw?.returnsPolicy ?? '',
  };
}

/** Pública — para el storefront de /vyno (sin login). */
export function useVynoSettingsPublic() {
  const [settings, setSettings] = useState<VynoSettings>(DEFAULT_VYNO_SETTINGS);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    api.vynoSettingsPublic()
      .then((res) => { if (!cancelled) setSettings(sanitize(res)); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);
  return { settings, loading };
}

/** Admin — para /vyno-config (requiere login). */
export function useVynoSettings() {
  const [settings, setSettings] = useState<VynoSettings>(DEFAULT_VYNO_SETTINGS);
  const [saveError, setSaveError] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.vynoSettings().then((res) => { if (!cancelled) setSettings(sanitize(res)); }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  const save = (next: VynoSettings) => {
    setSettings(next);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.updateVynoSettings(sanitize(next))
        .then(() => setSaveError(null))
        .catch((err) => setSaveError(err?.message || 'No se pudo guardar la configuración.'));
    }, SAVE_DEBOUNCE_MS);
  };

  return { settings, save, saveError };
}
