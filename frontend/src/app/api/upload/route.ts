import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const MAX_BYTES = 4 * 1024 * 1024; // 4MB, cómodo para banners y bajo el límite de body de Vercel

/** Sube una imagen a Vercel Blob (banners/tarjetas de la tienda, comprobantes del sorteo).
 *
 * Dos formas de autorizar la subida, nunca abierta:
 * - Con token del CRM: reusa el mismo token para validar contra el backend real en vez
 *   de reimplementar la verificación de JWT acá.
 * - Con `sorteoOrderId`: el comprador del sorteo no tiene login, así que lo que habilita
 *   la subida es tener el id (cuid, no adivinable) de una compra que existe de verdad.
 *   La compra ya se creó pasando por el throttle del backend.
 */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  const sorteoOrderId = form.get('sorteoOrderId');
  const auth = req.headers.get('authorization');

  if (typeof sorteoOrderId === 'string' && sorteoOrderId) {
    const order = await fetch(`${API_URL}/sorteo/orders/${encodeURIComponent(sorteoOrderId)}/public`).catch(() => null);
    if (!order || !order.ok) return NextResponse.json({ message: 'Compra no encontrada' }, { status: 404 });
  } else {
    if (!auth) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
    const me = await fetch(`${API_URL}/auth/me`, { headers: { authorization: auth } }).catch(() => null);
    if (!me || !me.ok) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });
  }

  if (!(file instanceof File)) return NextResponse.json({ message: 'Falta el archivo' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ message: 'Solo se aceptan imágenes' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ message: 'La imagen no puede pesar más de 4MB' }, { status: 400 });

  const folder = typeof sorteoOrderId === 'string' && sorteoOrderId ? 'sorteo' : 'tienda';
  const blob = await put(`${folder}/${Date.now()}-${file.name}`, file, { access: 'public', addRandomSuffix: true });
  return NextResponse.json({ url: blob.url });
}
