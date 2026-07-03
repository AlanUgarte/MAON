'use client';

// ponytail: solo localStorage, no hay modelo de backend para config de tienda todavía.
import { useEffect, useState } from 'react';

const KEY = 'compven_tienda_settings';

export interface TiendaSettings {
  topBannerText: string;
  minCompra: number;
  envioGratisDesde: number;
  whatsappNumber: string;
  margenVenta: number;
}

export const DEFAULT_TIENDA_SETTINGS: TiendaSettings = {
  topBannerText: 'Envíos a todo el país · Atención por WhatsApp',
  minCompra: 50000,
  envioGratisDesde: 85000,
  whatsappNumber: '5493412708638',
  margenVenta: 0.30,
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
