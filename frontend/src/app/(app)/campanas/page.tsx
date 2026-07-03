'use client';
import { useEffect, useState } from 'react';
import { Plus, Send, Users, Eye, MessageCircle, CheckCheck, Megaphone } from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CAMPAIGN_ROWS, type CampaignRow } from '@/lib/mock';
import { api } from '@/lib/api';

const STATUS_TONE: Record<string, any> = {
  COMPLETADA: 'emerald', ENVIANDO: 'amber', BORRADOR: 'muted', PROGRAMADA: 'sky', CANCELADA: 'rose',
};

const STAGE_OPTIONS = ['NUEVO_LEAD', 'CONTACTADO', 'INTERESADO', 'NEGOCIANDO', 'ESPERANDO_RESPUESTA'];

const BAR_TONE: Record<string, string> = {
  primary: 'bg-primary', sky: 'bg-sky', amber: 'bg-amber', emerald: 'bg-emerald',
};
function Funnel({ label, value, total, icon: Icon, tone }: any) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-[11px]">
        <span className="flex items-center gap-1 text-muted"><Icon className="h-3 w-3" /> {label}</span>
        <span className="tnum font-semibold text-content">{value} · {pct}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-line/10">
        <div className={`h-full rounded-full ${BAR_TONE[tone]}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function fromBackendCampaign(c: any): CampaignRow {
  return {
    id: c.id, name: c.name, status: c.status,
    recipients: c.totalRecipients ?? 0, sent: c.sentCount ?? 0, delivered: c.deliveredCount ?? 0,
    read: 0, replied: 0, date: c.createdAt ? c.createdAt.slice(0, 10) : '—',
  };
}

export default function CampanasPage() {
  const [stage, setStage] = useState('INTERESADO');
  const [message, setMessage] = useState('¡Hola {nombre}! 📱 Esta semana 20% OFF en fundas iPhone. Quedan pocas unidades 🔥 ¿Te reservo una?');
  const [estimated, setEstimated] = useState(142);
  const [rows, setRows] = useState<CampaignRow[]>(CAMPAIGN_ROWS);
  const [source, setSource] = useState<'backend' | 'local'>('local');
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    api.campaigns()
      .then((res) => { setRows((res.data ?? res).map(fromBackendCampaign)); setSource('backend'); })
      .catch(() => setSource('local'));
  }, []);

  useEffect(() => {
    if (source !== 'backend') return;
    api.previewSegment({ stage }).then((r) => setEstimated(r.count)).catch(() => {});
  }, [stage, source]);

  const sendCampaign = async () => {
    if (source !== 'backend') { setNotice('Conectá el backend para poder enviar campañas reales.'); return; }
    setSending(true);
    setNotice('');
    try {
      const created = await api.createCampaign({ name: `Campaña ${new Date().toLocaleDateString('es-AR')}`, message, filters: { stage } });
      await api.sendCampaign(created.id);
      const res = await api.campaigns();
      setRows((res.data ?? res).map(fromBackendCampaign));
      setNotice('Campaña enviada.');
    } catch (err: any) {
      setNotice(err.message || 'No se pudo enviar la campaña.');
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Topbar title="Campañas" subtitle="Envíos masivos segmentados por WhatsApp" />
      <main className="flex-1 space-y-5 p-5 lg:p-7">
        {/* Constructor de segmento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Megaphone className="h-4 w-4 text-primary" /> Nueva campaña</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-3 lg:col-span-2">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Mensaje (usá {'{nombre}'} para personalizar)</label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full rounded-xl border border-line/15 bg-surface-2/60 p-3 text-sm text-content focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] text-muted">Segmento:</span>
                  <select
                    value={stage}
                    onChange={(e) => setStage(e.target.value)}
                    className="h-7 rounded-lg border border-line/15 bg-surface px-2 text-[11px] font-semibold text-content focus:border-primary/50 focus:outline-none"
                  >
                    {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {source === 'local' && <Badge tone="muted">Backend no conectado</Badge>}
                </div>
                {notice && <div className="rounded-lg border border-line/10 bg-surface-2/60 px-3 py-2 text-[11.5px] text-muted">{notice}</div>}
              </div>

              <div className="flex flex-col justify-between rounded-2xl border border-primary/20 bg-primary/5 p-4">
                <div>
                  <div className="text-xs text-muted">Destinatarios estimados</div>
                  <div className="mt-1 flex items-end gap-2">
                    <span className="font-display text-4xl font-bold tnum text-content">{estimated}</span>
                    <span className="mb-1 flex items-center gap-1 text-xs text-muted"><Users className="h-3.5 w-3.5" /> clientes</span>
                  </div>
                </div>
                <Button className="mt-4 w-full" size="lg" onClick={sendCampaign} disabled={sending || !message.trim()}>
                  <Send className="h-4 w-4" /> {sending ? 'Enviando…' : 'Enviar campaña'}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Historial */}
        <div>
          <h2 className="mb-3 font-display text-sm font-semibold text-content">Historial de campañas</h2>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {rows.map((c) => (
              <Card key={c.id} className="p-5 shadow-card">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-content">{c.name}</h3>
                    <div className="mt-0.5 text-[11px] text-muted">{c.date} · {c.recipients} destinatarios</div>
                  </div>
                  <Badge tone={STATUS_TONE[c.status]} dot>{c.status}</Badge>
                </div>
                {c.recipients > 0 ? (
                  <div className="mt-4 space-y-2.5">
                    <Funnel label="Enviados" value={c.sent} total={c.recipients} icon={Send} tone="primary" />
                    <Funnel label="Entregados" value={c.delivered} total={c.recipients} icon={CheckCheck} tone="sky" />
                    <Funnel label="Leídos" value={c.read} total={c.recipients} icon={Eye} tone="amber" />
                    <Funnel label="Respondidos" value={c.replied} total={c.recipients} icon={MessageCircle} tone="emerald" />
                  </div>
                ) : (
                  <div className="mt-4 rounded-xl border border-dashed border-line/15 p-4 text-center text-[12px] text-muted">
                    Borrador sin enviar — definí el segmento y el mensaje para lanzarla.
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      </main>
    </>
  );
}
