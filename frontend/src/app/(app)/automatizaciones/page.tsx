'use client';
import { useEffect, useState } from 'react';
import { Bot, Plus, Trash2, Power } from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';

const TRIGGER_LABEL: Record<string, string> = {
  SIN_RESPUESTA_HORAS: 'Sin respuesta (horas)',
  SIN_RESPUESTA_DIAS: 'Sin respuesta (días)',
  COMPRA_REALIZADA: 'Compra realizada',
  TIEMPO_DESDE_COMPRA: 'Tiempo desde la compra',
  CAMBIO_ESTADO: 'Cambio de estado',
  NUEVO_LEAD: 'Nuevo lead',
};
const ACTION_LABEL: Record<string, string> = {
  ENVIAR_MENSAJE: 'Enviar mensaje',
  ENVIAR_PLANTILLA: 'Enviar plantilla',
  CREAR_SEGUIMIENTO: 'Crear seguimiento',
  CAMBIAR_ESTADO: 'Cambiar estado',
  AGREGAR_ETIQUETA: 'Agregar etiqueta',
};
const STAGE_OPTIONS = ['NUEVO_LEAD', 'CONTACTADO', 'INTERESADO', 'NEGOCIANDO', 'ESPERANDO_RESPUESTA', 'VENTA_CERRADA', 'VENTA_PERDIDA'];

interface Automation {
  id: string; name: string; isActive: boolean;
  trigger: string; triggerConfig: any;
  actionType: string; actionConfig: any;
  lastRunAt: string | null; runCount: number;
}

