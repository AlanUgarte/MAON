'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, MessageCircle, Clock } from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreBar } from '@/components/app/score-gauge';
import { CLIENTS } from '@/lib/mock';
import { api } from '@/lib/api';
import { initials } from '@/lib/utils';

const BUCKETS = [
  { key: '24h', label: 'Sin respuesta +24 h', tone: 'sky', min: 12, max: 30 },
  { key: '48h', label: 'Sin respuesta +48 h', tone: 'amber', min: 30, max: 60 },
  { key: '7d', label: 'Sin respuesta +7 días', tone: 'rose', min: 60, max: 9999 },
  { key: '30d', label: 'Reactivar +30 días', tone: 'muted', min: 9999, max: 99999 },
] as const;

const DOT: Record<string, string> = { sky: 'bg-sky', amber: 'bg-amber', rose: 'bg-rose', muted: 'bg-muted' };

interface FollowUpItem {
  id: string; firstName: string; lastName: string; leadScore: number;
  product: string; summary: string;
}

function fromBackend(c: any): FollowUpItem {
  return {
    id: c.id, firstName: c.firstName, lastName: c.lastName ?? '',
    leadScore: c.leadScore ?? 0, product: c.interestedProduct?.name ?? '',
    summary: `Sin respuesta hace un tiempo · intención ${c.buyingIntent ?? '-'}`,
  };
}

export default function SeguimientosPage() {
  const router = useRouter();
  const [board, setBoard] = useState<Record<string, FollowUpItem[]> | null>(null);

  useEffect(() => {
    api.followUps()
      .then((res) => {
        const mapped: Record<string, FollowUpItem[]> = {};
        for (const b of BUCKETS) mapped[b.key] = (res[b.key] ?? []).map(fromBackend);
        setBoard(mapped);
      })
      .catch(() => setBoard(null));
  }, []);

  // Distribuye los clientes mock en columnas de forma representativa (fallback sin backend).
  const cols = BUCKETS.map((b, i) => ({
    ...b,
    items: board ? board[b.key] : CLIENTS.filter((_, idx) => idx % BUCKETS.length === i && CLIENTS[idx].stage !== 'VENTA_CERRADA').map(fromBackend),
  }));

  return (
    <>
      <Topbar title="Seguimientos" subtitle="Clientes que esperan tu próximo movimiento" />
      <main className="flex-1 p-5 lg:p-7">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {cols.map((col) => (
            <div key={col.key} className="flex flex-col">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`h-2 w-2 rounded-full ${DOT[col.tone]}`} />
                  <span className="text-[13px] font-semibold text-content">{col.label}</span>
                </div>
                <Badge tone="muted">{col.items.length}</Badge>
              </div>

              <div className="space-y-2.5">
                {col.items.length === 0 && (
                  <div className="rounded-xl border border-dashed border-line/15 p-6 text-center text-[12px] text-muted">Nada pendiente acá 🎉</div>
                )}
                {col.items.map((c) => (
                  <div key={c.id} className="card space-y-3 p-3.5 shadow-card transition hover:border-primary/25">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-sky/80 text-[11px] font-bold text-white">{initials(`${c.firstName} ${c.lastName}`)}</div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-medium text-content">{c.firstName} {c.lastName}</div>
                        <div className="truncate text-[11px] text-muted">{c.product}</div>
                      </div>
                    </div>
                    <ScoreBar value={c.leadScore} />
                    <p className="line-clamp-2 text-[12px] text-muted">{c.summary}</p>
                    <div className="flex gap-2">
                      <Button size="sm" className="flex-1" onClick={() => router.push(`/bandeja?clientId=${c.id}`)}><MessageCircle className="h-3.5 w-3.5" /> Contactar</Button>
                      <Button size="sm" variant="outline" aria-label="Llamar"><Phone className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
