'use client';

// Catálogo completo (10.000+ productos reales del proveedor) se sirve como JSON
// estático desde /public en vez de bundlearlo en el JS.
//
// Antes esto se combinaba con una "semilla" de ~100 productos hardcodeados
// (mock.ts, con códigos de prueba tipo "TOP1") y esa semilla SIEMPRE ganaba para
// cualquier producto que coincidiera por nombre+marca. El problema real: esos
// códigos de prueba no existen en el backend, así que el checkout de la tienda
// pública fallaba en silencio para esos ~18 productos (varios de los más
// vendidos) — el pedido nunca quedaba registrado. Ahora el catálogo real
// reemplaza la semilla por completo apenas carga; la semilla queda solo como
// lo que se ve un instante mientras se hace el fetch (o si el fetch falla).
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
        setProducts(rows);
        setSource('full');
      })
      .catch(() => {}); // sin conexión: se queda con el catálogo semilla como último recurso
    return () => { cancelled = true; };
  }, []);

  return { products, source };
}
