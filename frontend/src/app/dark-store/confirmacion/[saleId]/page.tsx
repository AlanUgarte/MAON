'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, FileText, Package, Truck, XCircle } from 'lucide-react';
import { BG, CARD, CARD_BORDER, ACCENT, NEON, ROSE, TEXT, MUTED, money, loadOrderSummary, type DarkStoreOrderSummary } from '../../_lib';
import { useDarkStoreShell } from '../../_useShell';
import { Header } from '../../_components/Header';
import { API_URL, api } from '@/lib/api';

// Los 3 estados reales que el negocio puede confirmar (PENDIENTE/PAGADA cuentan como
// "Preparando" — no hay un paso intermedio real como "Empaquetando" en el sistema, así
// que no se inventa uno que no se pueda actualizar de verdad).
const STEPS = [
  { key: 'PENDIENTE', label: 'Preparando', icon: Package },
  { key: 'ENVIADA', label: 'En camino', icon: Truck },
  { key: 'ENTREGADA', label: 'Entregado', icon: CheckCircle2 },
] as const;

function stepIndex(status: string | null): number {
  if (status === 'ENTREGADA') return 2;
  if (status === 'ENVIADA') return 1;
  return 0; // PENDIENTE, PAGADA, o todavía no cargó
}

function TrackingBar({ status }: { status: string | null }) {
  if (status === 'CANCELADA') {
    return (
      <div className="flex items-center gap-2 rounded-xl px-3.5 py-3 text-[12.5px] font-semibold" style={{ background: 'rgba(244,63,94,0.12)', color: ROSE }}>
        <XCircle className="h-4 w-4" /> Este pedido fue cancelado.
      </div>
    );
  }
  const active = stepIndex(status);
  return (
    <div className="flex items-center">
      {STEPS.map((s, i) => {
        const done = i <= active;
        const Icon = s.icon;
        return (
          <div key={s.key} className="flex flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              {i > 0 && (
                <div className="h-[2px] flex-1" style={{ background: '#0D1017' }}>
                  <motion.div
                    className="h-full"
                    style={{ background: ACCENT }}
                    initial={{ width: 0 }}
                    animate={{ width: i <= active ? '100%' : 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              )}
              <motion.div
                animate={done ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.4 }}
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                style={{ background: done ? ACCENT : '#0D1017', border: `1px solid ${done ? ACCENT : CARD_BORDER}` }}
              >
                <Icon className="h-4 w-4" style={{ color: done ? TEXT : MUTED }} />
              </motion.div>
              {i < STEPS.length - 1 && (
                <div className="h-[2px] flex-1" style={{ background: '#0D1017' }}>
                  <motion.div
                    className="h-full"
                    style={{ background: ACCENT }}
                    initial={{ width: 0 }}
                    animate={{ width: i < active ? '100%' : 0 }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                </div>
              )}
            </div>
            <span className="mt-1.5 text-center text-[10.5px] font-semibold" style={{ color: done ? TEXT : MUTED }}>{s.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function DarkStoreConfirmationPage() {
  const params = useParams<{ saleId: string }>();
  const router = useRouter();
  const { settings, items, cart, cartTotal } = useDarkStoreShell();
  const [numero, setNumero] = useState('');
  const [order, setOrder] = useState<DarkStoreOrderSummary | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    setNumero(new URLSearchParams(window.location.search).get('numero') || '');
    setOrder(loadOrderSummary());
  }, []);

  // Se refresca solo cada 15s mientras el pedido siga en curso — así el cliente ve el
  // "En camino"/"Entregado" sin tener que recargar la página a mano.
  useEffect(() => {
    let cancelled = false;
    const poll = () => {
      api.saleStatus(params.saleId).then((res) => { if (!cancelled) setStatus(res.status); }).catch(() => {});
    };
    poll();
    const id = setInterval(() => {
      if (status === 'ENTREGADA' || status === 'CANCELADA') return;
      poll();
    }, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, [params.saleId, status]);

  const remitoUrl = `${API_URL}/sales/${params.saleId}/remito`;
  const fecha = new Date().toLocaleDateString('es-AR');
  const estadoLabel = status === 'ENTREGADA' ? '🟢 Entregado' : status === 'ENVIADA' ? '🚚 En camino' : status === 'CANCELADA' ? '🔴 Cancelado' : '🟡 Confirmado';

  return (
    <div className="min-h-screen" style={{ background: BG, color: TEXT }}>
      <Header settings={settings} items={items} cartCount={cart.count} cartTotal={cartTotal} />

      <div className="mx-auto max-w-[560px] px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }} className="text-center">
          <motion.div
            initial={{ scale: 0, rotate: -30 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
            style={{ background: 'rgba(198,255,60,0.15)' }}
          >
            <CheckCircle2 className="h-9 w-9" style={{ color: NEON }} />
          </motion.div>
          <h1 className="text-2xl font-extrabold">✅ ¡Tu pedido fue confirmado!</h1>
          <p className="mt-1 text-[13.5px]" style={{ color: MUTED }}>
            ¡Gracias por comprar en MAON Dark Store! Recibimos tu pedido correctamente y ya se encuentra en proceso.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
          className="mt-6 rounded-2xl p-5"
          style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}
        >
          <TrackingBar status={status} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.15 }}
          className="mt-4 rounded-2xl p-5"
          style={{ background: CARD, border: `1px solid ${CARD_BORDER}` }}
        >
          <div className="text-[13px] font-bold" style={{ color: TEXT }}>📦 Resumen del pedido</div>
          <div className="mt-3 space-y-1.5 text-[12.5px]" style={{ color: MUTED }}>
            <div className="flex justify-between"><span>N.º de Pedido</span><span style={{ color: TEXT }}>{numero || order?.numero || params.saleId}</span></div>
            <div className="flex justify-between"><span>Fecha</span><span style={{ color: TEXT }}>{fecha}</span></div>
            <div className="flex justify-between"><span>Estado</span><span style={{ color: TEXT }}>{estadoLabel}</span></div>
            <div className="flex justify-between"><span>Método de pago</span><span style={{ color: TEXT }}>Efectivo o Transferencia (alias {settings.paymentAlias})</span></div>
            <div className="flex justify-between"><span>Tipo de entrega</span><span style={{ color: TEXT }}>Envío a domicilio</span></div>
            {order?.address && <div className="flex justify-between gap-3"><span>Dirección</span><span className="text-right" style={{ color: TEXT }}>{order.address}{order.barrio ? ` (${order.barrio})` : ''}</span></div>}
          </div>

          {order && (
            <>
              <div className="mt-4 border-t pt-3 text-[13px] font-bold" style={{ borderColor: CARD_BORDER, color: TEXT }}>Productos</div>
              <div className="mt-2 space-y-1 text-[12.5px]" style={{ color: MUTED }}>
                {order.lines.map((l, i) => (
                  <div key={i} className="flex justify-between">
                    <span>• {l.name} ×{l.qty}</span>
                    <span style={{ color: TEXT }}>{money(l.unitPrice * l.qty)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex items-center justify-between border-t pt-3" style={{ borderColor: CARD_BORDER }}>
                <span className="text-[13px] font-bold" style={{ color: TEXT }}>💰 Total</span>
                <span className="text-[18px] font-extrabold" style={{ color: TEXT }}>{money(order.total)}</span>
              </div>
            </>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25 }}
          className="mt-4 rounded-2xl p-5 text-[12.5px]"
          style={{ background: CARD, border: `1px solid ${CARD_BORDER}`, color: MUTED }}
        >
          <div className="font-bold" style={{ color: TEXT }}>🚚 ¿Qué sigue ahora?</div>
          <p className="mt-1.5">Nuestro equipo ya está preparando tu compra. Te avisamos por WhatsApp apenas salga hacia tu domicilio.</p>
        </motion.div>

        <motion.a
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
          whileTap={{ scale: 0.98 }}
          href={remitoUrl}
          target="_blank"
          rel="noreferrer"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full py-3.5 text-[14px] font-bold"
          style={{ background: ACCENT, color: TEXT }}
        >
          <FileText className="h-4.5 w-4.5" /> Ver remito
        </motion.a>
        <button onClick={() => router.push('/dark-store')} className="mt-3 w-full rounded-full py-3 text-[13px] font-semibold" style={{ color: MUTED }}>
          Volver a la tienda
        </button>
      </div>
    </div>
  );
}
