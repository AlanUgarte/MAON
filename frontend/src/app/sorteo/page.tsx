'use client';

// Landing pública del sorteo — identidad propia (negro + verde trébol), independiente
// del tema del CRM, mismo criterio que /insumos y /vyno: colores hardcodeados acá.
// El flujo es: elegir paquete -> transferir al alias -> cargar el comprobante. Los
// números NO se asignan al comprar: se asignan cuando el admin verifica el pago.
import { useEffect, useRef, useState } from 'react';
import {
  Clover, Trophy, Copy, Check, X, Upload, Search, Loader2, Play, ShieldCheck, Lock,
  Ticket, CreditCard, Smartphone, ShoppingCart, Mail, Instagram, Facebook, Music2, MessageCircle,
  Maximize2, ChevronLeft, ChevronRight,
} from 'lucide-react';
import { api, uploadSorteoReceipt } from '@/lib/api';

const BG = '#050705';
const PANEL = '#0d110d';
const PANEL_2 = '#141a14';
const LINE = 'rgba(255,255,255,0.09)';
const GREEN = '#7ee23e';
const GREEN_SOFT = '#a8ef70';
const WHATSAPP = '#22c55e';

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

interface Pkg { id: string; chances: number; price: number; isPopular: boolean }
interface PublicSorteo {
  brandName: string; title: string; prize: string; prizeDetails: string; images: string[]; videoUrl: string;
  drawDate: string; drawWhere: string;
  blessedPrize: string; blessedNumbers: { number: number; sold: boolean }[];
  paymentAlias: string; paymentHolder: string; whatsappNumber: string;
  email: string; instagramUrl: string; facebookUrl: string; tiktokUrl: string;
  isActive: boolean; totalNumbers: number; sold: number; percentSold: number;
  packages: Pkg[];
  winners: { id: string; name: string; number: number | null; prize: string; photoUrl: string | null; note: string | null }[];
}

const NAV = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'La moto', href: '#la-moto' },
  { label: 'Cómo funciona', href: '#como-funciona' },
  { label: 'Premios', href: '#premios' },
  { label: 'Preguntas frecuentes', href: '#faq' },
  { label: 'Contacto', href: '#contacto' },
];

const TRUST = [
  { icon: ShieldCheck, l1: 'SORTEO', l2: 'TRANSPARENTE' },
  { icon: Lock, l1: 'COMPRA 100%', l2: 'SEGURA' },
  { icon: Clover, l1: 'MUCHA SUERTE', l2: 'Y SIEMPRE CON FE' },
];

const FEATURES = [
  { icon: Ticket, title: 'NÚMEROS AL INSTANTE', body: 'Recibí tus números apenas verificamos tu pago.' },
  { icon: CreditCard, title: 'MEDIOS DE PAGO', body: 'Transferencia bancaria al alias, simple y directo.' },
  { icon: Smartphone, title: '100% ONLINE', body: 'Desde donde estés, fácil y rápido.' },
];

const STEPS = [
  { n: 1, icon: ShoppingCart, title: 'ELEGÍ TUS CHANCES', body: 'Seleccioná la cantidad de números que quieras.' },
  { n: 2, icon: CreditCard, title: 'TRANSFERÍ', body: 'Pagá al alias y cargá el comprobante.' },
  { n: 3, icon: Ticket, title: 'RECIBÍ TUS NÚMEROS', body: 'Te los asignamos al azar apenas verificamos el pago.' },
  { n: 4, icon: Clover, title: '¡PARTICIPÁS!', body: 'Y ya estás jugando por el premio.' },
];

