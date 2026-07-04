'use client';
import { useEffect, useMemo, useState } from 'react';
import { Users, Plus, Power, TrendingUp, Trash2 } from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { useComprobantesStore } from '@/lib/comprobantes-store';
import { useClients } from '@/lib/clients-store';
import { formatARS, initials } from '@/lib/utils';

interface Seller {
  id: string; email: string; fullName: string; role: string; isActive: boolean; createdAt: string;
}

const inp = 'h-10 w-full rounded-xl border border-line/15 bg-surface-2/60 px-3 text-sm text-content focus:border-primary/50 focus:outline-none';

export default function VendedoresPage() {
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { comprobantes } = useComprobantesStore();
  const { clients } = useClients();

  const [showForm, setShowForm] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'VENDEDOR' | 'SUPERVISOR'>('VENDEDOR');
  const [formError, setFormError] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    api.sellers()
      .then((res) => { setSellers(res.data ?? res); setError(''); })
      .catch(() => setError('Backend no disponible: conectá tu cuenta para gestionar vendedores.'))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  // Rendimiento por vendedor: se calcula del mismo libro de comprobantes que usa el Dashboard
  // (comprobantes.seller es el nombre del vendedor asignado al cliente al facturar).
  const stats = useMemo(() => {
    const byName = new Map<string, { facturado: number; ventas: number; lastAt: string | null; clientes: number }>();
    for (const s of sellers) byName.set(s.fullName, { facturado: 0, ventas: 0, lastAt: null, clientes: 0 });
    for (const c of comprobantes) {
      if (c.sign <= 0 || !c.seller || c.seller === '-') continue;
      const cur = byName.get(c.seller) ?? { facturado: 0, ventas: 0, lastAt: null, clientes: 0 };
      cur.facturado += c.total;
      cur.ventas += 1;
      if (!cur.lastAt || c.fecha > cur.lastAt) cur.lastAt = c.fecha;
      byName.set(c.seller, cur);
    }
    for (const s of sellers) {
      const cur = byName.get(s.fullName)!;
      cur.clientes = clients.filter((cl) => cl.seller === s.fullName).length;
    }
    return byName;
  }, [sellers, comprobantes, clients]);

  const resetForm = () => {
    setFullName(''); setEmail(''); setPassword(''); setRole('VENDEDOR'); setFormError(''); setShowForm(false);
  };

  const createSeller = async () => {
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setFormError('Completá nombre, email y una contraseña de al menos 6 caracteres');
      return;
    }
    setCreating(true);
    setFormError('');
    try {
      await api.createSeller(fullName.trim(), email.trim(), password, role);
      resetForm();
      load();
    } catch (err: any) {
      setFormError(err.message === 'Failed to fetch' ? 'Backend no disponible.' : err.message || 'No se pudo crear el vendedor.');
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (id: string) => {
    try { await api.toggleSeller(id); load(); } catch { /* backend caído: no se refleja */ }
  };

  const remove = async (id: string, name: string) => {
    if (!confirm(`¿Borrar a ${name}? Esta acción no se puede deshacer.`)) return;
    try {
      await api.deleteSeller(id);
      load();
    } catch (err: any) {
      alert(err.message || 'No se pudo borrar.');
    }
  };

  return (
    <>
      <Topbar title="Vendedores" subtitle="Alta de vendedores y su rendimiento" />
      <main className="flex-1 space-y-5 p-5 lg:p-7">
        {error && <div className="rounded-xl border border-line/10 bg-surface-2/60 px-4 py-2.5 text-[12.5px] text-muted">{error}</div>}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Equipo de ventas</CardTitle>
            <Button onClick={() => setShowForm((v) => !v)}><Plus className="h-4 w-4" /> Nuevo vendedor</Button>
          </CardHeader>
          <CardContent>
            {showForm && (
              <div className="mb-5 space-y-3 rounded-2xl border border-line/10 bg-surface-2/40 p-4">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input className={inp} placeholder="Nombre y apellido*" value={fullName} onChange={(e) => setFullName(e.target.value)} />
                  <input className={inp} placeholder="Email*" value={email} onChange={(e) => setEmail(e.target.value)} />
                  <input className={inp} placeholder="Contraseña* (mín. 6 caracteres)" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
                  <select className={inp} value={role} onChange={(e) => setRole(e.target.value as any)}>
                    <option value="VENDEDOR">Vendedor</option>
                    <option value="SUPERVISOR">Supervisor</option>
                  </select>
                </div>
                {formError && <div className="rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{formError}</div>}
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={resetForm}>Cancelar</Button>
                  <Button onClick={createSeller} disabled={creating}>{creating ? 'Creando…' : 'Crear vendedor'}</Button>
                </div>
              </div>
            )}

            {!loading && sellers.length === 0 && !error && (
              <div className="rounded-xl border border-dashed border-line/15 p-6 text-center text-[13px] text-muted">
                Todavía no diste de alta ningún vendedor.
              </div>
            )}

            <div className="space-y-2.5">
              {sellers.map((s) => {
                const st = stats.get(s.fullName);
                return (
                  <div key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line/10 bg-surface-2/40 p-3.5">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-sky/80 text-[11px] font-bold text-white">
                        {initials(s.fullName)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-content">{s.fullName}</span>
                          <Badge tone={s.isActive ? 'emerald' : 'muted'} dot>{s.isActive ? 'Activo' : 'Dado de baja'}</Badge>
                          <Badge tone="sky">{s.role === 'SUPERVISOR' ? 'Supervisor' : 'Vendedor'}</Badge>
                        </div>
                        <div className="truncate text-[11.5px] text-muted">{s.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="flex items-center gap-1 text-[11px] text-muted"><TrendingUp className="h-3 w-3" /> Facturado</div>
                        <div className="font-display text-sm font-bold tnum text-content">{formatARS(st?.facturado ?? 0)}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-muted">Ventas</div>
                        <div className="font-display text-sm font-bold tnum text-content">{st?.ventas ?? 0}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-[11px] text-muted">Clientes</div>
                        <div className="font-display text-sm font-bold tnum text-content">{st?.clientes ?? 0}</div>
                      </div>
                      {!st?.ventas && (
                        <Badge tone="rose">Sin ventas todavía</Badge>
                      )}
                      <Button variant="outline" size="sm" onClick={() => toggle(s.id)}>
                        <Power className="h-3.5 w-3.5" /> {s.isActive ? 'Dar de baja' : 'Reactivar'}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => remove(s.id, s.fullName)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
