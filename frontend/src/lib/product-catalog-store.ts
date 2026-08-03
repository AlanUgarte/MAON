'use client';

// Catálogo completo (10.000+ productos reales del proveedor) se lee en vivo desde el
// backend (endpoint público /catalog, sin login) — así cualquier cambio de precio, stock
// o producto hecho en la pantalla de Productos se ve reflejado al instante en la Tienda/
// Cotillón, sin tener que regenerar un JSON estático y hacer un redeploy a mano.
//
// Antes esto se combinaba con una "semilla" de ~100 productos hardcodeados
// (mock.ts, con códigos de prueba tipo "TOP1") y esa semilla SIEMPRE ganaba para
// cualquier producto que coincidiera por nombre+marca. El problema real: esos
// códigos de prueba no existen en el backend, así que el checkout de la tienda
// pública fallaba en silencio para esos ~18 productos (varios de los más
// vendidos) — el pedido nunca quedaba registrado. Ahora el catálogo real
// reemplaza la semilla por completo apenas carga; la semilla queda solo como
// lo que se ve un instante mientras se hace el fetch (o si el fetch falla).
import { useCallback, useEffect, useRef, useState } from 'react';
import { PRODUCT_ROWS, type ProductRow } from './mock';
import { API_URL } from './api';

export function useProductCatalog() {
  const [products, setProducts] = useState<ProductRow[]>(PRODUCT_ROWS);
  const [source, setSource] = useState<'full' | 'seed'>('seed');
  const [syncing, setSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    setSyncing(true);
    try {
      const rows: ProductRow[] = await fetch(`${API_URL}/catalog`).then((r) => r.json());
      if (!mounted.current || !rows.length) return;
      setProducts(rows);
      setSource('full');
      setLastSyncedAt(new Date());
    } catch {
      // sin conexión: se queda con lo que ya tenía cargado (semilla o el último catálogo bueno)
    } finally {
      if (mounted.current) setSyncing(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    refresh();
    return () => { mounted.current = false; };
  }, [refresh]);

  return { products, source, syncing, lastSyncedAt, refresh };
}
