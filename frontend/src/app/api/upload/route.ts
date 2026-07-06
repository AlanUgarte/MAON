import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
const MAX_BYTES = 4 * 1024 * 1024; // 4MB, cómodo para banners y bajo el límite de body de Vercel

/** Sube una imagen a Vercel Blob (banners/tarjetas de la tienda). Requiere estar logueado
 * en el CRM: reusa el mismo token para validar contra el backend real en vez de reimplementar
 * la verificación de JWT acá. */
export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization');
  if (!auth) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const me = await fetch(`${API_URL}/auth/me`, { headers: { authorization: auth } }).catch(() => null);
  if (!me || !me.ok) return NextResponse.json({ message: 'No autenticado' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ message: 'Falta el archivo' }, { status: 400 });
  if (!file.type.startsWith('image/')) return NextResponse.json({ message: 'Solo se aceptan imágenes' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ message: 'La imagen no puede pesar más de 4MB' }, { status: 400 });

  const blob = await put(`tienda/${Date.now()}-${file.name}`, file, { access: 'public', addRandomSuffix: true });
  return NextResponse.json({ url: blob.url });
}
