'use client';

// Home de VYNO — tienda e-commerce retail de un solo producto (por ahora), una sola
// página larga con ancla al detalle del producto, fiel a la referencia visual que
// mandó Alan (barra negra arriba, header, hero, producto, beneficios, sección oscura
// "diseñado para amantes del vino", editorial, testimonios, footer).
import { useState } from 'react';
import Link from 'next/link';
import {
  Truck, ShieldCheck, Search, User, ShoppingCart, Menu, X, Star, Plus, Minus,
  Zap, MousePointerClick, Gift, RotateCcw, Wine, Droplets, Lock, Layers,
} from 'lucide-react';
import { useVynoProductsPublic } from '@/lib/vyno-products-store';
import { useVynoCart } from '@/lib/vyno-cart';

const BLACK = '#0B0B0B';
const BLACK_SOFT = '#151515';
const CHAMPAGNE = '#C6A664';
const CHAMPAGNE_LIGHT = '#E4D2A0';
const CREAM = '#FAF8F5';

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

const NAV = [
  { label: 'INICIO', href: '#inicio' },
  { label: 'PRODUCTO', href: '#producto' },
  { label: 'OFERTAS', href: '#producto' },
  { label: 'SOBRE NOSOTROS', href: '#amantes-del-vino' },
  { label: 'CONTACTO', href: '#footer' },
];

/** Recuadro claramente marcado — reemplaza a una foto real que todavía no tengo.
 * Nunca se muestra como si fuera una foto de producto real (pedido explícito de Alan). */
