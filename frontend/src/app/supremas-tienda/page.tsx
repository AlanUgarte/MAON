'use client';

// Tienda online de Supremas de Pollo — sin login, un solo producto (venta por kg).
// Mismo modelo de negocio que /tienda: sin pago online, el pedido se registra en el
// backend (POST /supremas-sales/storefront, precio y tramo de cliente calculados
// server-side) y se cierra por WhatsApp. Reutiliza la paleta de marca de /tienda para
// que se sienta la misma empresa, no una tienda aparte.
import { useEffect, useMemo, useState } from 'react';
import {
  Beef, MessageCircle, Truck, ShieldCheck, Minus, Plus, PackageCheck, Clock,
  Banknote, Landmark, Smartphone, CircleDollarSign, CheckCircle2, AlertTriangle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTiendaSettings } from '@/lib/tienda-settings-store';

const BRAND = '#1B3358';
const BRAND_DARK = '#0E2036';
const BRAND_LIGHT = '#2E5A8C';
const BRAND_SOFT = '#EEF2F8';
const ACCENT = '#E38A1F';
const WHATSAPP = '#25D366';

const money = (n: number) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const DELIVERY_SLOTS = ['17:00 a 18:00', '18:00 a 19:00', '19:00 a 20:00', '20:00 a 21:00'];

type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADO_PAGO' | 'OTRO';
const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { key: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
  { key: 'TRANSFERENCIA', label: 'Transferencia', icon: Landmark },
  { key: 'MERCADO_PAGO', label: 'Mercado Pago', icon: Smartphone },
  { key: 'OTRO', label: 'Otro', icon: CircleDollarSign },
];

interface PublicPrices { priceConsumidorFinal: number; priceMayorista: number; mayoristaMinKg: number }