export default function AutomatizacionesPage() {
  const [rules, setRules] = useState<Automation[]>([]);
  const [source, setSource] = useState<'backend' | 'local'>('local');
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [trigger, setTrigger] = useState('SIN_RESPUESTA_HORAS');
  const [triggerValue, setTriggerValue] = useState(48);
  const [actionType, setActionType] = useState('CREAR_SEGUIMIENTO');
  const [message, setMessage] = useState('Hola {nombre}, ¿seguís interesado? 😊');
  const [stage, setStage] = useState('CONTACTADO');

  const load = () => {
    api.automations()
      .then((res) => { setRules(res.data ?? res); setSource('backend'); })
      .catch(() => setSource('local'));
  };
  useEffect(load, []);

  const resetForm = () => {
    setName(''); setTrigger('SIN_RESPUESTA_HORAS'); setTriggerValue(48);
    setActionType('CREAR_SEGUIMIENTO'); setMessage('Hola {nombre}, ¿seguís interesado? 😊'); setStage('CONTACTADO');
    setShowForm(false); setError('');
  };

  const create = async () => {
    if (!name.trim()) { setError('Ponele un nombre a la regla'); return; }
    const triggerConfig = trigger === 'SIN_RESPUESTA_HORAS' ? { hours: triggerValue }
      : trigger === 'SIN_RESPUESTA_DIAS' ? { days: triggerValue } : {};
    const actionConfig = actionType === 'ENVIAR_MENSAJE' ? { message }
      : actionType === 'CAMBIAR_ESTADO' ? { stage }
      : actionType === 'CREAR_SEGUIMIENTO' ? { title: name } : {};
    try {
      await api.createAutomation({ name, trigger, triggerConfig, actionType, actionConfig });
      resetForm();
      load();
    } catch (err: any) {
      setError(err.message === 'Failed to fetch' ? 'Backend no disponible.' : err.message || 'No se pudo crear la regla.');
    }
  };

  const toggle = async (id: string) => {
    try { await api.toggleAutomation(id); load(); } catch { /* backend caído: no se refleja */ }
  };
  const remove = async (id: string) => {
    try { await api.deleteAutomation(id); load(); } catch { /* backend caído: no se refleja */ }
  };

  return (
    <>
      <Topbar title="Automatizaciones" subtitle="Reglas que corren solas cuando no estás mirando" />
      <main className="flex-1 space-y-5 p-5 lg:p-7">
        {source === 'local' && (
          <div className="rounded-xl border border-line/10 bg-surface-2/60 px-4 py-2.5 text-[12.5px] text-muted">
            Backend no conectado — conectá tu cuenta para crear y correr automatizaciones reales.
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4 text-primary" /> Reglas activas</CardTitle>
            <Button onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" /> Nueva regla</Button>
          </CardHeader>
          <CardContent>
            {showForm && (
              <div className="mb-5 space-y-3 rounded-2xl border border-line/10 bg-surface-2/40 p-4">
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Nombre</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Reactivar clientes sin respuesta"
                    className="h-10 w-full rounded-xl border border-line/15 bg-surface px-3 text-sm text-content focus:border-primary/50 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">Disparador</label>
                    <select
                      value={trigger}
                      onChange={(e) => setTrigger(e.target.value)}
                      className="h-10 w-full rounded-xl border border-line/15 bg-surface px-3 text-sm text-content focus:border-primary/50 focus:outline-none"
                    >
                      {Object.entries(TRIGGER_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                    </select>
                  </div>
                  {(trigger === 'SIN_RESPUESTA_HORAS' || trigger === 'SIN_RESPUESTA_DIAS') && (
                    <div>
                      <label className="mb-1.5 block text-xs font-medium text-muted">
                        {trigger === 'SIN_RESPUESTA_HORAS' ? 'Horas sin respuesta' : 'Días sin respuesta'}
                      </label>
                      <input
                        type="number" min={1} value={triggerValue}
                        onChange={(e) => setTriggerValue(Number(e.target.value) || 1)}
                        className="h-10 w-full rounded-xl border border-line/15 bg-surface px-3 text-sm text-content focus:border-primary/50 focus:outline-none"
                      />
                    </div>
                  )}
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-medium text-muted">Acción</label>
                  <select
                    value={actionType}
                    onChange={(e) => setActionType(e.target.value)}
                    className="h-10 w-full rounded-xl border border-line/15 bg-surface px-3 text-sm text-content focus:border-primary/50 focus:outline-none"
                  >
                    {Object.entries(ACTION_LABEL).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                {actionType === 'ENVIAR_MENSAJE' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">Mensaje (usá {'{nombre}'})</label>
                    <textarea
                      rows={2}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="w-full rounded-xl border border-line/15 bg-surface p-3 text-sm text-content focus:border-primary/50 focus:outline-none"
                    />
                  </div>
                )}
                {actionType === 'CAMBIAR_ESTADO' && (
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted">Nuevo estado</label>
                    <select
                      value={stage}
                      onChange={(e) => setStage(e.target.value)}
                      className="h-10 w-full rounded-xl border border-line/15 bg-surface px-3 text-sm text-content focus:border-primary/50 focus:outline-none"
                    >
                      {STAGE_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                )}
                {error && <div className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{error}</div>}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button onClick={create}>Crear regla</Button>
                </div>
              </div>
            )}

            {rules.length === 0 ? (
              <div className="rounded-xl border border-dashed border-line/15 p-6 text-center text-[13px] text-muted">
                No hay automatizaciones todavía. Creá la primera para que el CRM actúe solo.
              </div>
            ) : (
              <div className="space-y-2.5">
                {rules.map((r) => (
                  <div key={r.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/10 bg-surface-2/40 p-3.5">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-content">{r.name}</span>
                        <Badge tone={r.isActive ? 'emerald' : 'muted'} dot>{r.isActive ? 'Activa' : 'Pausada'}</Badge>
                      </div>
                      <div className="mt-0.5 text-[11.5px] text-muted">
                        {TRIGGER_LABEL[r.trigger] ?? r.trigger} → {ACTION_LABEL[r.actionType] ?? r.actionType}
                        {r.lastRunAt && <> · corrió {r.runCount} vez{r.runCount === 1 ? '' : 'ces'}</>}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => toggle(r.id)}>
                        <Power className="h-3.5 w-3.5" /> {r.isActive ? 'Pausar' : 'Activar'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => remove(r.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
