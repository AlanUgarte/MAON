'use client';

// Config de /cotillon (FastCotillón, ex sitio FastCombos separado, unificada acá) — mismo
// patrón que tienda-settings-store.ts: catálogo real (categoría "Cotillon"), no un producto
// único como Estufa, así que comparte forma con TiendaSettings.
import { useEffect, useRef, useState } from 'react';
import { api, getToken } from './api';
import type { BannerImage, ProductPromo } from './tienda-settings-store';

const KEY = 'compven_cotillon_settings';
const SAVE_DEBOUNCE_MS = 600;

export type { BannerImage, ProductPromo };

export interface CotillonSettings {
  storeOpen: boolean;
  topBannerText: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  heroImageUrl?: string;
  heroCarousel: BannerImage[];
  promoCards: BannerImage[];
  minCompra: number;
  envioGratisDesde: number;
  whatsappNumber: string;
  margenVenta: number;
  hiddenProductIds: string[];
  productPromos: Record<string, ProductPromo>;
}

export const DEFAULT_COTILLON_SETTINGS: CotillonSettings = {
  storeOpen: true,
  topBannerText: 'Cotillón para tu fiesta · Envíos a todo el país',
  heroBadge: 'Cotillón para tu fiesta',
  heroTitle: 'Todo el cotillón para tu evento',
  heroSubtitle: 'Globos, decoración, disfraces y accesorios al por mayor. Armá tu pedido y confirmalo por WhatsApp.',
  heroCarousel: [],
  promoCards: [],
  minCompra: 30000,
  envioGratisDesde: 60000,
  whatsappNumber: '5493412708638',
  margenVenta: 0.3,
  hiddenProductIds: [],
  productPromos: {},
};

// Mismo motivo que tienda-settings-store.ts: nunca reenviar campos crudos del backend
// (id/updatedAt) en un PATCH, el ValidationPipe con forbidNonWhitelisted rechaza todo el request.
function sanitize(raw: any): CotillonSettings {
  return {
    storeOpen: raw?.storeOpen ?? DEFAULT_COTILLON_SETTINGS.storeOpen,
    topBannerText: raw?.topBannerText ?? DEFAULT_COTILLON_SETTINGS.topBannerText,
    heroBadge: raw?.heroBadge ?? DEFAULT_COTILLON_SETTINGS.heroBadge,
    heroTitle: raw?.heroTitle ?? DEFAULT_COTILLON_SETTINGS.heroTitle,
    heroSubtitle: raw?.heroSubtitle ?? DEFAULT_COTILLON_SETTINGS.heroSubtitle,
    heroImageUrl: raw?.heroImageUrl ?? undefined,
    heroCarousel: raw?.heroCarousel ?? [],
    promoCards: raw?.promoCards ?? [],
    minCompra: raw?.minCompra ?? DEFAULT_COTILLON_SETTINGS.minCompra,
    envioGratisDesde: raw?.envioGratisDesde ?? DEFAULT_COTILLON_SETTINGS.envioGratisDesde,
    whatsappNumber: raw?.whatsappNumber ?? DEFAULT_COTILLON_SETTINGS.whatsappNumber,
    margenVenta: raw?.margenVenta ?? DEFAULT_COTILLON_SETTINGS.margenVenta,
    hiddenProductIds: raw?.hiddenProductIds ?? [],
    productPromos: raw?.productPromos ?? {},
  };
}

function load(): CotillonSettings {
  if (typeof window === 'undefined') return DEFAULT_COTILLON_SETTINGS;
  const raw = localStorage.getItem(KEY);
  if (raw) return sanitize(JSON.parse(raw));
  return DEFAULT_COTILLON_SETTINGS;
}

export function useCotillonSettings() {
  const [settings, setSettings] = useState<CotillonSettings>(DEFAULT_COTILLON_SETTINGS);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.cotillonSettings()
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
  }, []);

  const save = (next: CotillonSettings) => {
    setSettings(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    if (!getToken()) return; // la landing pública solo lee, nunca guarda
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      api.updateCotillonSettings(sanitize(next)).catch(() => {});
    }, SAVE_DEBOUNCE_MS);
  };

  return { settings, save, status };
}
