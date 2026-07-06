'use client';

// Landing page de un solo producto (estufa halógena), separada del catálogo mayorista de /tienda.
// Página de prueba: sin admin config ni backend propio, todo hardcodeado a propósito porque
// por ahora es una sola tienda para testear demanda, no un sistema genérico de micro-tiendas.
import Image from 'next/image';
import {
  Flame, MessageCircle, Truck, ShieldCheck, RefreshCw, Zap, Star,
  Gauge, Feather, Home, Building2, Sofa, Warehouse, PlugZap, TriangleAlert,
} from 'lucide-react';

const WHATSAPP_NUMBER = '5493412708638';
const PRICE = 20000;
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

const waLink = (text: string) => `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`;

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

// EJEMPLO — no son reseñas reales. Reemplazar por comentarios verdaderos de clientes
// antes de mostrar esta sección a público real (una reseña falsa presentada como real
// puede ser publicidad engañosa).
const TESTIMONIALS_ARE_PLACEHOLDER = true;
const EXAMPLE_TESTIMONIALS = [
  { name: 'Cliente de Rosario', text: 'Así se va a ver una reseña real acá: corta, con estrellas y el nombre del cliente.' },
  { name: 'Cliente de Santa Fe', text: 'Espacio de muestra — reemplazalo apenas tengas el primer comentario real de un comprador.' },
  { name: 'Cliente de Funes', text: 'Ejemplo de testimonio. Se saca o se cambia por reseñas verdaderas antes de recibir tráfico real.' },
];

export default function EstufaPage() {
  const orderText = `¡Hola! Quiero comprar la Estufa Halógena de Cuarzo a ${money(PRICE)}.`;

  return (
    <div className="min-h-screen" style={{ background: CREAM, color: INK }}>
      {/* Barra superior */}
      <div className="truncate px-4 py-1.5 text-center text-[11px] font-semibold tracking-wide text-white" style={{ background: DARK }}>
        🔥 Envíos a todo el país · Stock disponible
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-black/[0.06] bg-white/90 px-4 py-3 backdrop-blur">
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
          href={waLink(orderText)}
          target="_blank"
          rel="noreferrer"
          className="flex h-9 items-center gap-1.5 rounded-full px-4 text-[12.5px] font-bold text-white shadow-sm transition active:scale-95"
          style={{ background: GLOW }}
        >
          <MessageCircle className="h-3.5 w-3.5" /> Comprar ahora
        </a>
      </header>

      {/* Hero: foto real de ambiente a pantalla completa con degradé + texto encima.
          object-position sesgado hacia arriba: la foto original tiene las caras en el
          tercio superior, con crop centrado (default) quedaban cortadas. */}
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
        <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${DARK}E6 0%, ${DARK}99 35%, ${DARK}22 65%, transparent 100%)` }} />
        <div className="relative z-10 flex h-full max-w-[1100px] flex-col justify-center gap-4 px-5 mx-auto sm:px-8">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold text-white" style={{ background: GLOW }}>
            <Flame className="h-3.5 w-3.5" /> Calor instantáneo para tu casa
          </div>
          <h1 className="max-w-md font-display text-3xl font-extrabold leading-tight text-white sm:text-4xl lg:text-5xl">
            Estufa Halógena de Cuarzo
          </h1>
          <p className="max-w-sm text-[14.5px] text-white/85">
            Calienta rápido cualquier ambiente chico o mediano, es liviana y se traslada fácil por toda la casa.
          </p>
          <div className="flex items-baseline gap-2">
            <span className="font-display text-4xl font-extrabold text-white">{money(PRICE)}</span>
          </div>
          <a
            href={waLink(orderText)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex w-fit items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-bold text-white shadow-xl transition active:scale-[0.98]"
            style={{ background: WHATSAPP }}
          >
            <MessageCircle className="h-5 w-5" /> Comprar por WhatsApp
          </a>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-medium text-white/80">
            <span className="flex items-center gap-1.5"><Truck className="h-4 w-4 text-white/60" /> Envíos a todo el país</span>
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

      {/* Testimonios (placeholder) */}
      <section className="mx-auto max-w-[1100px] px-4 py-10">
        <div className="mb-5 text-center">
          <h2 className="font-display text-xl font-extrabold" style={{ color: INK }}>Lo que dicen nuestros clientes</h2>
          {TESTIMONIALS_ARE_PLACEHOLDER && (
            <span className="mt-2 inline-block rounded-full bg-amber-100 px-3 py-1 text-[10.5px] font-bold uppercase tracking-wide text-amber-700">
              Ejemplo — reemplazar por reseñas reales
            </span>
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {EXAMPLE_TESTIMONIALS.map((t) => (
            <div key={t.name} className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-sm">
              <div className="mb-2 flex gap-0.5" style={{ color: GLOW_DEEP }}>
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-3.5 w-3.5" fill="currentColor" />)}
              </div>
              <p className="text-[13px] italic text-neutral-600">"{t.text}"</p>
              <div className="mt-3 text-[12px] font-semibold text-neutral-500">{t.name}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 py-14 text-center text-white" style={{ background: `linear-gradient(120deg, ${GLOW}, ${GLOW_DEEP})` }}>
        <h2 className="font-display text-2xl font-extrabold">Llevá la tuya por {money(PRICE)}</h2>
        <p className="mt-2 text-[13px] text-white/85">Coordinamos el envío y la forma de pago por WhatsApp.</p>
        <a
          href={waLink(orderText)}
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
        href={waLink(orderText)}
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
