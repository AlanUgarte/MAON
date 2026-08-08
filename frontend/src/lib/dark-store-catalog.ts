'use client';

// Combina el catálogo mayorista (filtrado a Bebidas/Snacks/Chocolates) con los Vapeadores
// (catálogo propio) en una sola lista con la misma forma, para que las páginas de Dark
// Store no tengan que distinguir el origen de cada artículo al renderizar/filtrar/buscar.
import { useMemo } from 'react';
import { useProductCatalog } from './product-catalog-store';
import { useDarkStoreVapes } from './dark-store-vapes-store';
import { darkStorePrice } from './dark-store-pricing';
import { normalizeLine } from './dark-store-lines';
import type { DarkStoreSettings } from './dark-store-settings-store';

export const DARK_STORE_CATEGORIES = ['Bebidas', 'Snacks', 'Chocolates', 'Vapeadores'] as const;
export type DarkStoreCategory = (typeof DARK_STORE_CATEGORIES)[number];

/** Categorías que se muestran en nav/home — Chocolates oculta por ahora a pedido de Alan. */
export const VISIBLE_CATEGORIES = DARK_STORE_CATEGORIES.filter((c) => c !== 'Chocolates');

// Mismo criterio que smallestUnitCost() en Productos: la unidad mínima de venta real no
// siempre es "unitPrice" — si el artículo no tiene eso pero sí Display suelto (sin
// Unidad/Zuncho), el Display es el costo real de una unidad. Antes esto se caía directo
// al precio de bulto entero, cobrando de más en cualquier artículo sin unitPrice.
export const darkStoreUnitCost = (p: { unitPrice?: number; displayPrice?: number; price: number }) =>
  p.unitPrice ?? p.displayPrice ?? p.price;
// Margen propio del artículo (compartido con Tienda vía Product.marginPct) si lo tiene;
// si no, el margen general de Dark Store.
export const darkStoreEffMargin = (p: { marginPct?: number }, settings: { margenPct: number }) =>
  p.marginPct ?? settings.margenPct;

export interface DarkStoreItem {
  kind: 'product' | 'vape';
  /** sku para product, id para vape — es lo que identifica la línea en el carrito. */
  id: string;
  name: string;
  brand: string;
  category: DarkStoreCategory;
  /** Subcategoría normalizada (Vinos, Gaseosas, Tabletas...) — ver dark-store-lines. */
  line: string;
  img: string;
  price: number;
  stock: number;
  featured: boolean;
  /** Solo vapes: sabores/variantes — si hay más de uno, el detalle muestra un desplegable. */
  flavors: string[];
}

export function useDarkStoreCatalog(settings: DarkStoreSettings) {
  const { products, syncing: syncingProducts } = useProductCatalog();
  const { vapes, loading: loadingVapes } = useDarkStoreVapes();

  const items = useMemo<DarkStoreItem[]>(() => {
    const fromProducts: DarkStoreItem[] = products
      .filter((p) => (p.category === 'Bebidas' || p.category === 'Snacks' || p.category === 'Chocolates') && !settings.hiddenProductIds.includes(p.id))
      .map((p) => ({
        kind: 'product',
        id: p.sku,
        name: p.name,
        brand: p.brand,
        category: p.category as DarkStoreCategory,
        line: normalizeLine(p.line),
        img: p.img,
        // Dark Store vende unidad suelta: costo real de unidad (mismo dato que usa
        // Tienda) + margen propio del artículo si lo tiene, si no el general de la tienda.
        price: darkStorePrice(darkStoreUnitCost(p), darkStoreEffMargin(p, settings)),
        stock: p.stock,
        featured: false,
        flavors: [],
      }));

    const fromVapes: DarkStoreItem[] = vapes.map((v) => ({
      kind: 'vape',
      id: v.id,
      name: v.name,
      brand: v.brand ?? '-',
      category: 'Vapeadores',
      // Los vapes no traen "línea" del proveedor: la marca es el corte natural para filtrarlos.
      line: normalizeLine(v.brand),
      img: v.images[0] ?? '',
      // v.price es siempre el precio final ya calculado — si el admin cargó costo+margen,
      // el panel de Vapeadores ya lo recalculó y lo guardó ahí, no hay que rehacerlo acá.
      price: v.price,
      stock: v.stock,
      featured: v.featured,
      flavors: v.flavors,
    }));

    return [...fromProducts, ...fromVapes];
  }, [products, vapes, settings.hiddenProductIds, settings.margenPct]);

  return { items, loading: syncingProducts || loadingVapes };
}
