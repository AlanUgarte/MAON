import { ImageResponse } from 'next/og';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

const GREEN = '#7ee23e';
const BG = '#050705';
const PANEL = '#0d110d';
const LINE = 'rgba(255,255,255,0.12)';

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

/**
 * Comprobante del sorteo como imagen (PNG). Lo pide WhatsApp por link cuando el admin
 * aprueba el pago, así que tiene que ser público y sin login: el id de la compra es un
 * cuid, no adivinable, y funciona como token igual que la vista pública del pedido.
 *
 * Se genera con next/og (satori) en vez de dibujarlo en el backend: no hace falta meter
 * un rasterizador de imágenes en el servidor de Nest.
 */
export async function GET(_req: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const res = await fetch(`${API_URL}/sorteo/orders/${encodeURIComponent(orderId)}/public`, {
    cache: 'no-store',
  }).catch(() => null);
  if (!res || !res.ok) return new Response('Compra no encontrada', { status: 404 });

  const order = await res.json();
  const numbers: number[] = order.numbers ?? [];

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          background: BG, color: '#f4f6f4', padding: 56, fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 800 }}>
            <span style={{ color: GREEN }}>🍀 COMPROBANTE</span>
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: 'rgba(255,255,255,.55)' }}>{order.orderNumber}</div>
        </div>

        <div style={{ display: 'flex', height: 4, background: GREEN, borderRadius: 4, marginTop: 18, marginBottom: 30 }} />

        <div style={{ display: 'flex', fontSize: 30, marginBottom: 26 }}>
          ¡Estás participando por la <span style={{ color: GREEN, marginLeft: 10 }}>{order.prize}</span>!
        </div>

        <div style={{ display: 'flex', gap: 18, marginBottom: 30 }}>
          <Info label="COMPRADOR" value={order.buyerName} />
          <Info label="CHANCES" value={String(order.chances)} />
          <Info label="PAGADO" value={money(order.amount)} />
        </div>

        <div style={{ display: 'flex', fontSize: 24, color: 'rgba(255,255,255,.6)', marginBottom: 14 }}>
          TUS NÚMEROS
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {numbers.map((n) => (
            <div
              key={n}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: GREEN, color: '#04120a', borderRadius: 12,
                padding: '14px 26px', fontSize: 40, fontWeight: 800,
              }}
            >{n}</div>
          ))}
        </div>

        <div style={{ display: 'flex', marginTop: 'auto', fontSize: 24, color: 'rgba(255,255,255,.55)' }}>
          Mucha suerte y siempre con fe 🍀
        </div>
      </div>
    ),
    { width: 1000, height: 700 },
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex', flexDirection: 'column', gap: 6, flex: 1,
        background: PANEL, border: `1px solid ${LINE}`, borderRadius: 14, padding: '16px 20px',
      }}
    >
      <span style={{ fontSize: 18, color: 'rgba(255,255,255,.5)' }}>{label}</span>
      <span style={{ fontSize: 30, fontWeight: 700 }}>{value}</span>
    </div>
  );
}
