import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatARS(value: number): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('es-AR').format(value);
}

export function timeAgo(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
  if (seconds < 60) return 'recién';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `hace ${days} d`;
  return d.toLocaleDateString('es-AR');
}

export function initials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join('');
}

// ponytail: no hay spellout de números en Intl para es-AR, implementación acotada a < 1000 millones (de sobra para un comprobante)
const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve'];
const DIECIS = ['diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve'];
const VEINTIS = ['veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const DECENAS = ['', '', 'veinte', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function tresDigitos(n: number): string {
  if (n === 100) return 'cien';
  const c = Math.floor(n / 100);
  const resto = n % 100;
  let str = c > 0 ? `${CENTENAS[c]} ` : '';
  if (resto === 0) return str.trim();
  if (resto < 10) str += UNIDADES[resto];
  else if (resto < 20) str += DIECIS[resto - 10];
  else if (resto < 30) str += VEINTIS[resto - 20];
  else {
    const d = Math.floor(resto / 10);
    const u = resto % 10;
    str += DECENAS[d] + (u > 0 ? ` y ${UNIDADES[u]}` : '');
  }
  return str.trim();
}

export function numberToWords(value: number): string {
  const n = Math.floor(value);
  if (n === 0) return 'cero';
  const millones = Math.floor(n / 1_000_000);
  const miles = Math.floor((n % 1_000_000) / 1000);
  const resto = n % 1000;
  const parts: string[] = [];
  // "uno" apocopa a "un" delante de "mil"/"millones" (ej: veintiún mil, no veintiuno mil)
  if (millones > 0) parts.push(millones === 1 ? 'un millón' : `${tresDigitos(millones).replace(/uno$/, 'ún')} millones`);
  if (miles > 0) parts.push(miles === 1 ? 'mil' : `${tresDigitos(miles).replace(/uno$/, 'ún')} mil`);
  if (resto > 0) parts.push(tresDigitos(resto));
  return parts.join(' ').trim();
}

/** "Son Pesos Argentinos: Ciento Veinte Mil Con 50/100" */
export function pesosEnLetras(amount: number): string {
  const entero = Math.floor(amount);
  const centavos = Math.round((amount - entero) * 100);
  const words = numberToWords(entero).split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return `Son Peso Argentino: ${words} Con ${String(centavos).padStart(2, '0')}/100`;
}
