'use client';
import { useState } from 'react';
import { Search, Download, LayoutGrid, List, Plus, X, Pencil, Trash2, StickyNote } from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScoreBar } from '@/components/app/score-gauge';
import { StatusBadge } from '@/components/app/status-badge';
import { PIPELINE, STAGE_LABEL, IVA_CONDITION_LABEL, type Stage, type IvaCondition } from '@/lib/mock';
import { useClients } from '@/lib/clients-store';
import { api, getUser } from '@/lib/api';
import { cn, initials, timeAgo } from '@/lib/utils';

const STAGES: Stage[] = ['NUEVO_LEAD', 'CONTACTADO', 'INTERESADO', 'NEGOCIANDO', 'ESPERANDO_RESPUESTA', 'VENTA_CERRADA', 'VENTA_PERDIDA'];

const emptyForm = {
  firstName: '', lastName: '', phone: '', businessName: '', cuit: '',
  ivaCondition: 'CONSUMIDOR_FINAL' as IvaCondition, address: '', city: '', province: '',
  postalCode: '', clientCode: '', condicionVenta: 'Contado',
};

export default function ClientesPage() {
  const { clients: allClients, addClient, updateClient, deleteClient } = useClients();
  const user = getUser();
  const isVendedor = user?.role === 'VENDEDOR';
  // Un vendedor solo ve (y factura, según Dashboard) los clientes asignados a él.
  const CLIENTS = isVendedor ? allClients.filter((c) => c.seller === user!.fullName) : allClients;
  const [view, setView] = useState<'tabla' | 'kanban'>('tabla');
  const [filter, setFilter] = useState<Stage | 'TODOS'>('TODOS');
  const [search, setSearch] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [notesFor, setNotesFor] = useState<{ id: string; name: string } | null>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [notesLoading, setNotesLoading] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [noteDraft, setNoteDraft] = useState('');

  const q = search.trim().toLowerCase();
  const searched = q
    ? CLIENTS.filter((c) => [c.firstName, c.lastName, c.phone, c.businessName, c.cuit].some((v) => v?.toLowerCase().includes(q)))
    : CLIENTS;
  const rows = filter === 'TODOS' ? searched : searched.filter((c) => c.stage === filter);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const openNew = () => { setEditingId(null); setForm(emptyForm); setFormError(''); setShowNew(true); };
  const openEdit = (c: (typeof CLIENTS)[number]) => {
    setEditingId(c.id);
    setForm({
      firstName: c.firstName, lastName: c.lastName ?? '', phone: c.phone, businessName: c.businessName ?? '',
      cuit: c.cuit ?? '', ivaCondition: c.ivaCondition, address: c.address ?? '', city: c.city ?? '',
      province: c.province ?? '', postalCode: c.postalCode ?? '', clientCode: c.clientCode ?? '',
      condicionVenta: c.condicionVenta ?? 'Contado',
    });
    setFormError('');
    setShowNew(true);
  };

  const submitNew = () => {
    if (!form.firstName || !form.phone) return setFormError('Nombre y teléfono son obligatorios');
    setFormError('');
    if (editingId) {
      updateClient(editingId, form);
    } else {
      addClient({
        ...form,
        stage: 'NUEVO_LEAD', product: '', source: 'WHATSAPP', leadScore: 0,
        intent: 'BAJA', sentiment: 'NEUTRO', tags: [], lastInboundAt: new Date().toISOString(),
        unread: 0, summary: '', objection: 'NINGUNA', seller: user?.fullName || '-',
      });
    }
    setForm(emptyForm);
    setEditingId(null);
    setShowNew(false);
  };

  const removeClient = (id: string) => {
    if (confirm('¿Eliminar este cliente? Esta acción no se puede deshacer.')) deleteClient(id);
  };

  const openNotes = async (c: (typeof CLIENTS)[number]) => {
    setNotesFor({ id: c.id, name: `${c.firstName} ${c.lastName}` });
    setNotes([]);
    setNoteDraft('');
    setNotesError('');
    setNotesLoading(true);
    try {
      const full = await api.client(c.id);
      setNotes(full.notes ?? []);
    } catch (err: any) {
      setNotesError(err.message === 'Failed to fetch' ? 'Backend no disponible: conectá tu cuenta para ver notas reales.' : 'No se pudieron cargar las notas.');
    } finally {
      setNotesLoading(false);
    }
  };

  const addNote = async () => {
    if (!notesFor || !noteDraft.trim()) return;
    try {
      await api.addNote(notesFor.id, noteDraft.trim());
      setNoteDraft('');
      const full = await api.client(notesFor.id);
      setNotes(full.notes ?? []);
    } catch (err: any) {
      setNotesError(err.message === 'Failed to fetch' ? 'Backend no disponible.' : 'No se pudo guardar la nota.');
    }
  };

  // Exporta la vista actual (búsqueda + filtro de etapa aplicados) como CSV abrible en Excel:
  // separador ";" y BOM UTF-8, que es lo que espera el Excel configurado en español.
  const exportCsv = () => {
    const cell = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const header = ['Nombre', 'Apellido', 'Teléfono', 'Razón social', 'CUIT', 'Cond. IVA', 'Dirección', 'Ciudad', 'Provincia', 'CP', 'Código', 'Cond. venta', 'Etapa', 'Vendedor', 'Score'];
    const lines = rows.map((c) => [
      c.firstName, c.lastName, c.phone, c.businessName, c.cuit,
      IVA_CONDITION_LABEL[c.ivaCondition] ?? c.ivaCondition, c.address, c.city, c.province,
      c.postalCode, c.clientCode, c.condicionVenta, STAGE_LABEL[c.stage] ?? c.stage, c.seller, c.leadScore,
    ].map(cell).join(';'));
    const blob = new Blob(['\ufeff' + [header.map(cell).join(';'), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const inp = 'h-9 w-full rounded-lg border border-line/15 bg-surface-2/60 px-3 text-sm text-content placeholder:text-muted/70 focus:border-primary/50 focus:outline-none';

  return (
    <>
      <Topbar title="Clientes" subtitle={`${CLIENTS.length} contactos en tu cartera`} />
      <main className="flex-1 space-y-4 p-5 lg:p-7">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              placeholder="Buscar por nombre, teléfono, razón social o CUIT…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-9 w-full rounded-xl border border-line/15 bg-surface-2/60 pl-9 pr-3 text-sm text-content placeholder:text-muted/70 focus:border-primary/50 focus:outline-none"
            />
          </div>
          <Button variant="outline" size="md" onClick={exportCsv} disabled={rows.length === 0}><Download className="h-4 w-4" /> Exportar</Button>
          <div className="flex items-center rounded-xl border border-line/15 bg-surface-2/40 p-0.5">
            <button onClick={() => setView('tabla')} className={cn('flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition', view === 'tabla' ? 'bg-primary/15 text-primary' : 'text-muted')}><List className="h-4 w-4" /> Tabla</button>
            <button onClick={() => setView('kanban')} className={cn('flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium transition', view === 'kanban' ? 'bg-primary/15 text-primary' : 'text-muted')}><LayoutGrid className="h-4 w-4" /> Kanban</button>
          </div>
          <Button onClick={openNew}><Plus className="h-4 w-4" /> Nuevo</Button>
        </div>

        {showNew && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowNew(false)}>
            <div className="card w-full max-w-lg space-y-3 p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold text-content">{editingId ? 'Editar cliente' : 'Nuevo cliente'}</div>
                <button onClick={() => setShowNew(false)}><X className="h-4 w-4 text-muted" /></button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input className={inp} placeholder="Nombre*" value={form.firstName} onChange={set('firstName')} />
                <input className={inp} placeholder="Apellido" value={form.lastName} onChange={set('lastName')} />
                <input className={inp} placeholder="Teléfono*" value={form.phone} onChange={set('phone')} />
                <input className={inp} placeholder="Código cliente" value={form.clientCode} onChange={set('clientCode')} />
                <input className={cn(inp, 'col-span-2')} placeholder="Razón social (si difiere del nombre)" value={form.businessName} onChange={set('businessName')} />
                <input className={inp} placeholder="CUIT" value={form.cuit} onChange={set('cuit')} />
                <select className={inp} value={form.ivaCondition} onChange={set('ivaCondition')}>
                  {(Object.keys(IVA_CONDITION_LABEL) as IvaCondition[]).map((k) => <option key={k} value={k}>{IVA_CONDITION_LABEL[k]}</option>)}
                </select>
                <input className={cn(inp, 'col-span-2')} placeholder="Dirección" value={form.address} onChange={set('address')} />
                <input className={inp} placeholder="Localidad" value={form.city} onChange={set('city')} />
                <input className={inp} placeholder="Provincia" value={form.province} onChange={set('province')} />
                <input className={inp} placeholder="Código postal" value={form.postalCode} onChange={set('postalCode')} />
                <input className={inp} placeholder="Condición de venta" value={form.condicionVenta} onChange={set('condicionVenta')} />
              </div>
              {formError && <div className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{formError}</div>}
              <Button className="w-full" onClick={submitNew}>{editingId ? 'Guardar cambios' : 'Guardar cliente'}</Button>
            </div>
          </div>
        )}

        {notesFor && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setNotesFor(null)}>
            <div className="card w-full max-w-md space-y-3 p-5" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between">
                <div className="text-base font-semibold text-content">Notas · {notesFor.name}</div>
                <button onClick={() => setNotesFor(null)}><X className="h-4 w-4 text-muted" /></button>
              </div>
              <div className="max-h-[280px] space-y-2 overflow-y-auto">
                {notesLoading && <div className="text-center text-[12px] text-muted">Cargando…</div>}
                {!notesLoading && notes.length === 0 && !notesError && (
                  <div className="rounded-xl border border-dashed border-line/15 p-4 text-center text-[12px] text-muted">Sin notas todavía.</div>
                )}
                {notes.map((n) => (
                  <div key={n.id} className="rounded-xl border border-line/10 bg-surface-2/40 p-3">
                    <p className="text-[13px] text-content">{n.content}</p>
                    <div className="mt-1 text-[11px] text-muted">{n.author?.fullName ?? '—'} · {new Date(n.createdAt).toLocaleString('es-AR')}</div>
                  </div>
                ))}
              </div>
              {notesError && <div className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{notesError}</div>}
              <div className="flex gap-2">
                <input
                  className={inp}
                  placeholder="Agregar una nota…"
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addNote()}
                />
                <Button onClick={addNote} disabled={!noteDraft.trim()}>Agregar</Button>
              </div>
            </div>
          </div>
        )}

        {/* Chips de etapa */}
        <div className="flex flex-wrap gap-1.5">
          <button onClick={() => setFilter('TODOS')} className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition', filter === 'TODOS' ? 'bg-primary text-white' : 'bg-surface-2/60 text-muted hover:text-content')}>Todos</button>
          {STAGES.map((s) => (
            <button key={s} onClick={() => setFilter(s)} className={cn('rounded-full px-3 py-1.5 text-xs font-medium transition', filter === s ? 'bg-primary text-white' : 'bg-surface-2/60 text-muted hover:text-content')}>{STAGE_LABEL[s]}</button>
          ))}
        </div>

        {view === 'tabla' ? (
          <div className="card overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line/10 text-left text-[11px] uppercase tracking-wide text-muted">
                    <th className="px-4 py-3 font-medium">Cliente</th>
                    <th className="px-4 py-3 font-medium">Producto</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Lead score</th>
                    <th className="px-4 py-3 font-medium">Origen</th>
                    <th className="px-4 py-3 font-medium">Vendedor</th>
                    <th className="px-4 py-3 font-medium">Últ. mensaje</th>
                    <th className="px-4 py-3 font-medium"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((c) => (
                    <tr key={c.id} className="border-b border-line/5 transition hover:bg-surface-2/40">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-sky/80 text-[11px] font-bold text-white">{initials(`${c.firstName} ${c.lastName}`)}</div>
                          <div className="min-w-0">
                            <div className="font-medium text-content">{c.firstName} {c.lastName}</div>
                            <div className="text-[11px] text-muted">{c.city}, {c.province}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="text-muted">{c.product}</span></td>
                      <td className="px-4 py-3"><StatusBadge stage={c.stage} /></td>
                      <td className="px-4 py-3"><ScoreBar value={c.leadScore} /></td>
                      <td className="px-4 py-3"><Badge tone={c.source === 'META_ADS' ? 'primary' : 'emerald'}>{c.source === 'META_ADS' ? 'Meta Ads' : 'WhatsApp'}</Badge></td>
                      <td className="px-4 py-3"><span className="text-muted">{c.seller.split(' ')[0]}</span></td>
                      <td className="px-4 py-3"><span className="text-[12px] text-muted">{timeAgo(c.lastInboundAt)}</span></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openNotes(c)} aria-label="Notas" className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-content"><StickyNote className="h-4 w-4" /></button>
                          <button onClick={() => openEdit(c)} aria-label="Editar" className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-content"><Pencil className="h-4 w-4" /></button>
                          <button onClick={() => removeClient(c.id)} aria-label="Eliminar" className="rounded-lg p-1.5 text-muted hover:bg-rose/15 hover:text-rose"><Trash2 className="h-4 w-4" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2">
            {STAGES.map((s) => {
              const items = searched.filter((c) => c.stage === s);
              const count = q ? items.length : PIPELINE.find((p) => p.stage === s)?.count ?? items.length;
              return (
                <div key={s} className="w-[260px] shrink-0">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <span className="text-[13px] font-semibold text-content">{STAGE_LABEL[s]}</span>
                    <Badge tone="muted">{count}</Badge>
                  </div>
                  <div className="space-y-2">
                    {items.length === 0 && <div className="rounded-xl border border-dashed border-line/15 p-4 text-center text-[11px] text-muted">Sin clientes</div>}
                    {items.map((c) => (
                      <div key={c.id} className="card cursor-grab space-y-2 p-3 shadow-card transition hover:border-primary/25">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-sky/80 text-[10px] font-bold text-white">{initials(`${c.firstName} ${c.lastName}`)}</div>
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13px] font-medium text-content">{c.firstName} {c.lastName}</div>
                            <div className="truncate text-[11px] text-muted">{c.product}</div>
                          </div>
                        </div>
                        <ScoreBar value={c.leadScore} />
                        <div className="flex items-center justify-between">
                          {c.tags.map((t) => <Badge key={t.name} tone={t.color as any}>{t.name}</Badge>)}
                          <span className="text-[10px] text-muted">{timeAgo(c.lastInboundAt)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </>
  );
}