export default function SupremasTiendaPage() {
  const { settings: tiendaSettings } = useTiendaSettings();
  const [prices, setPrices] = useState<PublicPrices | null>(null);
  const [stockKg, setStockKg] = useState<number | null>(null);

  useEffect(() => {
    api.supremasSettingsPublic().then(setPrices).catch(() => {});
    api.supremasStock().then((r) => setStockKg(r.stockKg)).catch(() => {});
  }, []);

  const [kg, setKg] = useState(2);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wantsShipping, setWantsShipping] = useState(true);
  const [address, setAddress] = useState('');
  const [schedule, setSchedule] = useState('');
  const [payment, setPayment] = useState<PaymentMethod>('EFECTIVO');
  const [obs, setObs] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const isMayorista = !!prices && kg >= prices.mayoristaMinKg;
  const pricePerKg = prices ? (isMayorista ? prices.priceMayorista : prices.priceConsumidorFinal) : 0;
  const total = kg * pricePerKg;
  const sinStockSuficiente = stockKg != null && kg > stockKg;

  const buildMessage = () => {
    const lines = [
      '¡Hola! Quiero pedir Supremas de Pollo en *MAON*:',
      '',
      `Cantidad: ${kg} kg`,
      `Precio: ${money(pricePerKg)}/kg${isMayorista ? ' (mayorista)' : ''}`,
      `*Total: ${money(total)}*`,
      '',
      wantsShipping ? `Envío a: ${address}\nHorario disponible: ${schedule}` : 'Retira en el local',
      '',
      `Nombre: ${name}`,
      `Teléfono: ${phone}`,
      `Forma de pago: ${PAYMENT_OPTIONS.find((p) => p.key === payment)?.label}`,
    ];
    if (obs.trim()) lines.push(`Observaciones: ${obs.trim()}`);
    return lines.join('\n');
  };

  const submit = async () => {
    setError('');
    if (!name.trim() || !phone.trim()) return setError('Nombre y teléfono son obligatorios.');
    if (!(kg > 0)) return setError('Ingresá la cantidad de kg.');
    if (wantsShipping && (!address.trim() || !schedule)) return setError('Para el envío hace falta la dirección y un horario disponible.');
    setSending(true);
    try {
      await api.supremasSaleStorefront({
        customerName: name.trim(), customerPhone: phone.trim(), kg, paymentMethod: payment,
        wantsShipping, address: wantsShipping ? address.trim() : undefined,
        availableSchedule: wantsShipping ? schedule : undefined, observaciones: obs.trim() || undefined,
      });
    } catch (err: any) {
      setSending(false);
      setError(err?.message || 'No pudimos registrar el pedido. Probá de nuevo o escribinos directo por WhatsApp.');
      return;
    }
    window.open(`https://wa.me/${tiendaSettings.whatsappNumber}?text=${encodeURIComponent(buildMessage())}`, '_blank');
    setSending(false);
    setSent(true);
  };

  const reset = () => {
    setSent(false); setKg(2); setName(''); setPhone(''); setWantsShipping(true);
    setAddress(''); setSchedule(''); setPayment('EFECTIVO'); setObs('');
    api.supremasStock().then((r) => setStockKg(r.stockKg)).catch(() => {});
  };

  return (
    <div className="min-h-screen" style={{ background: '#FAFAF7' }}>
      <div className="truncate px-4 py-1.5 text-center text-[11px] font-medium tracking-wide text-white/90" style={{ background: '#1A1A1A' }}>
        Producto elaborado en el día · Pedido confirmado por WhatsApp
      </div>

      <header className="border-b" style={{ borderColor: 'rgba(0,0,0,0.06)', background: '#fff' }}>
        <div className="mx-auto flex max-w-[560px] items-center gap-2.5 px-4 py-3.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: BRAND }}>
            <Beef className="h-[18px] w-[18px]" />
          </div>
          <div className="leading-tight">
            <div className="font-display text-[15px] font-extrabold" style={{ color: BRAND }}>MAON — Supremas de Pollo</div>
            <div className="text-[10.5px] font-semibold uppercase tracking-widest" style={{ color: ACCENT }}>Pedí por kilo, online</div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[560px] px-4 py-6">
        {sent ? (
          <div className="flex flex-col items-center gap-3 rounded-3xl border p-8 text-center" style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#fff' }}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `${WHATSAPP}1a`, color: WHATSAPP }}>
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h2 className="font-display text-lg font-extrabold" style={{ color: BRAND }}>¡Pedido registrado!</h2>
            <p className="max-w-xs text-[13.5px] text-neutral-500">
              Te abrimos WhatsApp con el resumen — mandalo para que confirmemos tu pedido y coordinemos {wantsShipping ? 'la entrega' : 'el retiro'}.
            </p>
            <button
              onClick={reset}
              className="mt-1 rounded-full border px-5 py-2 text-[13px] font-bold"
              style={{ borderColor: BRAND, color: BRAND }}
            >
              Hacer otro pedido
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Hero producto */}
            <div className="overflow-hidden rounded-3xl text-white" style={{ background: `linear-gradient(135deg, ${BRAND} 0%, ${BRAND_LIGHT} 100%)` }}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h1 className="font-display text-xl font-extrabold leading-tight">Supremas de pollo<br />rebozadas, caseras</h1>
                    <p className="mt-1.5 text-[12.5px] text-white/75">Listas para freír o al horno. Se venden por kilo.</p>
                  </div>
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl" style={{ background: 'rgba(255,255,255,0.14)' }}>
                    <Beef className="h-6 w-6" />
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <span className="rounded-full px-3 py-1 text-[12px] font-bold" style={{ background: '#fff', color: BRAND }}>
                    {prices ? `${money(prices.priceConsumidorFinal)}/kg` : 'Cargando precio…'}
                  </span>
                  {prices && (
                    <span className="rounded-full px-3 py-1 text-[11.5px] font-semibold" style={{ background: 'rgba(255,255,255,0.14)' }}>
                      Desde {prices.mayoristaMinKg} kg: {money(prices.priceMayorista)}/kg mayorista
                    </span>
                  )}
                  {stockKg != null && (
                    <span
                      className="rounded-full px-3 py-1 text-[11.5px] font-semibold"
                      style={{ background: stockKg > 0 ? 'rgba(37,211,102,0.18)' : 'rgba(224,86,86,0.2)', color: stockKg > 0 ? '#25D366' : '#FCA5A5' }}
                    >
                      {stockKg > 0 ? `${stockKg.toLocaleString('es-AR')} kg disponibles` : 'Sin stock por ahora'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Cantidad */}
            <div className="rounded-3xl border p-5" style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#fff' }}>
              <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Cantidad</div>
              <div className="mt-2 flex items-center gap-3">
                <button
                  onClick={() => setKg((k) => Math.max(0.5, Math.round((k - 0.5) * 10) / 10))}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg font-bold"
                  style={{ borderColor: BRAND_SOFT, color: BRAND }}
                ><Minus className="h-4 w-4" /></button>
                <div className="flex-1 text-center">
                  <input
                    type="number" min={0.5} step={0.5} value={kg}
                    onChange={(e) => setKg(Math.max(0.5, Number(e.target.value) || 0.5))}
                    className="w-full bg-transparent text-center font-display text-2xl font-extrabold outline-none"
                    style={{ color: BRAND }}
                  />
                  <div className="text-[11px] text-neutral-400">kilogramos</div>
                </div>
                <button
                  onClick={() => setKg((k) => Math.round((k + 0.5) * 10) / 10)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border text-lg font-bold"
                  style={{ borderColor: BRAND_SOFT, color: BRAND }}
                ><Plus className="h-4 w-4" /></button>
              </div>
              {isMayorista && (
                <div className="mt-3 rounded-xl px-3 py-2 text-[12px] font-semibold" style={{ background: `${ACCENT}1a`, color: ACCENT }}>
                  Precio mayorista aplicado por la cantidad pedida.
                </div>
              )}
              {sinStockSuficiente && (
                <div className="mt-3 flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] font-semibold" style={{ background: '#FEF2F2', color: '#B91C1C' }}>
                  <AlertTriangle className="h-4 w-4 shrink-0" /> Pediste más de lo que tenemos disponible ahora — igual podés mandarlo, lo coordinamos por WhatsApp.
                </div>
              )}
              <div className="mt-4 flex items-center justify-between border-t pt-3" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                <span className="text-[13px] text-neutral-500">Total</span>
                <span className="font-display text-xl font-extrabold" style={{ color: BRAND }}>{money(total)}</span>
              </div>
            </div>

            {/* Envío / retiro */}
            <div className="rounded-3xl border p-5" style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#fff' }}>
              <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Entrega</div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setWantsShipping(true)}
                  className="rounded-xl border px-3 py-2.5 text-[13px] font-bold"
                  style={wantsShipping ? { borderColor: BRAND, background: BRAND_SOFT, color: BRAND } : { borderColor: 'rgba(0,0,0,0.1)', color: '#9CA3AF' }}
                >Quiero envío</button>
                <button
                  onClick={() => setWantsShipping(false)}
                  className="rounded-xl border px-3 py-2.5 text-[13px] font-bold"
                  style={!wantsShipping ? { borderColor: BRAND, background: BRAND_SOFT, color: BRAND } : { borderColor: 'rgba(0,0,0,0.1)', color: '#9CA3AF' }}
                >Retiro en el local</button>
              </div>
              {wantsShipping && (
                <div className="mt-3 space-y-2">
                  <input
                    value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección de entrega*"
                    className="h-11 w-full rounded-xl border px-3.5 text-[13.5px]" style={{ borderColor: 'rgba(0,0,0,0.1)' }}
                  />
                  <select
                    value={schedule} onChange={(e) => setSchedule(e.target.value)}
                    className="h-11 w-full rounded-xl border px-3.5 text-[13.5px]" style={{ borderColor: 'rgba(0,0,0,0.1)', color: schedule ? '#111' : '#9CA3AF' }}
                  >
                    <option value="">Horario disponible para recibirlo* (17 a 21 hs)</option>
                    {DELIVERY_SLOTS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              )}
            </div>

            {/* Datos + pago */}
            <div className="space-y-2.5 rounded-3xl border p-5" style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#fff' }}>
              <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Tus datos</div>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido*" className="h-11 w-full rounded-xl border px-3.5 text-[13.5px]" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
              <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp / Teléfono*" className="h-11 w-full rounded-xl border px-3.5 text-[13.5px]" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />

              <div className="pt-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Forma de pago</div>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_OPTIONS.map((p) => {
                  const Icon = p.icon;
                  const active = payment === p.key;
                  return (
                    <button
                      key={p.key} onClick={() => setPayment(p.key)}
                      className="flex items-center gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] font-semibold"
                      style={active ? { borderColor: BRAND, background: BRAND_SOFT, color: BRAND } : { borderColor: 'rgba(0,0,0,0.1)', color: '#6B7280' }}
                    ><Icon className="h-4 w-4" /> {p.label}</button>
                  );
                })}
              </div>

              <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observaciones (opcional)" rows={2} className="w-full rounded-xl border p-3 text-[13.5px]" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
            </div>

            {error && <div className="rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold" style={{ borderColor: '#FCA5A5', background: '#FEF2F2', color: '#B91C1C' }}>{error}</div>}

            <button
              onClick={submit}
              disabled={sending || !prices}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-[14px] font-bold text-white shadow-lg disabled:opacity-60"
              style={{ background: WHATSAPP }}
            >
              <MessageCircle className="h-[18px] w-[18px]" /> {sending ? 'Enviando…' : 'Pedir por WhatsApp'}
            </button>

            <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 pt-1 text-[11.5px] text-neutral-400">
              <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5" /> Envío coordinado por WhatsApp</span>
              <span className="flex items-center gap-1"><PackageCheck className="h-3.5 w-3.5" /> Producto fresco</span>
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Respuesta rápida</span>
              <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Sin pago online</span>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
