'use client';

// Landing page de un solo producto (estufa halógena), separada del catálogo mayorista de /tienda.
// El precio, banner y WhatsApp se editan desde /estufa-config (EstufaSettings) — el resto
// (fotos, specs, testimonios) sigue hardcodeado a propósito, sigue siendo una sola tienda de
// prueba, no un sistema genérico de micro-tiendas.
import Image from 'next/image';
import {
  Flame, MessageCircle, Truck, ShieldCheck, RefreshCw, Zap,
  Gauge, Feather, Home, Building2, Sofa, Warehouse, PlugZap, TriangleAlert, Banknote,
} from 'lucide-react';
import { useEstufaSettings } from '@/lib/estufa-settings-store';

const money = (n: number) => '$' + n.toLocaleString('es-AR');

// Paleta tomada del propio producto: el negro del cuerpo, el brasero anaranjado encendido
// y el beige cálido de los ambientes de las fotos — para que la página "se sienta" como
// la estufa en vez de un genérico azul/verde corporativo.
const GLOW = '#F2941C';
const GLOW_DEEP = '#C24A1E';
const DARK = '#1C1512';
const CREAM = '#FBF3EA';
const INK = '#2C221D';
const WHATSAPP = '#25D366';

const waLink = (number: string, text: string) => `https://wa.me/${number}?text=${encodeURIComponent(text)}`;

// Datos reales del producto (modelo Sprint CS-01), no genéricos.
const FEATURES = [
  { icon: Zap, title: 'Encendido inmediato', desc: 'Las velas halógenas irradian calor directo sin esperar.' },
  { icon: Gauge, title: '2 niveles de calor', desc: 'Nivel I: 400 W · Nivel II: 800 W, según lo que necesites.' },
  { icon: ShieldCheck, title: 'Corte de seguridad', desc: 'Se apaga sola si se cae o se vuelca.' },
  { icon: Feather, title: 'Liviana y portátil', desc: 'Fácil de ubicar en dormitorios, oficinas o el living.' },
];

const SPECS = [
  { icon: PlugZap, label: 'Voltaje', value: '220V' },
  { icon: Zap, label: 'Potencia máxima', value: '800 W' },
  { icon: Gauge, label: 'Niveles de calor', value: '2 (400 W / 800 W)' },
  { icon: TriangleAlert, label: 'Protecciones', value: 'Caída y sobrecalentamiento' },
];

const USE_CASES = [
  { icon: Sofa, title: 'Living' },
  { icon: Home, title: 'Dormitorio' },
  { icon: Building2, title: 'Oficina' },
  { icon: Warehouse, title: 'Quincho o garage' },
];

