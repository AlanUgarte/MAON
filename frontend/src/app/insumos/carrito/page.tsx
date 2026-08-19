'use client';

import Link from 'next/link';
import { ArrowLeft, Minus, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import { useInsumosProductsPublic } from '@/lib/insumos-products-store';
import { useInsumosCart } from '@/lib/insumos-cart';

const BLACK = '#161513';
const ORANGE_DARK = '#B94C0B';
const CREAM = '#FAFAF8';
const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

export default function InsumosCartPage() {
  const { products, loading } = useInsumosProductsPublic();
  const cart = useInsumosCart();

  const lines = cart.lines
    .map((l) => ({ ...l, product: products.find((p) => p.id === l.productId) }))
    .filter((l) => l.product);
  const subtotal = lines.reduce((a, l) => a + (l.product!.price * l.quantity), 0);

  return (
    <div style={{ background: CREAM }} className="min-h-screen font-sans">
      <header className="border-b" style={{ background: BLACK, borderColor: 'rgba(255,255,255,0.08)' }}>
        <div className="mx-auto flex h-16 max-w-[900px] items-center gap-4 px-4 sm:px-8">
          <Link href="/insumos" className="text-white/70 transition hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
          <span className="font-display text-lg font-extrabold uppercase tracking-tight text-white">Ugarte</span>
          <span className="ml-2 text-[13px] text-white/50">Tu carrito</span>
        </div>
      </header>

      <main className="mx-auto max-w-[900px] px-4 py-10 sm:px-8">
        {loading || !cart.hydrated ? (
          <div className="py-20 text-center text-[13px] text-neutral-400">Cargando…</div>
        ) : !lines.length ? (
          <div className="flex flex-col items-center gap-3 rounded-sm border border-dashed py-20 text-center" style={{ borderColor: 'rgba(0,0,0,0.12)' }}>
            <ShoppingCart className="h-8 w-8 text-neutral-300" />
            <p className="text-[14px] text-neutral-500">Tu carrito está vacío.</p>
            <Link href="/insumos" className="mt-2 text-[13px] font-bold underline" style={{ color: ORANGE_DARK }}>Ver el producto →</Link>
          </div>
        ) : (
          <div className="grid gap-8 md:grid-cols-[1fr_320px]">
            <div className="space-y-4">
              {lines.map((l) => (
                <div key={`${l.productId}::${l.size}`} className="flex items-center gap-4 rounded-sm border bg-white p-4" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-neutral-100">
                    {l.product!.images[0] ? <img src={l.product!.images[0]} alt="" className="h-full w-full object-cover" /> : <ShoppingCart className="h-6 w-6 text-neutral-300" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[14px] font-bold text-neutral-900">{l.product!.name}</div>
                    <div className="mt-0.5 text-[13px] text-neutral-500">Medida: <b>{l.size} mts</b> — {money(l.product!.price)} c/u</div>
                    <div className="mt-2 flex items-center gap-2.5">
                      <button onClick={() => cart.add(l.productId, l.size, -1)} className="flex h-8 w-8 items-center justify-center rounded-sm border" style={{ borderColor: 'rgba(0,0,0,0.15)' }}><Minus className="h-3.5 w-3.5" /></button>
                      <span className="w-6 text-center text-[13px] font-bold">{l.quantity}</span>
                      <button onClick={() => cart.add(l.productId, l.size, 1)} className="flex h-8 w-8 items-center justify-center rounded-sm border" style={{ borderColor: 'rgba(0,0,0,0.15)' }}><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <span className="text-[14px] font-extrabold text-neutral-900">{money(l.product!.price * l.quantity)}</span>
                    <button onClick={() => cart.remove(l.productId, l.size)} aria-label="Quitar" className="text-neutral-400 hover:text-rose-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </div>
              ))}
              <Link href="/insumos" className="inline-block text-[12.5px] font-semibold underline" style={{ color: ORANGE_DARK }}>← Seguir viendo el producto</Link>
            </div>

            <div className="h-fit rounded-sm border bg-white p-5" style={{ borderColor: 'rgba(0,0,0,0.08)' }}>
              <div className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">Resumen</div>
              <div className="mt-3 flex items-center justify-between text-[13.5px] text-neutral-600">
                <span>Subtotal</span><span className="font-semibold text-neutral-900">{money(subtotal)}</span>
              </div>
              <div className="mt-1.5 text-[11.5px] text-neutral-400">El envío se calcula en el siguiente paso.</div>
              <Link
                href="/insumos/checkout"
                className="mt-5 flex h-12 w-full items-center justify-center rounded-sm text-[13px] font-bold uppercase tracking-widest text-white transition hover:opacity-90"
                style={{ background: BLACK }}
              >
                Iniciar compra
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
