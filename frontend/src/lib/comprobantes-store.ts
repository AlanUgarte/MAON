'use client';

// ponytail: antes el libro de comprobantes vivía solo en memoria (se perdía al recargar
// o navegar). Ahora se persiste en localStorage, igual que clientes/pedidos, para que
// Facturación y el Dashboard vean los mismos datos reales.
import { useEffect, useState } from 'react';
import type { Client } from './mock';

export type Tipo = 'FACTURA' | 'REMITO' | 'NOTA_CREDITO' | 'NOTA_CREDITO_REMITO';
export type Letra = 'A' | 'B' | 'C' | 'R';

export const TIPO_LABEL: Record<Tipo, string> = {
  FACTURA: 'Factura',
  REMITO: 'Remito',
  NOTA_CREDITO: 'Nota de crédito',
  NOTA_CREDITO_REMITO: 'Nota de crédito en remito',
};
export const PREFIX: Record<Tipo, string> = { FACTURA: 'FC', REMITO: 'RE', NOTA_CREDITO: 'NC', NOTA_CREDITO_REMITO: 'NCR' };
// Letras válidas por tipo: factura/N.C. son fiscales (A/B/C), remitos no son válidos como factura (R)
export const LETRAS_POR_TIPO: Record<Tipo, Letra[]> = {
  FACTURA: ['A', 'B', 'C'],
  NOTA_CREDITO: ['A', 'B', 'C'],
  REMITO: ['R'],
  NOTA_CREDITO_REMITO: ['R'],
};

export interface Item { detalle: string; cantidad: number; unitPrice: number; subtotal: number; ivaRate: number }
export interface IvaGroup { rate: number; neto: number; importe: number }
export interface Comprobante {
  numero: string; fecha: string; tipo: Tipo; letra: Letra;
  clientId: string; client: Client; seller: string;
  items: Item[]; subtotal: number; ivaGroups: IvaGroup[]; iva: number; total: number; sign: number;
  cae?: string; caeVto?: string;
}

const KEY = 'compven_comprobantes';

function load(): Comprobante[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(KEY);
  return raw ? JSON.parse(raw) : [];
}

export function useComprobantesStore() {
  const [comprobantes, setComprobantesState] = useState<Comprobante[]>([]);
  useEffect(() => setComprobantesState(load()), []);

  const setComprobantes = (next: Comprobante[]) => {
    setComprobantesState(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };

  const addComprobante = (entry: Comprobante) => {
    const next = [entry, ...load()];
    setComprobantes(next);
  };

  return { comprobantes, setComprobantes, addComprobante };
}
