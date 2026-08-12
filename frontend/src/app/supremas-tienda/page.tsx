'use client';

// Tienda online "El Reino Supremas" — sin login, un solo producto (venta por kg).
// Marca propia para este storefront (identidad negro/dorado con isotipo de corona),
// distinta de la marca MAON del resto de las tiendas — mismo modelo de negocio que
// /tienda igual: sin pago online, el pedido se registra en el backend (POST
// /supremas-sales/storefront, precio y tramo de cliente calculados server-side) y se
// cierra por WhatsApp.
import { useEffect, useState } from 'react';
import {
  MessageCircle, Truck, PackageCheck, Clock, Minus, Plus, Lock,
  Banknote, Landmark, Smartphone, CircleDollarSign, CheckCircle2,
  Crown, ShieldCheck, Award, Leaf, ChefHat, Headphones, MapPin,
} from 'lucide-react';
import { api } from '@/lib/api';
import { useTiendaSettings } from '@/lib/tienda-settings-store';

const BLACK = '#0E0E0E';
const GOLD = '#E8B24C';
const GOLD_SOFT = '#FBF1DE';
const CREAM = '#FAF8F4';
const WHATSAPP = '#25D366';

const money = (n: number) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
const DELIVERY_SLOTS = ['17:00 a 18:00', '18:00 a 19:00', '19:00 a 20:00', '20:00 a 21:00'];
// Cantidades típicas para no tener que tipear — igual se puede escribir cualquier valor.
const KG_PRESETS = [10, 15, 20, 25];

const FEATURES = [
  { icon: Leaf, title: 'Fresco y casero', desc: 'Producto elaborado a diario.' },
  { icon: Award, title: 'Calidad premium', desc: 'Ingredientes seleccionados.' },
  { icon: ChefHat, title: 'Hechas a pedido', desc: 'Preparamos según tu solicitud.' },
  { icon: Headphones, title: 'Atención rápida', desc: 'Respondemos siempre.' },
];

type PaymentMethod = 'EFECTIVO' | 'TRANSFERENCIA' | 'MERCADO_PAGO' | 'OTRO';
const PAYMENT_OPTIONS: { key: PaymentMethod; label: string; icon: typeof Banknote }[] = [
  { key: 'EFECTIVO', label: 'Efectivo', icon: Banknote },
  { key: 'TRANSFERENCIA', label: 'Transferencia', icon: Landmark },
  { key: 'MERCADO_PAGO', label: 'Mercado Pago', icon: Smartphone },
  { key: 'OTRO', label: 'Otro', icon: CircleDollarSign },
];

interface PublicPrices {
  priceConsumidorFinal: number; priceKiosco: number; priceMayorista: number;
  kioscoMinKg: number; mayoristaMinKg: number;
}

/** Tramo de precio por cantidad — misma regla que aplica el backend en
 * SupremasSalesService.createFromStorefront, solo para mostrar el precio en vivo
 * mientras se tipea (el precio real siempre lo recalcula el server al confirmar). */
function tierFor(kg: number, p: PublicPrices) {
  if (kg >= p.mayoristaMinKg) return { price: p.priceMayorista, label: 'Mayorista' };
  if (kg >= p.kioscoMinKg) return { price: p.priceKiosco, label: 'Kiosco' };
  return { price: p.priceConsumidorFinal, label: null as string | null };
}

