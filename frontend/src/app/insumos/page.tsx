'use client';

// Home de UGARTE INSUMOS CARNICERIA — mismo patrón que /vyno (una sola página larga
// con ancla al detalle del producto), pero con identidad propia: insumos industriales
// para carnicerías, no premium/elegante — negro/naranja, tipografía bold sans (la
// misma --font-display que ya usa el resto de MAON, sin cargar una fuente nueva).
import { useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import {
  Truck, ShieldCheck, Search, User, ShoppingCart, Menu, X, Star, Plus, Minus,
  Factory, Ruler, Award, Wrench, ScissorsLineDashed,
} from 'lucide-react';
import { useInsumosProductsPublic } from '@/lib/insumos-products-store';
import { useInsumosCart } from '@/lib/insumos-cart';

const BLACK = '#161513';
const ORANGE = '#E4610F';
const ORANGE_DARK = '#B94C0B';
const CREAM = '#FAFAF8';

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

const NAV = [
  { label: 'INICIO', href: '#inicio' },
  { label: 'PRODUCTO', href: '#producto' },
  { label: 'SOBRE NOSOTROS', href: '#nosotros' },
  { label: 'CONTACTO', href: '#footer' },
];

// Medidas de venta reales (largo en metros) — el precio es único, el cliente elige
// la medida que necesita para su sierra. Fuera de esta lista, se coordina por WhatsApp.
const SIZES = [
  '1.60', '1.65', '1.75', '1.80', '1.81', '1.85', '2.00', '2.04', '2.05', '2.10',
  '2.15', '2.20', '2.42', '2.45', '2.48', '2.50', '2.52', '2.55', '2.70', '2.72',
  '2.75', '2.80', '2.82', '2.84', '2.85', '2.90', '2.92', '2.95', '3.00', '3.03',
  '3.05', '3.07', '3.10', '3.15', '3.17', '3.18', '3.20', '3.22', '3.23', '3.24',
  '3.25', '3.30', '3.33', '3.35', '3.37', '3.40', '3.50',
];

function ImagePlaceholder({ className = '', label = 'Imagen del producto — pendiente de carga' }: { className?: string; label?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 border border-dashed text-center ${className}`} style={{ borderColor: 'rgba(228,97,15,0.4)', background: 'rgba(255,255,255,0.02)' }}>
      <ScissorsLineDashed className="h-8 w-8" style={{ color: ORANGE }} />
      <span className="px-4 text-[11px] font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
    </div>
  );
}

export default function InsumosHomePage() {
  const { products, loading } = useInsumosProductsPublic();
  const cart = useInsumosCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [qty, setQty] = useState(1);
  const [size, setSize] = useState('');
  const [sizeError, setSizeError] = useState(false);

  const product = products[0];
  const hasPrice = !!product && product.price > 0;
  const inStock = !!product && product.stock > 0;
  const images = product?.images?.length ? product.images : [undefined, undefined, undefined, undefined];
  const [activeImg, setActiveImg] = useState(0);
  const compareAt = product?.compareAtPrice && product.compareAtPrice > (product.price ?? 0) ? product.compareAtPrice : null;

  const addToCart = () => {
    if (!product) return;
    if (!size) { setSizeError(true); return; }
    cart.add(product.id, size, qty);
  };

  return (
    <div style={{ background: CREAM }} className="min-h-screen font-sans">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-2 text-[10.5px] font-semibold uppercase tracking-widest text-white sm:px-8" style={{ background: BLACK }}>
        <span className="flex items-center gap-1.5"><Factory className="h-3.5 w-3.5" style={{ color: ORANGE }} /> <span className="hidden sm:inline">Somos fabricantes</span><span className="sm:hidden">Fabricantes</span></span>
        <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" style={{ color: ORANGE }} /> Envíos a todo el país</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ background: BLACK, borderColor: 'rgba(255,255,255,0.08)' }} id="inicio">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4 sm:px-8">
          <button className="text-white lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menú">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <a href="#inicio" className="leading-none">
            <span className="block font-display text-[17px] font-extrabold uppercase tracking-tight text-white">Ugarte</span>
            <span className="block text-[9px] font-bold uppercase tracking-[0.2em]" style={{ color: ORANGE }}>Insumos Carnicería</span>
          </a>
          <nav className="ml-4 hidden flex-1 items-center gap-7 text-[12px] font-semibold tracking-wide text-white/75 lg:flex">
            {NAV.map((n) => <a key={n.label} href={n.href} className="transition hover:text-white">{n.label}</a>)}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-white sm:gap-5">
            <button aria-label="Buscar" className="opacity-80 transition hover:opacity-100"><Search className="h-[18px] w-[18px]" /></button>
            <button aria-label="Cuenta" className="hidden opacity-80 sm:block"><User className="h-[18px] w-[18px]" /></button>
            <Link href="/insumos/carrito" aria-label="Carrito" className="relative opacity-90 transition hover:opacity-100">
              <ShoppingCart className="h-[18px] w-[18px]" />
              {cart.count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-black" style={{ background: ORANGE }}>{cart.count}</span>
              )}
            </Link>
          </div>
        </div>
        {menuOpen && (
          <div className="border-t px-4 py-3 lg:hidden" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            {NAV.map((n) => (
              <a key={n.label} href={n.href} onClick={() => setMenuOpen(false)} className="block py-2 text-[13px] font-semibold tracking-wide text-white/80">{n.label}</a>
            ))}
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden" style={{ background: BLACK }}>
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-14 sm:px-8 md:grid-cols-2 lg:py-20">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: ORANGE }}>Calidad de fábrica</div>
            <h1 className="mt-3 font-display text-[32px] font-extrabold uppercase leading-[1.08] text-white sm:text-[42px]">
              Hojas de sierra<br />sin fin Kaiser
            </h1>
            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-white/60">
              Hoja de sierra sin fin de 3/4&quot; (19mm de ancho), marca Kaiser. Somos fabricantes — precio directo, sin intermediarios.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-4 text-white/85">
              {[
                { icon: Award, label: 'Fabricante', sub: 'Directo' },
                { icon: Ruler, label: '47 medidas', sub: 'A elección' },
                { icon: Wrench, label: 'Uso', sub: 'Profesional' },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex flex-col items-start gap-1.5">
                    <Icon className="h-5 w-5" style={{ color: ORANGE }} />
                    <div className="text-[11.5px] font-bold uppercase leading-tight tracking-wide">{f.label}<br />{f.sub}</div>
                  </div>
                );
              })}
            </div>
            <a
              href="#producto"
              className="mt-8 inline-flex h-12 items-center rounded-sm px-8 text-[13px] font-bold uppercase tracking-widest text-white transition hover:opacity-90"
              style={{ background: ORANGE }}
            >
              Comprar ahora
            </a>
          </div>
          <div className="relative aspect-[4/3] w-full">
            {product?.images?.[0] ? (
              <img src={product.images[0]} alt={product.name} className="h-full w-full rounded-sm object-cover" />
            ) : (
              <ImagePlaceholder className="h-full w-full rounded-sm" label="Foto principal del producto — pendiente" />
            )}
          </div>
        </div>
      </section>

      {/* Producto */}
      <section id="producto" className="mx-auto max-w-[1280px] px-4 py-14 sm:px-8 lg:py-20">
        {loading ? (
          <div className="py-20 text-center text-[13px] text-neutral-400">Cargando producto…</div>
        ) : !product ? (
          <div className="py-20 text-center text-[13px] text-neutral-400">Todavía no hay un producto cargado.</div>
        ) : (
          <div className="grid gap-10 md:grid-cols-2 lg:gap-14">
            {/* Galería */}
            <div className="grid grid-cols-[72px_1fr] gap-3">
              <div className="flex max-h-[420px] flex-col gap-2.5 overflow-y-auto">
                {images.map((img, i) => (
                  <button
                    key={i} onClick={() => setActiveImg(i)}
                    className="aspect-square overflow-hidden rounded-sm border-2 transition"
                    style={{ borderColor: activeImg === i ? ORANGE : 'rgba(0,0,0,0.08)' }}
                  >
                    {img ? <img src={img} alt="" className="h-full w-full object-cover" /> : <ImagePlaceholder className="h-full w-full" label="" />}
                  </button>
                ))}
              </div>
              <div className="aspect-square overflow-hidden rounded-sm" style={{ background: '#fff' }}>
                {images[activeImg] ? (
                  <img src={images[activeImg]} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <ImagePlaceholder className="h-full w-full" label="Foto de producto — pendiente de carga" />
                )}
              </div>
            </div>

            {/* Info */}
            <div>
              {product.ratingCount === 0 && (
                <span className="inline-block rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-widest text-white" style={{ background: ORANGE_DARK }}>Nuevo</span>
              )}
              <h2 className="mt-3 font-display text-[24px] font-extrabold uppercase leading-tight text-neutral-900 sm:text-[28px]">{product.name}</h2>

              {product.ratingCount > 0 ? (
                <div className="mt-2 flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4" fill={i < Math.round(product.ratingAvg ?? 0) ? ORANGE : 'none'} style={{ color: ORANGE }} />
                  ))}
                  <span className="text-[12.5px] text-neutral-500">({product.ratingCount} reseñas)</span>
                </div>
              ) : (
                <div className="mt-2 text-[12.5px] text-neutral-400">Todavía sin reseñas — sé el primero en comprar.</div>
              )}

              <div className="mt-4 flex items-baseline gap-3">
                {hasPrice ? (
                  <>
                    <span className="text-[30px] font-extrabold text-neutral-900">{money(product.price)}</span>
                    {compareAt && <span className="text-[16px] text-neutral-400 line-through">{money(compareAt)}</span>}
                  </>
                ) : (
                  <span className="text-[18px] font-semibold text-neutral-400">Precio a confirmar</span>
                )}
              </div>

              <div className="mt-3 flex items-center gap-2 text-[13px] font-semibold" style={{ color: inStock ? '#16794F' : '#B45309' }}>
                <span className="h-2 w-2 rounded-full" style={{ background: inStock ? '#16794F' : '#B45309' }} />
                {inStock ? 'En stock — listo para enviar' : 'Sin stock por el momento'}
              </div>

              <div className="mt-6 border-t pt-6" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Medida (largo en metros) *</div>
                <select
                  value={size}
                  onChange={(e) => { setSize(e.target.value); setSizeError(false); }}
                  className="mt-2 h-11 w-full rounded-sm border px-3.5 text-[13.5px]"
                  style={{ borderColor: sizeError ? '#DC2626' : 'rgba(0,0,0,0.15)', color: size ? '#111' : '#9CA3AF' }}
                >
                  <option value="">Elegí la medida que necesitás</option>
                  {SIZES.map((s) => <option key={s} value={s}>{s} mts</option>)}
                </select>
                {sizeError && <div className="mt-1.5 text-[12px] font-semibold text-rose-600">Elegí una medida antes de agregar al carrito.</div>}
                <div className="mt-1.5 text-[12px] text-neutral-500">¿Necesitás una medida de 5/8&quot; (16mm de ancho)? Avisanos por WhatsApp después de la compra.</div>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Cantidad</div>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center rounded-sm border" style={{ borderColor: 'rgba(0,0,0,0.15)' }}><Minus className="h-4 w-4" /></button>
                <span className="w-8 text-center text-[15px] font-bold">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} className="flex h-10 w-10 items-center justify-center rounded-sm border" style={{ borderColor: 'rgba(0,0,0,0.15)' }}><Plus className="h-4 w-4" /></button>
              </div>

              <button
                onClick={addToCart}
                disabled={!hasPrice || !inStock}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm text-[13px] font-bold uppercase tracking-widest text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: BLACK, height: 52 }}
              >
                <ShoppingCart className="h-4 w-4" /> Agregar al carrito
              </button>
              {cart.count > 0 && (
                <Link href="/insumos/carrito" className="mt-2 block text-center text-[12.5px] font-semibold underline" style={{ color: ORANGE_DARK }}>
                  Tenés {cart.count} en el carrito — ir a comprar →
                </Link>
              )}

              <div className="mt-8 grid grid-cols-3 gap-3 border-t pt-6 text-center" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                {[
                  { icon: Truck, title: 'Envío', sub: 'A todo el país' },
                  { icon: ShieldCheck, title: 'Fabricante', sub: 'Directo' },
                  { icon: Ruler, title: '47 medidas', sub: 'A elección' },
                ].map((f) => {
                  const Icon = f.icon;
                  return (
                    <div key={f.title} className="flex flex-col items-center gap-1.5">
                      <Icon className="h-5 w-5 text-neutral-700" />
                      <div className="text-[11px] font-bold text-neutral-800">{f.title}</div>
                      <div className="text-[10.5px] text-neutral-500">{f.sub}</div>
                    </div>
                  );
                })}
              </div>

              {product.description && <p className="mt-6 whitespace-pre-line text-[13.5px] leading-relaxed text-neutral-600">{product.description}</p>}
            </div>
          </div>
        )}
      </section>

      {/* Sobre nosotros */}
      <section id="nosotros" className="py-16" style={{ background: BLACK }}>
        <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
          <div className="text-center text-[12px] font-bold uppercase tracking-[0.25em]" style={{ color: ORANGE }}>Por qué elegirnos</div>
          <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { icon: Factory, title: 'Somos fabricantes', desc: 'Vendemos directo, sin intermediarios.' },
              { icon: Ruler, title: '47 medidas', desc: 'Encontrá la medida exacta para tu sierra.' },
              { icon: Award, title: 'Marca Kaiser', desc: 'Calidad probada en carnicerías de todo el país.' },
              { icon: Truck, title: 'Envíos', desc: 'Despachamos a todo el país.' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="text-center">
                  <Icon className="mx-auto h-7 w-7" style={{ color: ORANGE }} strokeWidth={1.6} />
                  <div className="mt-3 text-[12px] font-bold uppercase tracking-wide text-white">{f.title}</div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/50">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Videos */}
      <section className="py-16" style={{ background: CREAM }}>
        <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
          <h2 className="text-center text-[13px] font-bold uppercase tracking-[0.25em] text-neutral-800">Mirá nuestros productos en video</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-2">
            <div className="mx-auto w-full" style={{ maxWidth: 450 }}>
              <blockquote
                className="tiktok-embed"
                cite="https://www.tiktok.com/@linkmarket.ml/video/7391928486593662214"
                data-video-id="7391928486593662214"
                style={{ width: '100%' }}
              >
                <section>
                  <a target="_blank" rel="noopener noreferrer" title="@linkmarket.ml" href="https://www.tiktok.com/@linkmarket.ml?refer=embed">@linkmarket.ml</a>
                </section>
              </blockquote>
            </div>
            <div className="mx-auto w-full" style={{ maxWidth: 450 }}>
              <blockquote
                className="tiktok-embed"
                cite="https://www.tiktok.com/@linkmarket.ml/video/7396848907575217414"
                data-video-id="7396848907575217414"
                style={{ width: '100%' }}
              >
                <section>
                  <a target="_blank" rel="noopener noreferrer" title="@linkmarket.ml" href="https://www.tiktok.com/@linkmarket.ml?refer=embed">@linkmarket.ml</a>
                </section>
              </blockquote>
            </div>
          </div>
          <Script src="https://www.tiktok.com/embed.js" strategy="lazyOnload" />
        </div>
      </section>

      <InsumosFooter />
    </div>
  );
}

function InsumosFooter() {
  return (
    <footer id="footer" className="border-t py-14" style={{ background: BLACK, borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="font-display text-lg font-extrabold uppercase tracking-tight text-white">Ugarte Insumos Carnicería</div>
            <p className="mt-3 max-w-[220px] text-[12.5px] leading-relaxed text-white/45">Fabricantes de insumos para carnicerías. Calidad directa de fábrica.</p>
          </div>
          {[
            { title: 'Ayuda', links: ['Envíos', 'Garantía', 'Atención al cliente', 'Contacto'] },
            { title: 'Legal', links: ['Política de privacidad', 'Términos y condiciones', 'Cambios y devoluciones'] },
            { title: 'Medios de pago', links: ['Transferencia bancaria'] },
          ].map((col) => (
            <div key={col.title}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-white/60">{col.title}</div>
              <ul className="mt-3 space-y-2">
                {col.links.map((l) => <li key={l} className="text-[12.5px] text-white/45">{l}</li>)}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-10 border-t pt-6 text-center text-[11px] text-white/30" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          © {new Date().getFullYear()} Ugarte Insumos Carnicería — Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
