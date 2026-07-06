'use client';

// Intenta el backend real (/tienda-settings) primero, igual que el resto de los stores.
// Antes esto vivía solo en localStorage: cada navegador/dispositivo tenía su propia config
// (banner, promos, productos ocultos...) y por eso un cliente real nunca veía lo que el
// admin configuraba desde su PC. Ahora hay una fila única compartida en la base.
import { useEffect, useRef, useState } from 'react';
import { api, getToken } from './api';

const KEY = 'compven_tienda_settings';
const SAVE_DEBOUNCE_MS = 600;

export interface ProductPromo {
  label?: string;       // texto libre para mostrar, ej: "2x1", "10+1 de regalo", "20% OFF"
  discountPct?: number; // descuento efectivo que se aplica al precio de venta (0-100)
  isNew?: boolean;      // aparece en "Novedades"
}

/** Un banner del carrusel principal o una tarjeta promocional chica — misma forma para ambos. */
export interface BannerImage {
  id: string;
  imageUrl: string;
  title?: string;  // uso interno (no se muestra al cliente), para identificarlo en el panel
  link?: string;   // opcional: a dónde va si lo tocan, ej. "/productos?marca=..."
  active: boolean;
  order: number;
}

export interface TiendaSettings {
  storeOpen: boolean;
  topBannerText: string;
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  /** URL de una imagen ya subida a otro lado (opcional). Si está, reemplaza el fondo generado del banner. */
  heroImageUrl?: string;
  /** Carrusel de imágenes del banner principal — si tiene algo activo, reemplaza el banner de texto+fotos. */
  heroCarousel: BannerImage[];
  /** Tarjetas promocionales chicas debajo del carrusel (ej. "Ofertas de la semana"). */
  promoCards: BannerImage[];
  minCompra: number;
  envioGratisDesde: number;
  whatsappNumber: string;
  margenVenta: number;
  hiddenProductIds: string[];
  productPromos: Record<string, ProductPromo>;
}

export const DEFAULT_TIENDA_SETTINGS: TiendaSettings = {
  storeOpen: true,
  topBannerText: 'Envíos a todo el país · Atención por WhatsApp',
  heroBadge: 'Precios de mayorista, todo el año',
  heroTitle: 'Tu mayorista online de confianza',
  heroSubtitle: 'Los mejores productos, al mejor precio. Ventas por bulto cerrado, envíos a todo el país y compra 100% segura.',
  heroCarousel: [],
  promoCards: [],
  minCompra: 50000,
  envioGratisDesde: 85000,
  whatsappNumber: '5493412708638',
  margenVenta: 0.12,
  hiddenProductIds: [],
  productPromos: {},
};

// El backend devuelve además "id"/"updatedAt" (campos propios de Prisma). Si se dejan pasar
// tal cual a `settings`, un save() posterior los manda de vuelta en el PATCH — y como el
// ValidationPipe tiene forbidNonWhitelisted, el backend rechaza TODO el request (400) sin que
// se note en la UI (el estado local sí se actualiza). Por eso acá se arma un objeto con
// exactamente los campos que espera el backend, nunca un spread de la respuesta cruda.
function sanitize(raw: any): TiendaSettings {
  return {
    storeOpen: raw?.storeOpen ?? DEFAULT_TIENDA_SETTINGS.storeOpen,
    topBannerText: raw?.topBannerText ?? DEFAULT_TIENDA_SETTINGS.topBannerText,
    heroBadge: raw?.heroBadge ?? DEFAULT_TIENDA_SETTINGS.heroBadge,
    heroTitle: raw?.heroTitle ?? DEFAULT_TIENDA_SETTINGS.heroTitle,
    heroSubtitle: raw?.heroSubtitle ?? DEFAULT_TIENDA_SETTINGS.heroSubtitle,
    heroImageUrl: raw?.heroImageUrl ?? undefined,
    heroCarousel: raw?.heroCarousel ?? [],
    promoCards: raw?.promoCards ?? [],
    minCompra: raw?.minCompra ?? DEFAULT_TIENDA_SETTINGS.minCompra,
    envioGratisDesde: raw?.envioGratisDesde ?? DEFAULT_TIENDA_SETTINGS.envioGratisDesde,
    whatsappNumber: raw?.whatsappNumber ?? DEFAULT_TIENDA_SETTINGS.whatsappNumber,
    margenVenta: raw?.margenVenta ?? DEFAULT_TIENDA_SETTINGS.margenVenta,
    hiddenProductIds: raw?.hiddenProductIds ?? [],
    productPromos: raw?.productPromos ?? {},
  };
}

function load(): TiendaSettings {
  if (typeof window === 'undefined') return DEFAULT_TIENDA_SETTINGS;
  const raw = localStorage.getItem(KEY);
  if (raw) return sanitize(JSON.parse(raw));
  return DEFAULT_TIENDA_SETTINGS;
}

function looksCustomized(s: TiendaSettings): boolean {
  return !!s.hiddenProductIds.length
    || !!Object.keys(s.productPromos).length
    || s.heroTitle !== DEFAULT_TIENDA_SETTINGS.heroTitle
    || s.heroSubtitle !== DEFAULT_TIENDA_SETTINGS.heroSubtitle;
}

export function useTiendaSettings() {
  const [settings, setSettings] = useState<TiendaSettings>(DEFAULT_TIENDA_SETTINGS);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    api.tiendaSettings()
      .then((res) => {
        if (cancelled) return;
        const fromBackend = sanitize(res);

        // Migración única: si esta cuenta configuró la tienda ANTES de que existiera este
        // endpoint, esa config sigue en el localStorage de este navegador. Si la base todavía
        // no tiene nada propio pero acá sí, se sube una sola vez en vez de perderla.
        const localRaw = localStorage.getItem(KEY);
        if (localRaw && !looksCustomized(fromBackend)) {
          const fromLocal = sanitize(JSON.parse(localRaw));
          if (looksCustomized(fromLocal)) {
            setSettings(fromLocal);
            api.updateTiendaSettings(fromLocal).catch(() => {});
            return;
          }
        }
        setSettings(fromBackend);
      })
      .catch(() => { if (!cancelled) setSettings(load()); });
    return () => { cancelled = true; };
  }, []);

  const save = (next: TiendaSettings) => {
    setSettings(next);
    localStorage.setItem(KEY, JSON.stringify(next));
    // tienda-config es una pantalla logueada (admin/supervisor/vendedor); la tienda pública
    // solo lee, nunca llama a save(). Sin token no tiene sentido intentar el PATCH.
    if (!getToken()) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      // sanitize() de nuevo acá: aunque `next` ya debería venir limpio, esto asegura que
      // jamás se manden campos extra al backend pase lo que pase río arriba.
      api.updateTiendaSettings(sanitize(next)).catch(() => {});
    }, SAVE_DEBOUNCE_MS);
  };

  return { settings, save };
}