export default function EstufaPage() {
  const { settings } = useEstufaSettings();
  const orderText = `¡Hola! Quiero comprar la ${settings.heroTitle} a ${money(settings.price)}. Pago en efectivo o por transferencia.`;

  if (!settings.storeOpen) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 px-4 text-center" style={{ background: CREAM }}>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl text-white" style={{ background: GLOW }}>
          <Flame className="h-7 w-7" fill="currentColor" />
        </div>
        <h1 className="font-display text-xl font-extrabold" style={{ color: INK }}>{settings.heroTitle}</h1>
        <p className="max-w-xs text-sm text-neutral-500">Por ahora no estamos tomando pedidos. Escribinos por WhatsApp y te avisamos apenas esté disponible.</p>
        <a href={waLink(settings.whatsappNumber, orderText)} target="_blank" rel="noreferrer" className="mt-2 flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white" style={{ background: WHATSAPP }}>
          <MessageCircle className="h-4 w-4" /> Escribir por WhatsApp
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: CREAM, color: INK }}>
      {/* Barra superior + header agrupados en un mismo sticky: si van sueltos, la barra
          (no sticky) desaparece apenas se scrollea un poco mientras el header queda pegado
          arriba, y da la sensación de que el header "salta" o tapa contenido. */}
      <div className="sticky top-0 z-30">
        <div className="truncate px-4 py-1.5 text-center text-[11px] font-semibold tracking-wide text-white" style={{ background: DARK }}>
          🔥 {settings.topBannerText}
        </div>
        <header className="flex items-center justify-between border-b border-black/[0.06] bg-white/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl text-white" style={{ background: GLOW }}>
              <Flame className="h-4.5 w-4.5" fill="currentColor" />
            </div>
            <div className="leading-none">
              <div className="font-display text-[15px] font-extrabold tracking-tight" style={{ color: INK }}>Estufa Halógena</div>
              <div className="text-[9px] font-medium uppercase tracking-widest text-neutral-400">Un producto de MAON</div>
            </div>
          </div>
          <a
            href={waLink(settings.whatsappNumber, orderText)}
            target="_blank"
            rel="noreferrer"
            className="flex h-9 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-bold text-white shadow-sm transition active:scale-95"
            style={{ background: GLOW }}
          >
            <MessageCircle className="h-3.5 w-3.5" /> Comprar ahora
          </a>
        </header>
      </div>

      {/* Hero: foto real de ambiente a pantalla completa con degradé + texto encima.
          object-position sesgado hacia arriba: la foto original tiene las caras en el
          tercio superior, con crop centrado (default) quedaban cortadas.
          El degradé usa un panel oscuro de ancho fijo (no porcentual) para que el texto
          siga siendo legible aunque la pantalla sea muy ancha — con porcentajes, en
          monitores grandes el texto quedaba corrido hacia la zona ya clareada. */}
      <section className="relative h-[440px] w-full overflow-hidden sm:h-[520px] lg:h-[600px]">
        <Image
          src="/estufa/hero.png"
          alt="Estufa Halógena de Cuarzo en un living"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          style={{ objectPosition: '50% 15%' }}
        />
        {/* Panel oscuro parejo (no degradé) del mismo ancho que el contenedor del texto
            (max-w-[1100px] mx-auto): así todo el texto queda con el mismo contraste sin
            importar cuánto ocupe una línea, y el corte con la foto sin oscurecer queda
            justo en el borde del contenido — no antes, como pasaba con el degradé por
            porcentaje de pantalla completa en monitores grandes. */}
        <div className="absolute inset-0 mx-auto max-w-[1100px]" style={{ background: `${DARK}CC` }} />
        <div className="relative z-10 flex h-full max-w-[1100px] flex-col justify-center gap-4 px-5 mx-auto sm:px-8">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: GLOW }}>
            <Flame className="h-3.5 w-3.5" /> {settings.heroBadge}
          </div>
          <h1 className="max-w-md font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
            {settings.heroTitle}
          </h1>
          <p className="max-w-sm text-[14.5px] text-white/85">
            {settings.heroSubtitle}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold text-white">{money(settings.price)}</span>
          </div>
          <a
            href={waLink(settings.whatsappNumber, orderText)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-bold text-white shadow-xl transition active:scale-[0.98]"
            style={{ background: WHATSAPP }}
          >
            <MessageCircle className="h-5 w-5" /> Comprar por WhatsApp
          </a>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-medium text-white/80">
            <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-white/60" /> Envíos a todo el país</span>
            <span className="flex items-center gap-1.5"><Banknote className="h-4 w-4 text-white/60" /> Efectivo o transferencia</span>
            <span className="flex items-center gap-1.5"><RefreshCw className="h-4 w-4 text-white/60" /> Cambios sin cargo</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4 text-white/60" /> Pedido confirmado por WhatsApp</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-[1100px] px-4 py-10">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="flex flex-col items-center gap-2 rounded-2xl bg-white p-4 text-center shadow-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `${GLOW}1E`, color: GLOW_DEEP }}>
                <f.icon className="h-5 w-5" />
              </div>
              <div className="text-[12.5px] font-bold" style={{ color: INK }}>{f.title}</div>
              <div className="text-[11px] text-neutral-500">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Detalle del producto */}
      <section className="mx-auto max-w-[1100px] px-4 py-6">
        <div className="overflow-hidden rounded-3xl shadow-sm">
          <div className="relative aspect-[1536/1024] w-full">
            <Image src="/estufa/detalle.png" alt="Detalle de la Estufa Halógena de Cuarzo" fill sizes="(min-width: 1100px) 1100px, 100vw" className="object-cover" />
          </div>
        </div>
      </section>

      {/* Ficha técnica — datos reales del modelo Sprint CS-01 */}
      <section className="mx-auto max-w-[1100px] px-4 py-6">
        <div className="rounded-3xl bg-white p-5 shadow-sm sm:p-6">
          <div className="mb-4 text-center text-[13px] font-bold uppercase tracking-wide text-neutral-400">Ficha técnica</div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {SPECS.map((s) => (
              <div key={s.label} className="flex flex-col items-center gap-1.5 text-center">
                <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ background: `${GLOW}1E`, color: GLOW_DEEP }}>
                  <s.icon className="h-4.5 w-4.5" />
                </div>
                <div className="text-[13px] font-extrabold" style={{ color: INK }}>{s.value}</div>
                <div className="text-[10.5px] text-neutral-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ideal para + foto de dormitorio */}
      <section className="mx-auto max-w-[1100px] px-4 py-10">
        <h2 className="mb-5 text-center font-display text-xl font-extrabold" style={{ color: INK }}>¿Dónde la podés usar?</h2>
        <div className="grid gap-4 lg:grid-cols-[1.1fr_1fr]">
          <div className="relative min-h-[260px] overflow-hidden rounded-3xl shadow-sm">
            <Image src="/estufa/dormitorio.png" alt="Estufa Halógena de Cuarzo en un dormitorio de noche" fill sizes="(min-width: 1100px) 550px, 100vw" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4">
              <div className="text-[13px] font-bold text-white">También calienta la noche de tu hijo/a</div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {USE_CASES.map((u) => (
              <div key={u.title} className="flex flex-col items-center justify-center gap-2 rounded-2xl border border-black/[0.06] bg-white p-5 text-center">
                <u.icon className="h-7 w-7" style={{ color: GLOW_DEEP }} />
                <div className="text-[13px] font-semibold text-neutral-700">{u.title}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 py-14 text-center text-white" style={{ background: `linear-gradient(120deg, ${GLOW}, ${GLOW_DEEP})` }}>
        <h2 className="font-display text-2xl font-extrabold">Llevá la tuya por {money(settings.price)}</h2>
        <p className="mt-2 text-[13px] text-white/85">Pagás en efectivo o por transferencia. Coordinamos el envío por WhatsApp.</p>
        <a
          href={waLink(settings.whatsappNumber, orderText)}
          target="_blank"
          rel="noreferrer"
          className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-7 py-3.5 text-[15px] font-bold shadow-lg transition active:scale-[0.98]"
          style={{ color: GLOW_DEEP }}
        >
          <MessageCircle className="h-5 w-5" /> Comprar por WhatsApp
        </a>
      </section>

      {/* Footer */}
      <footer className="border-t border-black/5 bg-white px-4 py-6 text-center text-[11.5px] text-neutral-400">
        Un producto de <span className="font-semibold text-neutral-500">MAON — Mayorista Online</span>
      </footer>

      {/* WhatsApp flotante */}
      <a
        href={waLink(settings.whatsappNumber, orderText)}
        target="_blank"
        rel="noreferrer"
        aria-label="Comprar por WhatsApp"
        className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-2xl transition hover:scale-105"
        style={{ background: WHATSAPP }}
      >
        <MessageCircle className="h-6 w-6" fill="currentColor" />
      </a>
    </div>
  );
}
