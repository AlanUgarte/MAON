'use client';
import { useEffect, useState } from 'react';
import { Store, ExternalLink, Save, Check } from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useTiendaSettings, type TiendaSettings } from '@/lib/tienda-settings-store';

const inputClass = 'h-10 w-full rounded-xl border border-line/15 bg-surface-2/60 px-3 text-sm text-content focus:border-primary/50 focus:outline-none';
const labelClass = 'mb-1.5 block text-xs font-medium text-muted';

export default function TiendaConfigPage() {
  const { settings, save } = useTiendaSettings();
  const [form, setForm] = useState<TiendaSettings>(settings);
  const [saved, setSaved] = useState(false);

  useEffect(() => setForm(settings), [settings]);

  const set = <K extends keyof TiendaSettings>(key: K, value: TiendaSettings[K]) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSave = () => {
    save(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <Topbar title="Tienda online" subtitle="Configurá el banner, los mínimos de compra y el WhatsApp de la tienda pública" />
      <main className="flex-1 space-y-5 p-5 lg:p-7">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Store className="h-4 w-4 text-primary" /> Configuración</CardTitle>
            <a href="/tienda" target="_blank" rel="noreferrer">
              <Button variant="outline"><ExternalLink className="h-4 w-4" /> Ver tienda</Button>
            </a>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className={labelClass}>Texto del banner superior</label>
              <input className={inputClass} value={form.topBannerText} onChange={(e) => set('topBannerText', e.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className={labelClass}>Compra mínima ($)</label>
                <input type="number" className={inputClass} value={form.minCompra} onChange={(e) => set('minCompra', Number(e.target.value))} />
              </div>
              <div>
                <label className={labelClass}>Envío gratis desde ($)</label>
                <input type="number" className={inputClass} value={form.envioGratisDesde} onChange={(e) => set('envioGratisDesde', Number(e.target.value))} />
              </div>
              <div>
                <label className={labelClass}>WhatsApp del negocio (sin +, ej: 5493411234567)</label>
                <input className={inputClass} value={form.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} />
              </div>
              <div>
                <label className={labelClass}>Margen de venta (%)</label>
                <input
                  type="number"
                  className={inputClass}
                  value={Math.round(form.margenVenta * 100)}
                  onChange={(e) => set('margenVenta', Number(e.target.value) / 100)}
                />
              </div>
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
