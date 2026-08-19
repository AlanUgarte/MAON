'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Copy, Upload, Truck, Package, Check } from 'lucide-react';
import { api, uploadVynoComprobante } from '@/lib/api';
import { useVynoSettingsPublic } from '@/lib/vyno-settings-store';

const BLACK = '#0B0B0B';
const CHAMPAGNE = '#C6A664';
const CREAM = '#FAF8F5';
const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

const STEPS: { key: string; label: string }[] = [
  { key: 'PAGO_PENDIENTE', label: 'Pedido recibido' },
  { key: 'COMPROBANTE_RECIBIDO', label: 'Comprobante recibido' },
  { key: 'PAGO_VERIFICADO', label: 'Pago verificado' },
  { key: 'LISTO_PARA_DESPACHAR', label: 'Listo para despachar' },
  { key: 'DESPACHADO', label: 'Despachado' },
  { key: 'EN_TRANSITO', label: 'En tránsito' },
  { key: 'ENTREGADO', label: 'Entregado' },
];

export default function VynoOrderPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const { settings } = useVynoSettingsPublic();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const load = () => {
    api.vynoOrderPublic(orderId).then(setOrder).catch(() => {}).finally(() => setLoading(false));
  };
  useEffect(load, [orderId]);

  const copyAlias = () => {
    navigator.clipboard?.writeText(settings.paymentAlias);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };

  const stepIndex = order ? STEPS.findIndex((s) => s.key === order.status) : -1;
  const cancelled = order?.status === 'CANCELADO';

  return (
    <div style={{ background: CREAM }} className="min-h-screen font-sans">
      <header className="border-b" style={{ background: BLACK, borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="mx-auto flex h-16 max-w-[760px] items-center px-4 sm:px-8">
          <Link href="/vyno" className="text-xl font-bold tracking-[0.15em] text-white" style={{ fontFamily: 'var(--font-vyno-serif)' }}>VYNO</Link>
        </div>
      </header>

      <main className="mx-auto max-w-[760px] px-4 py-10 sm:px-8">
        {loading ? (
          <div className="py-20 text-center text-[13px] text-neutral-400">Cargando pedido…</div>
        ) : !order ? (
          <div className="py-20 text-center text-[13px] text-neutral-400">No encontramos ese pedido.</div>
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-full" style={{ background: `${CHAMPAGNE}26`, color: '#8A6B2E' }}><CheckCircle2 className="h-6 w-6" /></span>
              <h1 className="text-[22px] font-bold text-neutral-900" style={{ fontFamily: 'var(--font-vyno-serif)' }}>¡Pedido recibido!</h1>
              <p className="text-[13px] text-neutral-500">Pedido <b>{order.orderNumber}</b></p>
            </div>

            {!cancelled && (
              <div className="rounded-sm border bg-white p-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                <div className="flex flex-wrap gap-y-3">
                  {STEPS.map((s, i) => (
                    <div key={s.key} className="flex flex-1 min-w-[100px] flex-col items-center gap-1.5 text-center">
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold"
                        style={i <= stepIndex ? { background: BLACK, color: '#fff' } : { background: '#EEE', color: '#999' }}
                      >{i < stepIndex ? <Check className="h-3 w-3" /> : i + 1}</span>
                      <span className="text-[10px] font-semibold uppercase leading-tight text-neutral-500">{s.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="rounded-sm border bg-white p-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Tu pedido</div>
              <div className="mt-3 space-y-1.5">
                {order.items.map((it: any, i: number) => (
                  <div key={i} className="flex justify-between text-[13px] text-neutral-600">
                    <span>{it.quantity}× {it.name}</span><span className="font-semibold text-neutral-900">{money(it.subtotal)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 border-t pt-3 text-[13px]" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <div className="flex justify-between text-neutral-600"><span>Envío</span><span>{money(order.shippingCost)}</span></div>
                <div className="flex justify-between text-[15px] font-extrabold text-neutral-900"><span>Total</span><span>{money(order.total)}</span></div>
              </div>
              {order.trackingNumber && (
                <div className="mt-3 flex items-center gap-2 rounded-sm p-3 text-[12.5px]" style={{ background: '#F1EDE6' }}>
                  <Truck className="h-4 w-4 shrink-0" /> {order.carrier || 'Envío'}: <b>{order.trackingNumber}</b>
                </div>
              )}
            </div>

            {order.status === 'PAGO_PENDIENTE' && (
              <PaymentBox orderId={orderId} alias={settings.paymentAlias} total={order.total} onCopy={copyAlias} copied={copied} onReported={load} />
            )}

            {order.status === 'COMPROBANTE_RECIBIDO' && (
              <div className="flex items-center gap-3 rounded-sm border p-5" style={{ borderColor: CHAMPAGNE, background: `${CHAMPAGNE}14` }}>
                <Package className="h-5 w-5 shrink-0" style={{ color: '#8A6B2E' }} />
                <p className="text-[13px] text-neutral-700">Recibimos tu comprobante — lo estamos verificando. Te avisamos por WhatsApp apenas esté confirmado.</p>
              </div>
            )}

            {(order.status === 'PAGO_VERIFICADO' || order.status === 'LISTO_PARA_DESPACHAR') && (
              <div className="flex items-center gap-3 rounded-sm border p-5" style={{ borderColor: '#86EFAC', background: '#F0FDF4' }}>
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
                <p className="text-[13px] text-neutral-700">¡Pago verificado! Tu pedido está siendo preparado para el despacho.</p>
              </div>
            )}

            {cancelled && (
              <div className="rounded-sm border p-5 text-[13px] text-neutral-700" style={{ borderColor: '#FCA5A5', background: '#FEF2F2' }}>
                Este pedido fue cancelado. Si creés que es un error, escribinos.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function PaymentBox({ orderId, alias, total, onCopy, copied, onReported }: {
  orderId: string; alias: string; total: number; onCopy: () => void; copied: boolean; onReported: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [operationNumber, setOperationNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!file) return setError('Adjuntá el comprobante (foto o PDF).');
    setBusy(true);
    try {
      const imageUrl = await uploadVynoComprobante(file);
      await api.reportVynoPayment(orderId, { imageUrl, operationNumber: operationNumber || undefined, holderName: holderName || undefined, comment: comment || undefined });
      onReported();
    } catch (err: any) {
      setError(err?.message || 'No pudimos subir el comprobante. Probá de nuevo.');
    } finally { setBusy(false); }
  };

  return (
    <div className="rounded-sm border bg-white p-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
      <div className="text-[13px] font-bold text-neutral-900">Transferí el importe total y contanos cuando lo hagas</div>
      <div className="mt-3 flex items-center justify-between rounded-sm p-3.5" style={{ background: '#F1EDE6' }}>
        <div>
          <div className="text-[10.5px] font-bold uppercase tracking-widest text-neutral-500">Alias</div>
          <div className="text-[15px] font-extrabold text-neutral-900">{alias}</div>
        </div>
        <button onClick={onCopy} className="flex items-center gap-1.5 rounded-sm border bg-white px-3 py-1.5 text-[12px] font-semibold" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
          <Copy className="h-3.5 w-3.5" /> {copied ? 'Copiado' : 'Copiar'}
        </button>
      </div>
      <div className="mt-2 text-[13px] text-neutral-600">Importe exacto a transferir: <b className="text-neutral-900">{money(total)}</b></div>

      <div className="mt-4 space-y-2.5 border-t pt-4" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
        <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Ya transferí — subir comprobante</div>
        <label className="flex h-11 w-full cursor-pointer items-center gap-2 rounded-sm border px-3.5 text-[13px] text-neutral-600" style={{ borderColor: 'rgba(0,0,0,0.15)' }}>
          <Upload className="h-4 w-4 shrink-0" /> {file ? file.name : 'Elegir foto o PDF del comprobante*'}
          <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <input value={operationNumber} onChange={(e) => setOperationNumber(e.target.value)} placeholder="N° de operación (opcional)" className="h-11 rounded-sm border px-3.5 text-[13px]" style={{ borderColor: 'rgba(0,0,0,0.15)' }} />
          <input value={holderName} onChange={(e) => setHolderName(e.target.value)} placeholder="Nombre del titular (opcional)" className="h-11 rounded-sm border px-3.5 text-[13px]" style={{ borderColor: 'rgba(0,0,0,0.15)' }} />
        </div>
        <textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentario (opcional)" rows={2} className="w-full rounded-sm border p-3 text-[13px]" style={{ borderColor: 'rgba(0,0,0,0.15)' }} />
        {error && <div className="rounded-sm border px-3 py-2 text-[12.5px] font-semibold" style={{ borderColor: '#FCA5A5', background: '#FEF2F2', color: '#B91C1C' }}>{error}</div>}
        <button onClick={submit} disabled={busy} className="flex h-11 w-full items-center justify-center rounded-sm text-[12.5px] font-bold uppercase tracking-widest text-white disabled:opacity-60" style={{ background: BLACK }}>
          {busy ? 'Enviando…' : 'Informar pago'}
        </button>
      </div>
    </div>
  );
}