function ImagePlaceholder({ className = '', label = 'Imagen del producto — pendiente de carga' }: { className?: string; label?: string }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-2 border border-dashed text-center ${className}`} style={{ borderColor: 'rgba(198,166,100,0.4)', background: 'rgba(255,255,255,0.02)' }}>
      <Wine className="h-8 w-8" style={{ color: CHAMPAGNE }} />
      <span className="px-4 text-[11px] font-medium uppercase tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>{label}</span>
    </div>
  );
}

export default function VynoHomePage() {
  const { products, loading } = useVynoProductsPublic();
  const cart = useVynoCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [qty, setQty] = useState(1);

  const product = products[0];
  const hasPrice = !!product && product.price > 0;
  const inStock = !!product && product.stock > 0;
  const images = product?.images?.length ? product.images : [undefined, undefined, undefined, undefined];
  const [activeImg, setActiveImg] = useState(0);
  const compareAt = product?.compareAtPrice && product.compareAtPrice > (product.price ?? 0) ? product.compareAtPrice : null;

  return (
    <div style={{ background: CREAM }} className="min-h-screen font-sans">
      {/* Barra superior */}
      <div className="flex items-center justify-between px-4 py-2 text-[10.5px] font-semibold uppercase tracking-widest text-white sm:px-8" style={{ background: BLACK }}>
        <span className="flex items-center gap-1.5"><Truck className="h-3.5 w-3.5" style={{ color: CHAMPAGNE }} /> <span className="hidden sm:inline">Envíos gratis a todo el país</span><span className="sm:hidden">Envío gratis</span></span>
        <span className="flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5" style={{ color: CHAMPAGNE }} /> Garantía de 12 meses</span>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-40 border-b" style={{ background: BLACK, borderColor: 'rgba(255,255,255,0.08)' }} id="inicio">
        <div className="mx-auto flex h-16 max-w-[1280px] items-center gap-6 px-4 sm:px-8">
          <button className="text-white lg:hidden" onClick={() => setMenuOpen((v) => !v)} aria-label="Menú">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <a href="#inicio" className="text-2xl font-bold tracking-[0.15em] text-white" style={{ fontFamily: 'var(--font-vyno-serif)' }}>VYNO</a>
          <nav className="ml-4 hidden flex-1 items-center gap-7 text-[12px] font-semibold tracking-wide text-white/75 lg:flex">
            {NAV.map((n) => <a key={n.label} href={n.href} className="transition hover:text-white">{n.label}</a>)}
          </nav>
          <div className="ml-auto flex items-center gap-4 text-white sm:gap-5">
            <button aria-label="Buscar" className="opacity-80 transition hover:opacity-100"><Search className="h-[18px] w-[18px]" /></button>
            <button aria-label="Cuenta" className="hidden opacity-80 sm:block"><User className="h-[18px] w-[18px]" /></button>
            <Link href="/vyno/carrito" aria-label="Carrito" className="relative opacity-90 transition hover:opacity-100">
              <ShoppingCart className="h-[18px] w-[18px]" />
              {cart.count > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full text-[9px] font-bold text-black" style={{ background: CHAMPAGNE }}>{cart.count}</span>
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
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-14 sm:px-8 lg:grid-cols-2 lg:py-20">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.25em]" style={{ color: CHAMPAGNE }}>Disfrutá cada momento</div>
            <h1 className="mt-3 text-[34px] font-bold leading-[1.08] text-white sm:text-[46px]" style={{ fontFamily: 'var(--font-vyno-serif)' }}>
              Abridor de vino<br />eléctrico 4 piezas
            </h1>
            <p className="mt-4 max-w-md text-[14.5px] leading-relaxed text-white/60">
              Abrí tus vinos favoritos con un solo toque. Elegancia, practicidad y tecnología en tu mesa.
            </p>
            <div className="mt-7 grid grid-cols-3 gap-4 text-white/85">
              {[
                { icon: Zap, label: 'Recargable', sub: 'USB' },
                { icon: MousePointerClick, label: 'Uso fácil', sub: 'Un solo botón' },
                { icon: Gift, label: 'Ideal para', sub: 'Regalar' },
              ].map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="flex flex-col items-start gap-1.5">
                    <Icon className="h-5 w-5" style={{ color: CHAMPAGNE }} />
                    <div className="text-[11.5px] font-bold uppercase leading-tight tracking-wide">{f.label}<br />{f.sub}</div>
                  </div>
                );
              })}
            </div>
            <a
              href="#producto"
              className="mt-8 inline-flex h-12 items-center rounded-sm px-8 text-[13px] font-bold uppercase tracking-widest text-black transition hover:opacity-90"
              style={{ background: CHAMPAGNE }}
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
          <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
            {/* Galería */}
            <div className="grid grid-cols-[72px_1fr] gap-3">
              <div className="flex max-h-[420px] flex-col gap-2.5 overflow-y-auto">
                {images.map((img, i) => (
                  <button
                    key={i} onClick={() => setActiveImg(i)}
                    className="aspect-square overflow-hidden rounded-sm border-2 transition"
                    style={{ borderColor: activeImg === i ? CHAMPAGNE : 'rgba(0,0,0,0.08)' }}
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
                <span className="inline-block rounded-full px-3 py-1 text-[10.5px] font-bold uppercase tracking-widest text-black" style={{ background: CHAMPAGNE_LIGHT }}>Nuevo</span>
              )}
              <h2 className="mt-3 text-[26px] font-bold leading-tight text-neutral-900 sm:text-[30px]" style={{ fontFamily: 'var(--font-vyno-serif)' }}>{product.name}</h2>

              {product.ratingCount > 0 ? (
                <div className="mt-2 flex items-center gap-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className="h-4 w-4" fill={i < Math.round(product.ratingAvg ?? 0) ? CHAMPAGNE : 'none'} style={{ color: CHAMPAGNE }} />
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
                <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Cantidad</div>
                <div className="mt-2 flex items-center gap-3">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="flex h-10 w-10 items-center justify-center rounded-sm border" style={{ borderColor: 'rgba(0,0,0,0.15)' }}><Minus className="h-4 w-4" /></button>
                  <span className="w-8 text-center text-[15px] font-bold">{qty}</span>
                  <button onClick={() => setQty((q) => Math.min(product.stock || 99, q + 1))} className="flex h-10 w-10 items-center justify-center rounded-sm border" style={{ borderColor: 'rgba(0,0,0,0.15)' }}><Plus className="h-4 w-4" /></button>
                </div>
              </div>

              <button
                onClick={() => cart.add(product.id, qty)}
                disabled={!hasPrice || !inStock}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-sm text-[13px] font-bold uppercase tracking-widest text-white transition hover:opacity-90 disabled:opacity-40"
                style={{ background: BLACK, height: 52 }}
              >
                <ShoppingCart className="h-4 w-4" /> Agregar al carrito
              </button>
              {cart.qtyOf(product.id) > 0 && (
                <Link href="/vyno/carrito" className="mt-2 block text-center text-[12.5px] font-semibold underline" style={{ color: '#8A6B2E' }}>
                  Ya tenés {cart.qtyOf(product.id)} en el carrito — ir a comprar →
                </Link>
              )}

              <div className="mt-8 grid grid-cols-3 gap-3 border-t pt-6 text-center" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                {[
                  { icon: Truck, title: 'Envío gratis', sub: 'A todo el país' },
                  { icon: ShieldCheck, title: 'Garantía', sub: '12 meses' },
                  { icon: RotateCcw, title: 'Devoluciones', sub: '30 días' },
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

              {product.description && <p className="mt-6 text-[13.5px] leading-relaxed text-neutral-600">{product.description}</p>}
            </div>
          </div>
        )}
      </section>

      {/* Diseñado para amantes del vino */}
      <section id="amantes-del-vino" className="py-16" style={{ background: BLACK }}>
        <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
          <div className="text-center text-[12px] font-bold uppercase tracking-[0.25em]" style={{ color: CHAMPAGNE }}>Diseñado para amantes del vino</div>
          <div className="mt-10 grid grid-cols-2 gap-8 sm:grid-cols-4">
            {[
              { icon: Zap, title: 'Abridor eléctrico', desc: 'Abre tus botellas sin esfuerzo en segundos.' },
              { icon: Droplets, title: 'Vertedor', desc: 'Sirve el vino sin derrames ni goteos.' },
              { icon: Lock, title: 'Tapón hermético', desc: 'Conserva el sabor y aroma por más tiempo.' },
              { icon: Layers, title: 'Base elegante', desc: 'Todo organizado en un soporte sofisticado.' },
            ].map((f) => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="text-center">
                  <Icon className="mx-auto h-7 w-7" style={{ color: CHAMPAGNE }} strokeWidth={1.4} />
                  <div className="mt-3 text-[12px] font-bold uppercase tracking-wide text-white">{f.title}</div>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-white/50">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Editorial */}
      <section className="py-16 sm:py-20" style={{ background: '#F1EDE6' }}>
        <div className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 sm:px-8 lg:grid-cols-2">
          <ImagePlaceholder className="aspect-[4/3] rounded-sm" label="Imagen lifestyle — pendiente de carga" />
          <div>
            <h2 className="text-[26px] font-bold leading-tight text-neutral-900 sm:text-[32px]" style={{ fontFamily: 'var(--font-vyno-serif)' }}>
              Elegancia en tu mesa,<br />práctico en tu día a día
            </h2>
            <p className="mt-4 max-w-md text-[14px] leading-relaxed text-neutral-600">
              Un set completo que combina diseño moderno y funcionalidad para que disfrutes cada botella como se merece.
            </p>
          </div>
        </div>
      </section>

      {/* Testimonios */}
      <section className="py-16" style={{ background: CREAM }}>
        <div className="mx-auto max-w-[1280px] px-4 text-center sm:px-8">
          <h2 className="text-[13px] font-bold uppercase tracking-[0.25em] text-neutral-800">Lo que dicen nuestros clientes</h2>
          <div className="mx-auto mt-8 max-w-md rounded-sm border border-dashed p-8" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
            <p className="text-[13.5px] text-neutral-500">Todavía no tenemos reseñas de clientes reales — apenas las primeras compras se completen, van a aparecer acá.</p>
          </div>
        </div>
      </section>

      <VynoFooter />
    </div>
  );
}

function VynoFooter() {
  return (
    <footer id="footer" className="border-t py-14" style={{ background: BLACK, borderColor: 'rgba(255,255,255,0.06)' }}>
      <div className="mx-auto max-w-[1280px] px-4 sm:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="text-xl font-bold tracking-[0.15em] text-white" style={{ fontFamily: 'var(--font-vyno-serif)' }}>VYNO</div>
            <p className="mt-3 max-w-[220px] text-[12.5px] leading-relaxed text-white/45">Accesorios premium para disfrutar cada botella como se merece.</p>
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
          © {new Date().getFullYear()} VYNO — Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
