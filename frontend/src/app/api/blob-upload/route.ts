import { NextRequest, NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/** Subida directa del navegador a Vercel Blob.
 *
 * El video del premio no puede pasar por /api/upload: ese sube el archivo a través
 * de la función serverless, que tiene un tope de ~4.5MB de body — un video de 15
 * segundos lo supera fácil. Acá el navegador sube directo a Blob y esta ruta solo
 * firma el permiso, después de confirmar contra el backend que quien pide es un
 * usuario del CRM.
 */
export async function POST(req: NextRequest) {
  const body = (await req.json()) as HandleUploadBody;
  const auth = req.headers.get('authorization');

  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async () => {
        if (!auth) throw new Error('No autenticado');
        const me = await fetch(`${API_URL}/auth/me`, { headers: { authorization: auth } }).catch(() => null);
        if (!me || !me.ok) throw new Error('No autenticado');
        return {
          allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'],
          maximumSizeInBytes: 200 * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
      // Se llama desde Vercel cuando termina la subida; no hay nada que registrar
      // porque la URL se guarda al tocar Guardar en el panel.
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ message: err?.message || 'No se pudo subir' }, { status: 400 });
  }
}
