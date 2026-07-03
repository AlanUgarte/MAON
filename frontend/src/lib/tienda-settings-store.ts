'use client';

// ponytail: solo localStorage, no hay modelo de backend para config de tienda todavía.
import { useEffect, useState } from 'react';

const KEY = 'compven_tienda_settings';

export interface TiendaSettings {
  storeOpen: boolean;
  topBannerText: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  minCompra: number;
  envioGratisDesde: number;
  whatsappNumber: string;
  margenVenta: number;
  hiddenProductIds: string[];
}

export const DEFAULT_TIENDA_SETTINGS: TiendaSettings = {
  storeOpen: true,
  topBannerText: 'Envíos a todo el país · Atención por WhatsApp',
  heroBadge: 'Precios de mayorista, todo el año',
  heroTitle: 'Golosinas, galletitas y alfajores al por mayor',
  heroSubtitle: 'Armá tu pedido acá y confirmalo directo por WhatsApp — sin vueltas, sin registrarte.',
  minCompra: 50000,
  envioGratisDesde: 85000,
  whatsappNumber: '5493412708638',
  margenVenta: 0.30,
  hiddenProductIds: [],
};

function load(): TiendaSettings {
  if (typeof window === 'undefined') return DEFAULT_TIENDA_SETTINGS;
  const raw = localStorage.getItem(KEY);
  if (raw) return { ...DEFAULT_TIENDA_SETTINGS, ...JSON.parse(raw) };
  return DEFAULT_TIENDA_SETTINGS;
}

export function useTiendaSettings() {
  const [settings, setSettings] = useState<TiendaSettings>(DEFAULT_TIENDA_SETTINGS);

  useEffect(() => { setSettings(load()); }, []);

  const save = (next: TiendaSettings) => {
    setSettings(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  return { settings, save };
}
