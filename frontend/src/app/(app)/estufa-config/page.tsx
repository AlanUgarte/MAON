'use client';

// Config de la landing de la estufa (segunda tienda de prueba) — mismo patrón que
// tienda-config, pero un solo formulario: acá no hay catálogo, banners ni pedidos
// propios (esa página sigue siendo un solo producto, sin admin genérico de multi-tienda).
import { useEffect, useState } from 'react';
import { Store, Save, Check, ExternalLink } from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useEstufaSettings, type EstufaSettings } from '@/lib/estufa-settings-store';

const inputClass = 'h-10 w-full rounded-xl border border-line/15 bg-surface-2/60 px-3 text-sm text-content focus:border-primary/50 focus:outline-none';
const labelClass = 'mb-1.5 block text-xs font-medium text-muted';

export default function EstufaConfigPage() {
  const { settings, save, status } = useEstufaSettings();
  const [form, setForm] = useState<EstufaSettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  const set = <K extends keyof EstufaSettings>(key: K, value: EstufaSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    save(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Topbar title="Estufa (test)" subtitle="Configurá el precio, el banner y el WhatsApp de la landing de la estufa" />
      <main className="flex-1 space-y-5 p-5 lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Badge tone={form.storeOpen ? 'emerald' : 'rose'} dot>{form.storeOpen ? 'Tienda abierta' : 'Tienda cerrada'}</Badge>
          <a href="/estufa" target="_blank" rel="noreferrer">
            <Button variant="outline"><ExternalLink className="h-4 w-4" /> Ver landing</Button>
          </a>
        </div>

        {status === 'error' && (
          <div className="rounded-xl border border-rose/30 bg-rose/8 px-4 py-2.5 text-[12.5px] font-medium text-rose">
            No se pudo conectar al servidor — se muestra la última config guardada en este navegador.
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> Configuración de la estufa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-line/15 bg-surface-2/40 p-3.5">
              <div>
                <div className="text-sm font-semibold text-content">Landing habilitada</div>
                <div className="text-xs text-muted">Si la apagás, la landing muestra un aviso de "cerrado" en vez del producto.</div>
              </div>
              <button
                onClick={() => set('storeOpen', !form.storeOpen)}
                className={`relative h-6 w-11 rounded-full transition ${form.storeOpen ? 'bg-emerald' : 'bg-line/30'}`}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.storeOpen ? 'translate-x-[22px]' : 'translate-x-0.5'}`} />
              </button>
            </div>

            <div>
              <label className={labelClass}>Texto del banner superior</label>
              <input className={inputClass} value={form.topBannerText} onChange={(e) => set('topBannerText', e.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Precio ($)</label>
                <input type="number" className={inputClass} value={form.price} onChange={(e) => set('price', Number(e.target.value) || 0)} />
              </div>
              <div>
                <label className={labelClass}>WhatsApp del negocio (sin +, ej: 5493411234567)</label>
                <input className={inputClass} value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} />
              </div>
            </div>

            <div>
              <label className={labelClass}>Insignia del banner principal</label>
              <input className={inputClass} value={form.heroBadge} onChange={(e) => set('heroBadge', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Título</label>
              <input className={inputClass} value={form.heroTitle} onChange={(e) => set('heroTitle', e.target.value)} />
            </div>
            <div>
              <label className={labelClass}>Subtítulo</label>
              <input className={inputClass} value={form.heroSubtitle} onChange={(e) => set('heroSubtitle', e.target.value)} />
            </div>

            <Button onClick={handleSave} className="w-full sm:w-auto">
              {saved ? <><Check className="h-4 w-4" /> Guardado</> : <><Save className="h-4 w-4" /> Guardar cambios</>}
            </Button>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
