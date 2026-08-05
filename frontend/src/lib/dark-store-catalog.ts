'use client';

// Combina el catálogo mayorista (filtrado a Bebidas/Snacks/Chocolates) con los Vapeadores
// (catálogo propio) en una sola lista con la misma forma, para que las páginas de Dark
// Store no tengan que distinguir el origen de cada artículo al renderizar/filtrar/buscar.
import { useMemo } from 'react';
import { useProductCatalog } from './product-catalog-store';
import { useDarkStoreVapes } from './dark-store-vapes-store';
import { darkStorePrice } from './dark-store-pricing';
import type { DarkStoreSettings } from './dark-store-settings-store';

export const DARK_STORE_CATEGORIES = ['Bebidas', 'Snacks', 'Chocolates', 'Vapeadores'] as const;
export type DarkStoreCategory = (typeof DARK_STORE_CATEGORIES)[number];

export interface DarkStoreItem {
  kind: 'product' | 'vape';
  /** sku para product, id para vape — es lo que identifica la línea en el carrito. */
  id: string;
  name: string;
  brand: string;
  category: DarkStoreCategory;
  img: string;
  price: number;
  stock: number;
  featured: boolean;
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
        img: p.img,
        // Dark Store vende unidad suelta: si el artículo tiene costo real de unidad
        // (mismo dato que usa /tienda), se usa ese; si no, no hay forma de vender "uno
        // solo" a un precio real y se cae al costo de bulto (referencia, no ideal).
        price: darkStorePrice(p.unitPrice ?? p.price, settings.margenPct),
        stock: p.stock,
        featured: false,
      }));

    const fromVapes: DarkStoreItem[] = vapes.map((v) => ({
      kind: 'vape',
      id: v.id,
      name: v.name,
      brand: v.brand ?? '-',
      category: 'Vapeadores',
      img: v.images[0] ?? '',
      // Los vapeadores no tienen costo/margen: el admin carga el precio final directo.
      price: v.price,
      stock: v.stock,
      featured: v.featured,
    }));

    return [...fromProducts, ...fromVapes];
  }, [products, vapes, settings.hiddenProductIds, settings.margenPct]);

  return { items, loading: syncingProducts || loadingVapes };
}