export default function SorteoPage() {
  const [data, setData] = useState<PublicSorteo | null>(null);
  const [loading, setLoading] = useState(true);
  const [buying, setBuying] = useState<Pkg | null>(null);

  useEffect(() => {
    api.sorteoPublic().then(setData).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: BG }}>
        <Loader2 className="h-6 w-6 animate-spin" style={{ color: GREEN }} />
      </div>
    );
  }
  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6 text-center" style={{ background: BG, color: '#fff' }}>
        No pudimos cargar el sorteo. Probá de nuevo en un rato.
      </div>
    );
  }

  const wa = `https://wa.me/${data.whatsappNumber}`;
  const scrollToPacks = () => document.getElementById('chances')?.scrollIntoView({ behavior: 'smooth' });

  return (
    <div style={{ background: BG, color: '#f4f6f4', minHeight: '100vh' }}>
      <Header brand={data.brandName} onCta={scrollToPacks} />

      <main className="mx-auto max-w-[1500px] px-4 sm:px-6">
        {/* ------------------------------ hero ------------------------------ */}
        <section id="inicio" className="grid gap-8 py-8 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:py-10">
          <div>
            <span
              className="inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-[12px] font-bold tracking-wide"
              style={{ borderColor: GREEN, color: GREEN }}
            ><Clover className="h-3.5 w-3.5" fill="currentColor" /> SORTEO OFICIAL</span>

            <h1 className="mt-5 text-[clamp(38px,5.2vw,66px)] font-black uppercase leading-[0.95] tracking-tight">
              <Headline text={data.title} />
            </h1>

            <p className="mt-4 max-w-[380px] text-[17px] leading-snug" style={{ color: 'rgba(255,255,255,.75)' }}>
              Participá por la <b style={{ color: GREEN }}>{data.prize}</b> y hacé realidad tu sueño.
            </p>

            <div className="mt-7 flex flex-wrap gap-x-2 gap-y-4">
              {TRUST.map((t, i) => {
                const Icon = t.icon;
                return (
                  <div
                    key={t.l1 + t.l2}
                    className="flex min-w-[90px] flex-1 flex-col items-center gap-2 px-2 text-center"
                    style={i ? { borderLeft: `1px solid ${LINE}` } : undefined}
                  >
                    <Icon className="h-6 w-6" style={{ color: GREEN }} />
                    <span className="text-[10.5px] font-bold leading-tight tracking-wide" style={{ color: 'rgba(255,255,255,.8)' }}>
                      {t.l1}<br />{t.l2}
                    </span>
                  </div>
                );
              })}
            </div>

            <button
              onClick={scrollToPacks}
              className="mt-7 flex w-full items-center justify-center gap-2.5 rounded-xl py-4 text-[17px] font-black tracking-wide text-black transition hover:brightness-110 sm:max-w-[330px]"
              style={{ background: GREEN, boxShadow: `0 0 34px rgba(126,226,62,.35)` }}
            >
              <Clover className="h-5 w-5" fill="currentColor" /> PARTICIPAR AHORA <Clover className="h-5 w-5" fill="currentColor" />
            </button>
            <p className="mt-3 flex items-center gap-1.5 text-[12px]" style={{ color: 'rgba(255,255,255,.45)' }}>
              <ShieldCheck className="h-3.5 w-3.5" /> Sitio seguro con encriptación SSL
            </p>
          </div>

          <div className="space-y-5">
            <MediaPanel label="VIDEO REAL" ratio="16/9" live={!!data.videoUrl}>
              {data.videoUrl
                ? <VideoPlayer src={data.videoUrl} poster={data.images[0]} />
                : <Placeholder text="Subí el video de la moto desde el panel del CRM" />}
            </MediaPanel>
            <Gallery images={data.images} prize={data.prize} />
          </div>
        </section>

        {/* ------------------------ chances + paquetes ------------------------ */}
        <section id="chances" className="grid gap-5 pb-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
          <div className="rounded-2xl p-6" style={{ background: PANEL, border: `1px solid ${LINE}` }}>
            <div className="grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto]">
              <div>
                <h3 className="mb-4 flex items-center gap-2 text-[15px] font-black tracking-wide">
                  <Clover className="h-4 w-4" style={{ color: GREEN }} fill="currentColor" /> CHANCES VENDIDAS
                </h3>
                <div className="flex items-center gap-3">
                  <div className="relative h-[34px] flex-1 overflow-hidden rounded-full" style={{ background: PANEL_2, border: `1px solid ${LINE}` }}>
                    <span
                      className="absolute inset-y-[3px] left-[3px] rounded-full transition-all duration-700"
                      style={{
                        width: `calc(${Math.max(data.percentSold, 1.5)}% - 6px)`,
                        background: `linear-gradient(90deg, #4bb814, ${GREEN})`,
                        boxShadow: `0 0 18px rgba(126,226,62,.45)`,
                      }}
                    />
                    <b className="absolute right-4 top-1/2 -translate-y-1/2 text-[14px]">{data.percentSold}%</b>
                  </div>
                </div>
              </div>
              <div className="sm:max-w-[240px]">
                <h4 className="text-[15px] font-black" style={{ color: GREEN }}>¡VAMOS POR MÁS!</h4>
                <p className="mt-2 text-[13.5px] leading-snug" style={{ color: 'rgba(255,255,255,.7)' }}>
                  Cada chance acerca más al ganador.<br />No te quedes afuera.
                </p>
              </div>
            </div>
          </div>

          {data.packages.length ? (
            <div className="grid gap-4 sm:grid-cols-3">
              {data.packages.map((p) => <PackageCard key={p.id} pkg={p} disabled={!data.isActive} onBuy={() => setBuying(p)} />)}
            </div>
          ) : (
            <div className="grid place-items-center rounded-2xl p-8 text-center text-[13.5px]" style={{ background: PANEL, border: `1px solid ${LINE}`, color: 'rgba(255,255,255,.5)' }}>
              Cargá los paquetes de chances desde el panel del CRM (pestaña Sorteo → Configuración).
            </div>
          )}
        </section>

        {/* --------------------------- franja features --------------------------- */}
        <section className="mb-10 grid gap-6 rounded-2xl px-6 py-6 sm:grid-cols-2 lg:grid-cols-4" style={{ background: PANEL, border: `1px solid ${LINE}` }}>
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={f.title} className="flex gap-3.5 lg:px-2" style={i ? { borderLeft: `1px solid ${LINE}` } : undefined}>
                <Icon className="h-8 w-8 shrink-0" style={{ color: GREEN, marginLeft: i ? 14 : 0 }} strokeWidth={1.5} />
                <div>
                  <h4 className="text-[13.5px] font-black tracking-wide">{f.title}</h4>
                  <p className="mt-1 text-[12.5px] leading-snug" style={{ color: 'rgba(255,255,255,.6)' }}>{f.body}</p>
                </div>
              </div>
            );
          })}
        </section>

        {/* ------------------------------ el premio ------------------------------ */}
        {!!data.prizeDetails.trim() && (
          <section id="la-moto" className="py-12">
            <h2 className="mb-8 flex items-center justify-center gap-3 text-center text-[clamp(24px,3.4vw,36px)] font-black">
              <Clover className="h-7 w-7" style={{ color: GREEN }} fill="currentColor" /> LA {data.prize}
            </h2>
            <div className="mx-auto grid max-w-[900px] gap-5 sm:grid-cols-2">
              {data.images[0] && (
                <img src={data.images[0]} alt={data.prize} className="h-full w-full rounded-2xl object-cover" style={{ border: `1px solid ${LINE}` }} />
              )}
              <div className="rounded-2xl p-7" style={{ background: PANEL, border: `1px solid ${LINE}` }}>
                <h3 className="mb-4 text-[13px] font-black tracking-widest" style={{ color: GREEN }}>DETALLE DEL PREMIO</h3>
                <ul className="space-y-2.5">
                  {data.prizeDetails.split(/\r?\n/).map((linea) => linea.trim()).filter(Boolean).map((linea, i) => (
                    <li key={i} className="flex gap-2.5 text-[15px]" style={{ color: 'rgba(255,255,255,.8)' }}>
                      <Clover className="mt-1 h-4 w-4 shrink-0" style={{ color: GREEN }} fill="currentColor" />
                      {linea}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {/* ---------------------------- cómo funciona ---------------------------- */}
        <section id="como-funciona" className="py-12">
          <h2 className="mb-8 flex items-center justify-center gap-3 text-center text-[clamp(24px,3.4vw,36px)] font-black">
            <Clover className="h-7 w-7" style={{ color: GREEN }} fill="currentColor" /> ¿CÓMO FUNCIONA?
          </h2>
          <div className="grid gap-4 rounded-2xl p-6 sm:grid-cols-2 lg:grid-cols-4" style={{ background: PANEL, border: `1px solid ${LINE}` }}>
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <div key={s.n} className="flex flex-col items-center gap-2 px-3 text-center">
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full text-[13px] font-black text-black" style={{ background: GREEN }}>{s.n}</span>
                    <Icon className="h-7 w-7" style={{ color: GREEN }} strokeWidth={1.5} />
                  </div>
                  <h4 className="mt-1 text-[13.5px] font-black tracking-wide">{s.title}</h4>
                  <p className="text-[12.5px] leading-snug" style={{ color: 'rgba(255,255,255,.6)' }}>{s.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* -------------------------------- premios -------------------------------- */}
        <section id="premios" className="py-12">
          <h2 className="mb-8 text-center text-[clamp(24px,3.4vw,36px)] font-black">PREMIOS</h2>
          <div className="mx-auto grid max-w-[820px] gap-5 sm:grid-cols-2">
            <div className="rounded-2xl p-7 text-center" style={{ background: PANEL, border: `1px solid ${GREEN}` }}>
              <div className="mb-3 text-[13px] font-black tracking-widest" style={{ color: GREEN }}>1ER PREMIO</div>
              <h3 className="text-[26px] font-black uppercase">{data.prize}</h3>
            </div>
            {data.blessedNumbers.length ? (
              <div className="rounded-2xl p-7 text-center" style={{ background: PANEL, border: `1px solid ${LINE}` }}>
                <div className="text-[13px] font-black tracking-widest" style={{ color: GREEN }}>PREMIOS SECUNDARIOS</div>
                <div className="mb-3 mt-1 text-[13px] font-black tracking-widest" style={{ color: GREEN_SOFT }}>NÚMEROS BENDECIDOS 🍀</div>
                <div className="mb-3 flex flex-wrap justify-center gap-2.5">
                  {data.blessedNumbers.map((b) => (
                    <span
                      key={b.number}
                      className="rounded-[10px] border-2 px-4 py-2 text-[20px] font-black"
                      style={b.sold
                        ? { borderColor: LINE, color: 'rgba(255,255,255,.35)', textDecoration: 'line-through' }
                        : { borderColor: GREEN, color: GREEN, background: 'rgba(126,226,62,.07)' }}
                    >{b.number}</span>
                  ))}
                </div>
                {data.blessedPrize && (
                  <p className="text-[13px]" style={{ color: 'rgba(255,255,255,.6)' }}>
                    Si te toca alguno de estos números ganás <b style={{ color: '#fff' }}>{data.blessedPrize}</b> 🎁
                  </p>
                )}
              </div>
            ) : (
              <div className="grid place-items-center rounded-2xl p-7 text-center text-[13.5px]" style={{ background: PANEL, border: `1px solid ${LINE}`, color: 'rgba(255,255,255,.5)' }}>
                Los números bendecidos se cargan desde el panel del CRM.
              </div>
            )}
          </div>
        </section>

        {/* ---------------------------------- faq ---------------------------------- */}
        <section id="faq" className="py-12">
          <h2 className="mb-8 text-center text-[clamp(24px,3.4vw,36px)] font-black">PREGUNTAS FRECUENTES</h2>
          <div className="mx-auto max-w-[760px] space-y-4">
            <Faq q="¿Cuándo se realiza el sorteo?" a={data.drawDate || 'A confirmar'} />
            <Faq q="¿En dónde vemos el ganador?" a={data.drawWhere || 'A confirmar'} />
            <Faq q="¿Cómo recibo mis números?" a="Apenas verificamos tu transferencia te asignamos los números al azar y te avisamos. También podés consultarlos acá abajo con tu email o tu WhatsApp." />
            <Faq q="¿Cómo pago?" a={`Por transferencia bancaria al alias ${data.paymentAlias}. Después cargás el comprobante en el formulario de compra.`} />
          </div>
        </section>

        {/* ------------------------------- banda CTA ------------------------------- */}
        <section className="mb-12 flex flex-wrap items-center justify-between gap-5 rounded-2xl px-7 py-6" style={{ background: PANEL, border: `1px solid ${LINE}` }}>
          <div className="flex items-center gap-4">
            <Clover className="h-11 w-11" style={{ color: GREEN }} fill="currentColor" />
            <div>
              <h3 className="text-[21px] font-black">NO TE QUEDES AFUERA</h3>
              <p className="text-[13.5px]" style={{ color: 'rgba(255,255,255,.6)' }}>Tu próximo gran cambio puede empezar hoy.</p>
            </div>
          </div>
          <button
            onClick={scrollToPacks}
            className="flex items-center gap-2.5 rounded-xl px-9 py-4 text-[16px] font-black tracking-wide text-black transition hover:brightness-110"
            style={{ background: GREEN }}
          ><Clover className="h-5 w-5" fill="currentColor" /> PARTICIPAR AHORA <Clover className="h-5 w-5" fill="currentColor" /></button>
        </section>

        <Consulta />

        {!!data.winners.length && (
          <section className="py-12">
            <div className="mb-2 flex justify-center"><Trophy className="h-8 w-8" style={{ color: GREEN }} /></div>
            <h2 className="text-center text-[clamp(24px,3.4vw,36px)] font-black">GANADORES ANTERIORES</h2>
            <p className="mb-8 text-center text-[14px]" style={{ color: 'rgba(255,255,255,.55)' }}>
              Conocé a las personas que ya ganaron con nosotros
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.winners.map((w) => (
                <div key={w.id} className="flex gap-4 overflow-hidden rounded-2xl" style={{ background: PANEL, border: `1px solid ${LINE}` }}>
                  {w.photoUrl && <img src={w.photoUrl} alt="" className="h-full w-[120px] shrink-0 object-cover" />}
                  <div className="py-4 pr-4">
                    <span className="mb-2 inline-block rounded-full px-2.5 py-0.5 text-[11px] font-bold" style={{ background: 'rgba(126,226,62,.14)', color: GREEN }}>🍀 Ganador</span>
                    <h3 className="text-[18px] font-black uppercase">{w.name}</h3>
                    <p className="text-[13px]" style={{ color: 'rgba(255,255,255,.55)' }}>
                      {[w.number ? `N° ${w.number}` : null, w.prize, w.note].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer data={data} wa={wa} />

      {buying && <BuyModal pkg={buying} data={data} onClose={() => setBuying(null)} />}
    </div>
  );
}

// ------------------------------ header / footer ------------------------------

function Header({ brand, onCta }: { brand: string; onCta: () => void }) {
  const [first, ...rest] = (brand || 'TREBOL MOTOS').split(' ');
  return (
    <header className="sticky top-0 z-30 backdrop-blur" style={{ background: 'rgba(5,7,5,.94)', borderBottom: `1px solid ${LINE}` }}>
      <div className="mx-auto flex h-[76px] max-w-[1500px] items-center gap-6 px-4 sm:px-6">
        <a href="#inicio" className="flex items-center gap-2.5">
          <Clover className="h-8 w-8" style={{ color: GREEN }} fill="currentColor" />
          <span className="text-[24px] font-black tracking-tight">
            <span style={{ color: GREEN }}>{first}</span>{rest.length ? ' ' + rest.join(' ') : ''}
          </span>
        </a>

        <nav className="mx-auto hidden items-center gap-7 text-[14px] lg:flex">
          {NAV.map((n, i) => (
            <a
              key={n.href} href={n.href}
              className="transition hover:text-white"
              style={i === 0
                ? { color: GREEN, borderBottom: `2px solid ${GREEN}`, paddingBottom: 2 }
                : { color: 'rgba(255,255,255,.75)' }}
            >{n.label}</a>
          ))}
        </nav>

        <button
          onClick={onCta}
          className="ml-auto flex items-center gap-2 rounded-xl px-5 py-3 text-[13.5px] font-black tracking-wide text-black transition hover:brightness-110 lg:ml-0"
          style={{ background: GREEN }}
        >PARTICIPAR AHORA <Clover className="h-4 w-4" fill="currentColor" /></button>
      </div>
    </header>
  );
}

function Footer({ data, wa }: { data: PublicSorteo; wa: string }) {
  const [first, ...rest] = (data.brandName || 'TREBOL MOTOS').split(' ');
  const socials = [
    { url: data.instagramUrl, icon: Instagram, label: 'Instagram' },
    { url: data.facebookUrl, icon: Facebook, label: 'Facebook' },
    { url: data.tiktokUrl, icon: Music2, label: 'TikTok' },
  ].filter((s) => s.url);

  return (
    <footer id="contacto" className="relative overflow-hidden" style={{ borderTop: `1px solid ${LINE}` }}>
      <Clover
        className="pointer-events-none absolute -bottom-6 right-4 h-40 w-40 opacity-25"
        style={{ color: GREEN }} strokeWidth={1}
      />
      <div className="mx-auto grid max-w-[1500px] gap-8 px-4 py-10 sm:px-6 lg:grid-cols-4">
        <div>
          <div className="flex items-center gap-2.5">
            <Clover className="h-8 w-8" style={{ color: GREEN }} fill="currentColor" />
            <span className="text-[22px] font-black tracking-tight">
              <span style={{ color: GREEN }}>{first}</span>{rest.length ? ' ' + rest.join(' ') : ''}
            </span>
          </div>
          <p className="mt-3 text-[13px] leading-snug" style={{ color: 'rgba(255,255,255,.55)' }}>
            Mucho más que un sorteo,<br />una oportunidad real.
          </p>
        </div>

        {!!socials.length && (
          <div>
            <h4 className="text-[12px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,.55)' }}>SEGUINOS</h4>
            <div className="mt-3 flex gap-3">
              {socials.map((s) => {
                const Icon = s.icon;
                return (
                  <a
                    key={s.label} href={s.url} target="_blank" rel="noopener noreferrer" aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full transition hover:brightness-125"
                    style={{ border: `1px solid ${LINE}`, color: GREEN }}
                  ><Icon className="h-4 w-4" /></a>
                );
              })}
            </div>
          </div>
        )}

        <div>
          <h4 className="text-[12px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,.55)' }}>INFORMACIÓN</h4>
          <ul className="mt-3 space-y-1.5 text-[13px]" style={{ color: 'rgba(255,255,255,.7)' }}>
            <li><a href="#como-funciona">Cómo funciona</a></li>
            <li><a href="#faq">Preguntas frecuentes</a></li>
            <li><a href="#premios">Premios</a></li>
          </ul>
        </div>

        <div>
          <h4 className="text-[12px] font-black tracking-widest" style={{ color: 'rgba(255,255,255,.55)' }}>CONTACTO</h4>
          <ul className="mt-3 space-y-2 text-[13px]" style={{ color: 'rgba(255,255,255,.7)' }}>
            <li>
              <a href={wa} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <MessageCircle className="h-4 w-4" style={{ color: GREEN }} /> WhatsApp
              </a>
            </li>
            {data.email && (
              <li>
                <a href={`mailto:${data.email}`} className="flex items-center gap-2">
                  <Mail className="h-4 w-4" style={{ color: GREEN }} /> {data.email}
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}

// -------------------------------- piezas del hero --------------------------------

/** El título va en mayúsculas y con la última palabra resaltada, como el diseño. */
function Headline({ text }: { text: string }) {
  const words = (text || '').trim().split(/\s+/);
  const last = words.pop() ?? '';
  return (
    <>
      {words.length > 0 && <span className="block">{words.join(' ')}</span>}
      <span className="block italic" style={{ color: GREEN }}>{last}</span>
    </>
  );
}

function MediaPanel({ label, live, ratio = '4/3', children }: { label: string; live?: boolean; ratio?: string; children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl" style={{ aspectRatio: ratio, background: PANEL, border: `1px solid ${LINE}` }}>
      {children}
      <span
        className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-[11px] font-bold tracking-wide"
        style={{ background: 'rgba(5,7,5,.85)', border: `1px solid ${LINE}`, color: 'rgba(255,255,255,.85)' }}
      >
        {live && <span className="h-1.5 w-1.5 rounded-full" style={{ background: GREEN }} />}
        {label}
      </span>
    </div>
  );
}

function Placeholder({ text }: { text: string }) {
  return (
    <div className="grid h-full place-items-center px-6 text-center text-[12.5px]" style={{ color: 'rgba(255,255,255,.4)' }}>
      {text}
    </div>
  );
}

/** Video del premio: arranca solo, mudo y en loop — es la vidriera de la moto. Con
 * controles para que el que quiera le suba el volumen o lo pause. */
function VideoPlayer({ src, poster }: { src: string; poster?: string }) {
  return (
    <video
      src={src} poster={poster}
      autoPlay muted loop playsInline controls preload="metadata"
      className="h-full w-full object-cover"
    />
  );
}

/** Fotos reales de la moto. Al tocar una se abre en grande para verla en detalle. */
function Gallery({ images, prize }: { images: string[]; prize: string }) {
  const [open, setOpen] = useState<number | null>(null);

  if (!images.length) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="grid aspect-[4/3] place-items-center rounded-2xl px-4 text-center text-[12px]"
            style={{ background: PANEL, border: `1px dashed ${LINE}`, color: 'rgba(255,255,255,.35)' }}
          >{i === 0 ? 'Subí las fotos de la moto desde el panel del CRM' : ''}</div>
        ))}
      </div>
    );
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        {images.map((url, i) => (
          <button
            key={url + i}
            onClick={() => setOpen(i)}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl"
            style={{ background: PANEL, border: `1px solid ${LINE}` }}
            aria-label={`Ver la foto ${i + 1} en grande`}
          >
            <img src={url} alt={prize} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" />
            <span
              className="absolute bottom-2.5 left-1/2 flex -translate-x-1/2 items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1 text-[10.5px] font-bold tracking-wide"
              style={{ background: 'rgba(5,7,5,.85)', border: `1px solid ${LINE}`, color: 'rgba(255,255,255,.85)' }}
            ><Maximize2 className="h-3 w-3" style={{ color: GREEN }} /> {i === 0 ? 'IMAGEN REAL' : 'AMPLIAR'}</span>
          </button>
        ))}
      </div>
      {open !== null && (
        <Lightbox images={images} index={open} prize={prize} onClose={() => setOpen(null)} onIndex={setOpen} />
      )}
    </>
  );
}

function Lightbox({
  images, index, prize, onClose, onIndex,
}: { images: string[]; index: number; prize: string; onClose: () => void; onIndex: (i: number) => void }) {
  const move = (d: number) => onIndex((index + d + images.length) % images.length);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') move(1);
      if (e.key === 'ArrowLeft') move(-1);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  });

  return (
    <div
      className="fixed inset-0 z-[60] grid p-4"
      style={{ background: 'rgba(0,0,0,.92)', placeItems: 'center' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <button onClick={onClose} aria-label="Cerrar" className="absolute right-5 top-5 text-white/70 hover:text-white">
        <X className="h-7 w-7" />
      </button>

      <img src={images[index]} alt={prize} className="max-h-[86vh] max-w-full rounded-xl object-contain" />

      {images.length > 1 && (
        <>
          <button
            onClick={() => move(-1)} aria-label="Foto anterior"
            className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white"
            style={{ background: 'rgba(255,255,255,.12)' }}
          ><ChevronLeft className="h-6 w-6" /></button>
          <button
            onClick={() => move(1)} aria-label="Foto siguiente"
            className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full text-white"
            style={{ background: 'rgba(255,255,255,.12)' }}
          ><ChevronRight className="h-6 w-6" /></button>
          <div className="absolute bottom-6 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((_, i) => (
              <button
                key={i} onClick={() => onIndex(i)} aria-label={`Foto ${i + 1}`}
                className="h-2 w-2 rounded-full"
                style={{ background: i === index ? GREEN : 'rgba(255,255,255,.3)' }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function PackageCard({ pkg, disabled, onBuy }: { pkg: Pkg; disabled: boolean; onBuy: () => void }) {
  return (
    <div
      className="relative flex flex-col items-center rounded-2xl px-4 pb-5 pt-7 text-center"
      style={{
        background: PANEL,
        border: `1px solid ${pkg.isPopular ? GREEN : LINE}`,
        boxShadow: pkg.isPopular ? '0 0 28px rgba(126,226,62,.25)' : undefined,
      }}
    >
      {pkg.isPopular && (
        <span
          className="absolute -top-[11px] left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full px-3 py-1 text-[10px] font-black tracking-wider text-black"
          style={{ background: GREEN }}
        >MÁS ELEGIDO</span>
      )}
      <div className="flex w-full items-center justify-between gap-2">
        <span
          className="rounded-full px-3 py-1 text-[11.5px] font-black tracking-wide"
          style={{ background: 'rgba(126,226,62,.14)', color: GREEN }}
        >{pkg.chances} {pkg.chances === 1 ? 'CHANCE' : 'CHANCES'}</span>
        <Clover className="h-5 w-5" style={{ color: GREEN }} fill="currentColor" />
      </div>

      <div className="mt-4 text-[34px] font-black leading-none">{money(pkg.price)}</div>
      <div className="mt-1.5 text-[13px]" style={{ color: GREEN }}>
        {pkg.chances} {pkg.chances === 1 ? 'NÚMERO' : 'NÚMEROS'}
      </div>

      <button
        onClick={onBuy} disabled={disabled}
        className="mt-4 w-full rounded-lg py-2.5 text-[13.5px] font-black tracking-wide transition disabled:opacity-40"
        style={pkg.isPopular
          ? { background: GREEN, color: '#000' }
          : { border: `1px solid ${GREEN}`, color: '#fff' }}
      >COMPRAR</button>
    </div>
  );
}

function Faq({ q, a }: { q: string; a: string }) {
  return (
    <div className="rounded-2xl px-6 py-5" style={{ background: PANEL, border: `1px solid ${LINE}` }}>
      <h4 className="text-[14px] font-black" style={{ color: GREEN }}>{q}</h4>
      <p className="mt-1.5 text-[14px]" style={{ color: 'rgba(255,255,255,.75)' }}>{a}</p>
    </div>
  );
}

// ---------------------------------- comprar ----------------------------------

function BuyModal({ pkg, data, onClose }: { pkg: Pkg; data: PublicSorteo; onClose: () => void }) {
  const [form, setForm] = useState({ buyerName: '', buyerEmail: '', buyerPhone: '', holderName: '' });
  const [file, setFile] = useState<File | null>(null);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ id: string; orderNumber: string } | null>(null);

  const submit = async () => {
    if (form.buyerName.trim().length < 3) { setError('Escribí tu nombre completo'); return; }
    if (!form.buyerEmail.trim() && !form.buyerPhone.trim()) { setError('Dejanos un email o un WhatsApp'); return; }
    if (!file && !form.holderName.trim()) {
      setError('Adjuntá el comprobante o escribí el nombre de quien hizo la transferencia');
      return;
    }
    setBusy(true); setError(null);
    try {
      const order = await api.createSorteoOrder({
        packageId: pkg.id,
        buyerName: form.buyerName.trim(),
        buyerEmail: form.buyerEmail.trim() || undefined,
        buyerPhone: form.buyerPhone.trim() || undefined,
        holderName: form.holderName.trim() || undefined,
        hasReceipt: !!file,
      });
      // El comprobante se sube después: recién con la compra creada tenemos el id que
      // habilita la subida.
      if (file) {
        const receiptUrl = await uploadSorteoReceipt(file, order.id);
        await api.attachSorteoReceipt(order.id, { receiptUrl, holderName: form.holderName.trim() || undefined });
      }
      setDone({ id: order.id, orderNumber: order.orderNumber });
    } catch (e: any) {
      setError(e?.message || 'No pudimos registrar tu compra, probá de nuevo');
    } finally { setBusy(false); }
  };

  const waLink = `https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(
    `Hola! Compré ${pkg.chances} chances (${money(pkg.price)}). Mi orden es ${done?.orderNumber ?? ''}`,
  )}`;

  return (
    <div
      className="fixed inset-0 z-50 grid overflow-y-auto p-5"
      style={{ background: 'rgba(0,0,0,.82)', placeItems: 'center' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="relative w-full max-w-[440px] rounded-2xl p-6" style={{ background: PANEL, border: `1px solid ${LINE}` }}>
        <button onClick={onClose} aria-label="Cerrar" className="absolute right-4 top-3" style={{ color: 'rgba(255,255,255,.5)' }}>
          <X className="h-5 w-5" />
        </button>

        {done ? (
          <div className="text-center">
            <Clover className="mx-auto h-12 w-12" style={{ color: GREEN }} fill="currentColor" />
            <h3 className="mt-2 text-[24px] font-black" style={{ color: GREEN }}>¡LISTO!</h3>
            <p className="my-3 text-[14px]" style={{ color: 'rgba(255,255,255,.7)' }}>
              Tu compra <b style={{ color: '#fff' }}>{done.orderNumber}</b> quedó registrada. Apenas verificamos la
              transferencia te asignamos tus {pkg.chances} números y te avisamos.
            </p>
            <a
              href={waLink} target="_blank" rel="noopener noreferrer"
              className="block rounded-lg px-5 py-3 font-black text-white"
              style={{ background: WHATSAPP }}
            >Avisar por WhatsApp</a>
          </div>
        ) : (
          <>
            <h3 className="text-center text-[23px] font-black uppercase">Completá tu compra</h3>
            <p className="text-center text-[13px]" style={{ color: 'rgba(255,255,255,.55)' }}>
              Transferí y cargá el comprobante
            </p>

            <div className="my-4 rounded-xl p-4 text-center" style={{ background: PANEL_2 }}>
              <div className="text-[12px]" style={{ color: 'rgba(255,255,255,.55)' }}>Total a transferir</div>
              <div className="text-[34px] font-black" style={{ color: GREEN }}>{money(pkg.price)}</div>
              <div className="text-[12px]" style={{ color: 'rgba(255,255,255,.55)' }}>{pkg.chances} chances</div>
            </div>

            <div className="mb-4 rounded-xl p-4" style={{ border: `1px solid ${LINE}` }}>
              <label className="mb-2 block text-[11px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,.5)' }}>Alias</label>
              <div className="flex gap-2.5">
                <code className="flex-1 rounded-lg px-3.5 py-2.5 font-bold" style={{ background: PANEL_2, border: `1px solid ${LINE}`, color: GREEN }}>
                  {data.paymentAlias}
                </code>
                <button
                  onClick={() => { navigator.clipboard.writeText(data.paymentAlias); setCopied(true); setTimeout(() => setCopied(false), 1600); }}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 text-[13px] font-bold"
                  style={{ border: `1px solid ${GREEN}`, color: GREEN }}
                >{copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />} {copied ? 'Copiado' : 'Copiar'}</button>
              </div>
              {data.paymentHolder && (
                <p className="mt-2 text-[12px]" style={{ color: 'rgba(255,255,255,.5)' }}>Titular: {data.paymentHolder}</p>
              )}
            </div>

            <div className="space-y-2.5">
              <Field placeholder="Nombre completo *" value={form.buyerName} onChange={(v) => setForm({ ...form, buyerName: v })} />
              <Field placeholder="Email (recibís tus números acá)" type="email" value={form.buyerEmail} onChange={(v) => setForm({ ...form, buyerEmail: v })} />
              <Field placeholder="WhatsApp — ej: 1139554443" value={form.buyerPhone} onChange={(v) => setForm({ ...form, buyerPhone: v })} />
            </div>

            <div className="mt-4 rounded-xl p-4" style={{ border: `1px solid ${LINE}` }}>
              <p className="mb-3 text-[12.5px]" style={{ color: 'rgba(255,255,255,.65)' }}>
                Para validar que la transferencia llegó necesitamos <b style={{ color: GREEN }}>una de las dos</b>:
                el comprobante o el nombre de quien transfirió.
              </p>
              <label
                className="flex cursor-pointer items-center justify-center gap-2 rounded-lg px-4 py-3 text-[13.5px] font-black text-black"
                style={{ background: GREEN }}
              >
                <Upload className="h-4 w-4" />
                {file ? file.name.slice(0, 28) : 'SUBÍ EL COMPROBANTE'}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </label>
              <div className="my-2.5 text-center text-[11.5px] font-bold" style={{ color: 'rgba(255,255,255,.4)' }}>O BIEN</div>
              <Field placeholder="Nombre de quien hizo la transferencia" value={form.holderName} onChange={(v) => setForm({ ...form, holderName: v })} />
            </div>

            {error && <p className="mt-2.5 text-[13.5px]" style={{ color: '#ffb4a2' }}>{error}</p>}

            <div className="mt-4 flex gap-2.5">
              <button onClick={onClose} className="flex-1 rounded-lg py-2.5 font-bold" style={{ border: `1px solid ${LINE}`, color: 'rgba(255,255,255,.7)' }}>
                Cancelar
              </button>
              <button
                onClick={submit} disabled={busy}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 font-black text-black disabled:opacity-50"
                style={{ background: GREEN }}
              >{busy && <Loader2 className="h-4 w-4 animate-spin" />} Finalizar compra</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Field({ placeholder, value, onChange, type = 'text' }: { placeholder: string; value: string; onChange: (v: string) => void; type?: string }) {
  return (
    <input
      type={type} placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full rounded-lg px-3.5 py-2.5 text-[15px] outline-none"
      style={{ background: PANEL_2, border: `1px solid ${LINE}`, color: '#f4f6f4' }}
    />
  );
}

// -------------------------------- mis números --------------------------------

const STATUS_TEXT: Record<string, string> = {
  PENDIENTE: 'Estamos verificando tu transferencia. Apenas la confirmemos te asignamos los números.',
  APROBADO: '',
  RECHAZADO: 'No pudimos verificar esta transferencia. Escribinos por WhatsApp.',
};

function Consulta() {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<any[] | null>(null);
  const [busy, setBusy] = useState(false);

  const search = async () => {
    if (q.trim().length < 5) return;
    setBusy(true);
    try { setRows(await api.sorteoLookup(q.trim())); }
    catch { setRows([]); }
    finally { setBusy(false); }
  };

  return (
    <section id="consulta" className="py-12">
      <h2 className="mb-2 text-center text-[clamp(24px,3.4vw,36px)] font-black">CONSULTÁ TUS NÚMEROS</h2>
      <p className="mb-6 text-center text-[14px]" style={{ color: 'rgba(255,255,255,.55)' }}>
        Buscá con el mismo email o WhatsApp que usaste al comprar
      </p>

      <div className="mx-auto flex max-w-[540px] flex-wrap justify-center gap-2.5">
        <input
          placeholder="Email o teléfono" value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && search()}
          className="min-w-0 flex-1 rounded-lg px-3.5 py-2.5 text-[15px] outline-none"
          style={{ background: PANEL_2, border: `1px solid ${LINE}`, color: '#f4f6f4' }}
        />
        <button
          onClick={search} disabled={busy}
          className="inline-flex items-center gap-2 rounded-lg px-6 py-2.5 font-black text-black disabled:opacity-50"
          style={{ background: GREEN }}
        >{busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />} Consultar</button>
      </div>

      {rows && !rows.length && (
        <p className="mt-6 text-center text-[14px]" style={{ color: 'rgba(255,255,255,.55)' }}>
          No encontramos compras con ese dato. Tiene que ser el mismo email o teléfono que cargaste al comprar.
        </p>
      )}

      <div className="mx-auto mt-8 max-w-[560px] space-y-5">
        {rows?.map((o) => (
          <div key={o.id} className="rounded-md p-6" style={{ background: '#fff', color: '#111', border: '3px solid #111' }}>
            <h3 className="mb-4 border-b-[3px] pb-2.5 text-center text-[22px] font-black" style={{ borderColor: '#4bb814' }}>
              COMPROBANTE DE COMPRA
            </h3>
            <p className="mb-3">¡Estás participando por una <b>{o.prize}</b>!</p>
            <p className="text-[15px]"><b>Comprador:</b> {o.buyerName}</p>
            <p className="text-[15px]"><b>Total de Chances:</b> {o.chances}</p>
            <p className="text-[15px]"><b>Total Pagado:</b> <span style={{ color: '#16a34a' }}>{money(o.amount)}</span></p>

            {o.numbers.length ? (
              <>
                <p className="mt-3 font-bold">Tus Números:</p>
                <div className="mt-2 flex flex-wrap gap-2.5">
                  {o.numbers.map((n: number) => (
                    <span key={n} className="rounded-md px-4 py-2 text-[18px] font-extrabold text-black" style={{ background: '#a8ef70' }}>{n}</span>
                  ))}
                </div>
              </>
            ) : (
              <p className="mt-3 rounded-md p-2.5 text-center font-bold" style={{ background: '#fff3cd', border: '1px solid #e0b400' }}>
                {STATUS_TEXT[o.status] || ''}
              </p>
            )}

            <p className="mt-4 text-center text-[12px]" style={{ color: '#666' }}>
              Compra {o.orderNumber} · {new Date(o.createdAt).toLocaleDateString('es-AR')}
            </p>
            <p className="text-center font-semibold">Mucha suerte y siempre con fe!</p>
          </div>
        ))}
      </div>
    </section>
  );
}
