'use client';

// ponytail: catálogo completo (7500+ productos reales de TYNA) se sirve como
// JSON estático desde /public en vez de bundlearlo en el JS — sin backend/DB
// todavía, esto evita inflar el bundle de cada página que usa productos.
import { useEffect, useState } from 'react';
import { PRODUCT_ROWS, type ProductRow } from './mock';

export function useProductCatalog() {
  const [products, setProducts] = useState<ProductRow[]>(PRODUCT_ROWS);
  const [source, setSource] = useState<'full' | 'seed'>('seed');

  useEffect(() => {
    let cancelled = false;
    fetch('/data/tyna-products.json')
      .then((r) => r.json())
      .then((rows: ProductRow[]) => {
        if (cancelled || !rows.length) return;
        // ponytail: red de seguridad contra duplicados (nombre+marca) si un futuro import se solapa con la semilla.
        const seedKeys = new Set(PRODUCT_ROWS.map((p) => `${p.name.trim().toUpperCase()}|${p.brand.trim().toUpperCase()}`));
        const deduped = rows.filter((p) => !seedKeys.has(`${p.name.trim().toUpperCase()}|${p.brand.trim().toUpperCase()}`));
        setProducts([...PRODUCT_ROWS, ...deduped]);
        setSource('full');
      })
      .catch(() => {}); // sin conexión: se queda con el catálogo semilla de siempre
    return () => { cancelled = true; };
  }, []);

  return { products, source };
}
