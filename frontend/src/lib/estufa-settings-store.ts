'use client';

// Config de la landing de la estufa (segunda tienda de prueba) — mismo patrón que
// tienda-settings-store.ts: intenta el backend real primero (fila compartida, se ve
// igual desde cualquier navegador), local solo como fallback si falla la carga.
import { useEffect, useRef, useState } from 'react';
import { api, getToken } from './api';

const KEY = 'compven_estufa_settings';
const SAVE_DEBOUNCE_MS = 600;

export interface EstufaSettings {
  storeOpen: boolean;
  topBannerText: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  /** Precio de costo. El de venta sale de aplicarle marginPct (mismo modelo que MAON). */
  cost: number;
  /** Fracción, no %: 0.3333 = 33.33% de margen. */
  marginPct: number;
  whatsappNumber: string;
}

export const DEFAULT_ESTUFA_SETTINGS: EstufaSettings = {
  storeOpen: true,
  topBannerText: 'Envíos a todo el país · Stock disponible',
  heroBadge: 'Calor instantáneo para tu casa',
  heroTitle: 'Estufa Halógena de Cuarzo',
  heroSubtitle: 'Calienta rápido cualquier ambiente chico o mediano, es liviana y se traslada fácil por toda la casa.',
  cost: 15000,
  marginPct: 0.3333,
  whatsappNumber: '5493412708638',
};

/** Precio de venta redondeado, a partir del costo + margen. */
export const sellPrice = (s: Pick<EstufaSettings, 'cost' | 'marginPct'>) => Math.round(s.cost * (1 + s.marginPct));

// El backend devuelve además "id"/"updatedAt" (campos propios de Prisma). Si se dejan
// pasar tal cual, un save() posterior los manda de vuelta en el PATCH y el backend
// rechaza el request entero (ValidationPipe con forbidNonWhitelisted) — mismo bug que
// ya se dio antes en tienda-settings-store.ts. Por eso acá también se sanitiza siempre.
function sanitize(raw: any): EstufaSettings {
  return {
    storeOpen: raw?.storeOpen ?? DEFAULT_ESTUFA_SETTINGS.storeOpen,
    topBannerText: raw?.topBannerText ?? DEFAULT_ESTUFA_SETTINGS.topBannerText,
    heroBadge: raw?.heroBadge ?? DEFAULT_ESTUFA_SETTINGS.heroBadge,
    heroTitle: raw?.heroTitle ?? DEFAULT_ESTUFA_SETTINGS.heroTitle,
    heroSubtitle: raw?.heroSubtitle ?? DEFAULT_ESTUFA_SETTINGS.heroSubtitle,
    cost: Number(raw?.cost ?? DEFAULT_ESTUFA_SETTINGS.cost),
    marginPct: Number(raw?.marginPct ?? DEFAULT_ESTUFA_SETTINGS.marginPct),
    whatsappNumber: raw?.whatsappNumber ?? DEFAULT_ESTUFA_SETTINGS.whatsappNumber,
  };
}

function load(): EstufaSettings {
  if (typeof window === 'undefined') return DEFAULT_ESTUFA_SETTINGS;
  const raw = localStorage.getItem(KEY);
  if (raw) return sanitize(JSON.parse(raw));
  return DEFAULT_ESTUFA_SETTINGS;
}

export function useEstufaSettings() {
  const [settings, setSettings] = useState<EstufaSettings>(DEFAULT_ESTUFA_SETTINGS);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.estufaSettings()
      .then((res) => {
        if (cancelled) return;
        setSettings(sanitize(res));
        setStatus('ready');
      })
      .catch(() => {
        if (cancelled) return;
        setSettings(load());
        setStatus('error');
      });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = (next: EstufaSettings) => {
    setSettings(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    if (!getToken()) return; // la landing pública solo lee, nunca guarda
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.updateEstufaSettings(sanitize(next)).catch(() => {});
    }, SAVE_DEBOUNCE_MS);
  };

  return { settings, save, status };
}