export default function SupremasTiendaPage() {
  const { settings: tiendaSettings } = useTiendaSettings();
  const [prices, setPrices] = useState<PublicPrices | null>(null);

  useEffect(() => {
    api.supremasSettingsPublic().then(setPrices).catch(() => {});
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

  const tier = prices ? tierFor(kg, prices) : null;
  const pricePerKg = tier?.price ?? 0;
  const total = kg * pricePerKg;

  const buildMessage = () => {
    const lines = [
      '¡Hola! Quiero pedir Supremas de Pollo en *El Reino Supremas*:',
      '',
      `Cantidad: ${kg} kg`,
      `Precio: ${money(pricePerKg)}/kg${tier?.label ? ` (${tier.label})` : ''}`,
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
  };

  return (
    <div className="min-h-screen" style={{ background: CREAM }}>
      <header style={{ background: BLACK }}>
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3.5 sm:px-6 lg:flex-nowrap">
          <div className="flex items-center gap-4">
            <img src="/supremas/logo.png" alt="El Reino Supremas" width={1284} height={305} className="h-8 w-auto sm:h-9" />
            <div className="hidden h-8 w-px bg-white/15 sm:block" />
            <div className="hidden leading-tight sm:block">
              <div className="text-[14px] font-bold text-white">Supremas de pollo</div>
              <div className="text-[10.5px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Pedí por kilo, online</div>
            </div>
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-start gap-x-6 gap-y-2 lg:justify-end">
            {[
              { icon: Truck, title: 'Envío coordinado', sub: 'por WhatsApp' },
              { icon: PackageCheck, title: 'Producto fresco', sub: 'de calidad' },
              { icon: Clock, title: 'Respuesta rápida', sub: 'y personalizada' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-center gap-2">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: 'rgba(232,178,76,0.16)', color: GOLD }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="leading-tight">
                    <div className="text-[12px] font-bold text-white">{f.title}</div>
                    <div className="text-[11px] text-white/50">{f.sub}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] px-4 py-6 sm:px-6 lg:py-9">
        {sent ? (
          <div className="mx-auto flex max-w-[440px] flex-col items-center gap-3 rounded-3xl border p-8 text-center" style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#fff' }}>
            <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: `${WHATSAPP}1a`, color: WHATSAPP }}>
              <CheckCircle2 className="h-8 w-8" />
            </span>
            <h2 className="text-lg font-extrabold text-neutral-900">¡Pedido registrado!</h2>
            <p className="max-w-xs text-[13.5px] text-neutral-500">
              Te abrimos WhatsApp con el resumen — mandalo para que confirmemos tu pedido y coordinemos {wantsShipping ? 'la entrega' : 'el retiro'}.
            </p>
            <button
              onClick={reset}
              className="mt-1 rounded-full border-2 px-5 py-2 text-[13px] font-bold"
              style={{ borderColor: BLACK, color: BLACK }}
            >
              Hacer otro pedido
            </button>
          </div>
        ) : (
          <div className="lg:grid lg:grid-cols-[1.05fr_1fr] lg:items-start lg:gap-6 xl:grid-cols-[1.15fr_1fr] xl:gap-8">
            {/* Columna izquierda: producto + precios */}
            <div className="space-y-4">
              <div className="overflow-hidden rounded-3xl" style={{ background: BLACK }}>
                <img
                  src="/supremas/hero-banner.webp" alt="Supremas de pollo rebozadas, caseras — listas para freír o al horno"
                  width={1774} height={887} loading="eager" fetchPriority="high"
                  className="w-full" style={{ aspectRatio: '1774 / 887', objectFit: 'cover' }}
                />
              </div>

              {/* Precio por cantidad — transparente, no hay que adivinar el corte */}
              <div className="rounded-3xl border p-5" style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#fff' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Precio por cantidad</div>
                <div className="mt-2.5 space-y-2">
                  {prices ? (
                    [
                      { range: `1 a ${prices.kioscoMinKg - 1} kg`, price: prices.priceConsumidorFinal, active: tier?.label === null, icon: Crown },
                      { range: `${prices.kioscoMinKg} a ${prices.mayoristaMinKg - 1} kg`, price: prices.priceKiosco, active: tier?.label === 'Kiosco', icon: ShieldCheck },
                      { range: `${prices.mayoristaMinKg} kg o más`, price: prices.priceMayorista, active: tier?.label === 'Mayorista', icon: Award },
                    ].map((row) => {
                      const Icon = row.icon;
                      return (
                        <div
                          key={row.range}
                          className="flex items-center gap-3 rounded-xl border px-3.5 py-2.5 text-[13.5px] transition"
                          style={row.active ? { borderColor: GOLD, background: GOLD_SOFT } : { borderColor: 'rgba(0,0,0,0.08)' }}
                        >
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full" style={row.active ? { background: GOLD, color: BLACK } : { background: '#F3F1EC', color: '#9CA3AF' }}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className={`flex-1 ${row.active ? 'font-bold text-neutral-900' : 'font-medium text-neutral-500'}`}>{row.range}</span>
                          <span className={row.active ? 'font-extrabold text-neutral-900' : 'font-semibold text-neutral-500'}>{money(row.price)} /kg</span>
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-[13px] text-neutral-400">Cargando precios…</div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-3xl border p-4" style={{ borderColor: GOLD, background: GOLD_SOFT }}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: GOLD, color: BLACK }}>
                  <ShieldCheck className="h-[18px] w-[18px]" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[13px] font-bold text-neutral-900">Sin pago online</div>
                  <div className="text-[12px] text-neutral-500">Coordinamos tu pedido por WhatsApp.</div>
                </div>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: `${WHATSAPP}1f`, color: WHATSAPP }}>
                  <MessageCircle className="h-[18px] w-[18px]" />
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {FEATURES.map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="rounded-2xl border p-3.5 text-center" style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#fff' }}>
                      <span className="mx-auto flex h-9 w-9 items-center justify-center rounded-full" style={{ background: '#F3F1EC', color: BLACK }}>
                        <Icon className="h-[18px] w-[18px]" />
                      </span>
                      <div className="mt-2 text-[12.5px] font-bold text-neutral-900">{f.title}</div>
                      <div className="text-[11px] leading-snug text-neutral-500">{f.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Columna derecha: pedido */}
            <div className="mt-4 space-y-4 lg:mt-0">
              {/* Cantidad */}
              <div className="rounded-3xl border p-5" style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#fff' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Cantidad</div>

                <div className="mt-2.5 flex flex-wrap gap-2">
                  {KG_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setKg(preset)}
                      className="rounded-full border-2 px-3.5 py-1.5 text-[13px] font-bold transition"
                      style={kg === preset ? { borderColor: GOLD, background: GOLD_SOFT, color: '#8A6414' } : { borderColor: 'rgba(0,0,0,0.1)', color: '#6B7280' }}
                    >
                      {preset} kg
                    </button>
                  ))}
                </div>

                <div className="mt-4 flex items-center gap-3">
                  <button
                    onClick={() => setKg((k) => Math.max(0.5, Math.round((k - 0.5) * 10) / 10))}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold"
                    style={{ borderColor: 'rgba(0,0,0,0.1)', color: BLACK }}
                  ><Minus className="h-4 w-4" /></button>
                  <div className="flex-1 text-center">
                    <div className="flex items-baseline justify-center gap-1.5">
                      <input
                        type="number" min={0.5} step={0.5} value={kg}
                        onChange={(e) => setKg(Math.max(0.5, Number(e.target.value) || 0.5))}
                        className="w-20 bg-transparent text-center text-3xl font-extrabold outline-none"
                        style={{ color: BLACK }}
                      />
                      <span className="text-[13px] font-semibold text-neutral-400">kg</span>
                    </div>
                    <div className="text-[11px] text-neutral-400">escribí cualquier cantidad</div>
                  </div>
                  <button
                    onClick={() => setKg((k) => Math.round((k + 0.5) * 10) / 10)}
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-lg font-bold"
                    style={{ borderColor: 'rgba(0,0,0,0.1)', color: BLACK }}
                  ><Plus className="h-4 w-4" /></button>
                </div>

                <div className="mt-4 flex items-center justify-between border-t pt-3.5" style={{ borderColor: 'rgba(0,0,0,0.06)' }}>
                  <span className="text-[13px] text-neutral-500">Total ({money(pricePerKg)}/kg)</span>
                  <span className="text-2xl font-extrabold" style={{ color: BLACK }}>{money(total)}</span>
                </div>
              </div>

              {/* Envío / retiro */}
              <div className="rounded-3xl border p-5" style={{ borderColor: 'rgba(0,0,0,0.08)', background: '#fff' }}>
                <div className="text-[11px] font-bold uppercase tracking-wide text-neutral-400">Entrega</div>
                <div className="mt-2.5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setWantsShipping(true)}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-[13px] font-bold"
                    style={wantsShipping ? { borderColor: GOLD, background: GOLD_SOFT, color: '#8A6414' } : { borderColor: 'rgba(0,0,0,0.1)', color: '#9CA3AF' }}
                  ><Truck className="h-4 w-4" /> Quiero envío</button>
                  <button
                    onClick={() => setWantsShipping(false)}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 px-3 py-2.5 text-[13px] font-bold"
                    style={!wantsShipping ? { borderColor: GOLD, background: GOLD_SOFT, color: '#8A6414' } : { borderColor: 'rgba(0,0,0,0.1)', color: '#9CA3AF' }}
                  ><MapPin className="h-4 w-4" /> Retiro en el local</button>
                </div>
                {wantsShipping && (
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <input
                      value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Dirección de entrega*"
                      className="h-11 w-full rounded-xl border px-3.5 text-[13.5px] sm:col-span-2" style={{ borderColor: 'rgba(0,0,0,0.1)' }}
                    />
                    <select
                      value={schedule} onChange={(e) => setSchedule(e.target.value)}
                      className="h-11 w-full rounded-xl border px-3.5 text-[13.5px] sm:col-span-2" style={{ borderColor: 'rgba(0,0,0,0.1)', color: schedule ? '#111' : '#9CA3AF' }}
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
                <div className="grid gap-2.5 sm:grid-cols-2">
                  <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre y apellido*" className="h-11 w-full rounded-xl border px-3.5 text-[13.5px]" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="WhatsApp / Teléfono*" className="h-11 w-full rounded-xl border px-3.5 text-[13.5px]" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
                </div>

                <div className="pt-1 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Forma de pago</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {PAYMENT_OPTIONS.map((p) => {
                    const Icon = p.icon;
                    const active = payment === p.key;
                    return (
                      <button
                        key={p.key} onClick={() => setPayment(p.key)}
                        className="flex items-center gap-2 rounded-xl border-2 px-3 py-2.5 text-[12.5px] font-semibold"
                        style={active ? { borderColor: GOLD, background: GOLD_SOFT, color: '#8A6414' } : { borderColor: 'rgba(0,0,0,0.1)', color: '#6B7280' }}
                      ><Icon className="h-4 w-4 shrink-0" /> <span className="truncate">{p.label}</span></button>
                    );
                  })}
                </div>

                <textarea value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Observaciones (opcional)" rows={2} className="w-full rounded-xl border p-3 text-[13.5px]" style={{ borderColor: 'rgba(0,0,0,0.1)' }} />
              </div>

              {error && <div className="rounded-xl border px-3.5 py-2.5 text-[13px] font-semibold" style={{ borderColor: '#FCA5A5', background: '#FEF2F2', color: '#B91C1C' }}>{error}</div>}

              <div>
                <button
                  onClick={submit}
                  disabled={sending || !prices}
                  className="flex h-[52px] w-full items-center justify-center gap-2 rounded-2xl text-[14.5px] font-extrabold uppercase tracking-wide shadow-lg disabled:opacity-60"
                  style={{ background: GOLD, color: BLACK }}
                >
                  <MessageCircle className="h-[18px] w-[18px]" /> {sending ? 'Enviando…' : 'Confirmar pedido por WhatsApp'}
                </button>
                <div className="mt-2 flex items-center justify-center gap-1.5 text-[11.5px] text-neutral-400">
                  <Lock className="h-3 w-3" /> No realizamos cobros online. Coordinamos todo por WhatsApp.
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
