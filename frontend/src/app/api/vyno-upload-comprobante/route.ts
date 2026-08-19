import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

const MAX_BYTES = 8 * 1024 * 1024; // 8MB, cómodo para una foto de comprobante o un PDF
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/** Sube el comprobante de transferencia de un pedido VYNO. A diferencia de
 * api/upload/route.ts (banners del CRM, requiere login), esta es pública a propósito:
 * el cliente que compra no tiene sesión. El límite de tipo/tamaño de archivo es la
 * única protección contra abuso — el endpoint de backend que la referencia
 * (POST /vyno-orders/:id/payment) además está detrás de rate limit. */
export async function POST(req: NextRequest) {
  const form = await req.formData();
  const file = form.get('file');
  if (!(file instanceof File)) return NextResponse.json({ message: 'Falta el archivo' }, { status: 400 });
  if (!ALLOWED_TYPES.includes(file.type)) return NextResponse.json({ message: 'Solo se aceptan imágenes (JPG/PNG/WEBP) o PDF' }, { status: 400 });
  if (file.size > MAX_BYTES) return NextResponse.json({ message: 'El archivo no puede pesar más de 8MB' }, { status: 400 });

  const blob = await put(`vyno/comprobantes/${Date.now()}-${file.name}`, file, { access: 'public', addRandomSuffix: true });
  return NextResponse.json({ url: blob.url });
}
