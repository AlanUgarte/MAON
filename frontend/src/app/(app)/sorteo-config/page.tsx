'use client';

import { useState } from 'react';
import {
  ClipboardList, Search, Trophy, Settings, ExternalLink, Check, X, Upload, Trash2, Ticket, Plus, Video,
  Copy, Download,
} from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { api, uploadImage, uploadLargeFile } from '@/lib/api';
import {
  useSorteoOrders, useSorteoPackages, useSorteoSettings,
  type SorteoOrder, type SorteoOrderStatus, type SorteoSettings,
} from '@/lib/sorteo-store';

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
const fmtDate = (d: string) => new Date(d).toLocaleString('es-AR');

const STATUS_LABEL: Record<SorteoOrderStatus, string> = {
  PENDIENTE: 'Pendiente de verificar', APROBADO: 'Aprobado', RECHAZADO: 'Rechazado',
};
const STATUS_TONE: Record<SorteoOrderStatus, 'amber' | 'emerald' | 'rose'> = {
  PENDIENTE: 'amber', APROBADO: 'emerald', RECHAZADO: 'rose',
};

const TABS = [
  { key: 'compras', label: 'Compras', icon: ClipboardList },
  { key: 'buscar', label: 'Buscar número', icon: Search },
  { key: 'ganadores', label: 'Ganadores', icon: Trophy },
  { key: 'config', label: 'Configuración', icon: Settings },
] as const;
type TabKey = (typeof TABS)[number]['key'];

export default function SorteoConfigPage() {
  const [tab, setTab] = useState<TabKey>('compras');
  const settings = useSorteoSettings();

  return (
    <>
      <Topbar title="Sorteo" subtitle="Rifa por números — compras, asignación de números y ganadores" />
      <main className="flex-1 space-y-5 p-5 lg:p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap rounded-[10px] border border-line/15 bg-surface-2 p-0.5">
            {TABS.map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold transition ${tab === t.key ? 'bg-primary text-white' : 'text-muted hover:text-content'}`}
                ><Icon className="h-3.5 w-3.5" /> {t.label}</button>
              );
            })}
          </div>
          <a href="/sorteo" target="_blank" rel="noopener noreferrer" className="flex h-9 items-center gap-1.5 rounded-[10px] border border-line/15 px-3 text-[13px] font-semibold text-muted hover:bg-surface-2 hover:text-content">
            <ExternalLink className="h-3.5 w-3.5" /> Ver la página del sorteo
          </a>
        </div>

        {tab === 'compras' && <ComprasTab />}
        {tab === 'buscar' && <BuscarTab />}
        {tab === 'ganadores' && <GanadoresTab />}
        {tab === 'config' && <ConfigTab settings={settings} />}
      </main>
    </>
  );
}

// ------------------------------ Compras ------------------------------

function ComprasTab() {
  const orders = useSorteoOrders();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const act = async (id: string, fn: (id: string) => Promise<void>) => {
    setBusy(id); setError(null);
    try { await fn(id); } catch (e: any) { setError(e?.message || 'No se pudo completar la acción'); }
    finally { setBusy(null); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(['PENDIENTE', 'APROBADO', 'RECHAZADO', ''] as const).map((s) => (
          <button
            key={s || 'todas'} onClick={() => orders.setStatus(s)}
            className={`rounded-[10px] px-3 py-1.5 text-[12.5px] font-semibold transition ${orders.status === s ? 'bg-primary text-white' : 'border border-line/15 text-muted hover:text-content'}`}
          >{s ? STATUS_LABEL[s] : 'Todas'}</button>
        ))}
        <div className="ml-auto w-full max-w-xs">
          <Input
            placeholder="Buscar por nombre, email, teléfono u orden…"
            value={orders.query}
            onChange={(e) => orders.setQuery(e.target.value)}
          />
        </div>
      </div>

      <p className="text-[12.5px] text-muted">
        Los números se asignan al azar <b>recién cuando aprobás</b> la compra. Verificá primero que la
        transferencia haya entrado.
      </p>

      {(error || orders.error) && (
        <div className="rounded-xl border border-rose/30 bg-rose/10 p-3 text-[13px] text-rose">{error || orders.error}</div>
      )}

      <div className="overflow-x-auto rounded-2xl border border-line/10 bg-surface">
        <table className="w-full text-[13px]">
          <thead>
            <tr className="border-b border-line/10 text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="p-3">Orden</th><th className="p-3">Comprador</th><th className="p-3">Contacto</th>
              <th className="p-3">Chances</th><th className="p-3">Monto</th><th className="p-3">Comprobante</th>
              <th className="p-3">Estado</th><th className="p-3">Números</th><th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {orders.orders.map((o) => (
              <tr key={o.id} className="border-b border-line/10 align-top hover:bg-surface-2">
                <td className="p-3 font-semibold">{o.orderNumber}<div className="text-[11px] font-normal text-muted">{fmtDate(o.createdAt)}</div></td>
                <td className="p-3">{o.buyerName}{o.holderName && <div className="text-[11px] text-muted">Transfirió: {o.holderName}</div>}</td>
                <td className="p-3 text-muted">{o.buyerEmail}<div>{o.buyerPhone}</div></td>
                <td className="p-3 font-bold">{o.chances}</td>
                <td className="p-3 font-bold">{money(o.amount)}</td>
                <td className="p-3">
                  {o.receiptUrl
                    ? <a href={o.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver</a>
                    : <span className="text-muted">—</span>}
                </td>
                <td className="p-3"><Badge tone={STATUS_TONE[o.status]}>{STATUS_LABEL[o.status]}</Badge></td>
                <td className="p-3">
                  {o.numbers.length
                    ? <span className="tnum text-[12px]">{o.numbers.map((n) => n.number).join(' · ')}</span>
                    : <span className="text-muted">—</span>}
                </td>
                <td className="p-3">
                  {o.status === 'PENDIENTE' && (
                    <div className="flex gap-1.5">
                      <Button size="sm" disabled={busy === o.id} onClick={() => act(o.id, orders.approve)}>
                        <Check className="h-3.5 w-3.5" /> Aprobar
                      </Button>
                      <Button size="sm" variant="danger" disabled={busy === o.id} onClick={() => act(o.id, orders.reject)}>
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  {o.status === 'APROBADO' && <ComprobanteButtons orderId={o.id} orderNumber={o.orderNumber} />}
                </td>
              </tr>
            ))}
            {!orders.loading && !orders.orders.length && (
              <tr><td colSpan={9} className="p-6 text-center text-muted">No hay compras acá todavía.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// --------------------------- Buscar número ---------------------------

function BuscarTab() {
  const [value, setValue] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async () => {
    const n = Number(value);
    if (!Number.isInteger(n) || n < 1) { setError('Escribí un número válido'); return; }
    setLoading(true); setError(null); setResult(null);
    try { setResult(await api.sorteoNumberOwner(n)); }
    catch (e: any) { setError(e?.message || 'No se pudo buscar el número'); }
    finally { setLoading(false); }
  };

  return (
    <div className="max-w-2xl space-y-4">
      <Card>
        <CardHeader><CardTitle>Buscar el número que salió en la quiniela</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder="Ej: 6120" value={value} inputMode="numeric"
              onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && search()}
            />
            <Button onClick={search} disabled={loading}><Search className="h-4 w-4" /> Buscar</Button>
          </div>
          {error && <p className="text-[13px] text-rose">{error}</p>}

          {result && !result.found && (
            <div className="rounded-xl border border-line/15 bg-surface-2 p-4 text-[13px] text-muted">
              El número <b className="text-content">{result.number}</b> no está vendido en el sorteo actual.
            </div>
          )}

          {result?.found && (
            <div className="space-y-2 rounded-xl border border-emerald/30 bg-emerald/10 p-4 text-[13px]">
              <div className="flex items-center gap-2">
                <Ticket className="h-4 w-4 text-emerald" />
                <span className="text-lg font-extrabold text-content">{result.number}</span>
                {result.isBlessed && <Badge tone="amber">Número bendecido</Badge>}
              </div>
              <Field label="Comprador" value={result.order.buyerName} />
              <Field label="Email" value={result.order.buyerEmail || '—'} />
              <Field label="WhatsApp" value={result.order.buyerPhone || '—'} />
              <Field label="Orden" value={`${result.order.orderNumber} · ${result.order.chances} chances · ${money(result.order.amount)}`} />
              <Field label="Comprada el" value={fmtDate(result.order.createdAt)} />
              <Field label="Aprobada por" value={result.order.approvedBy?.fullName || '—'} />
              {result.order.receiptUrl && (
                <a href={result.order.receiptUrl} target="_blank" rel="noopener noreferrer" className="inline-block text-primary underline">
                  Ver comprobante de transferencia
                </a>
              )}
              <div>
                <div className="text-[11px] uppercase tracking-wide text-muted">Todos sus números</div>
                <div className="tnum">{result.order.numbers.join(' · ')}</div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-wide text-muted">{label}</div>
      <div className="font-semibold text-content">{value}</div>
    </div>
  );
}

// ---------------------------- Ganadores ----------------------------

function GanadoresTab() {
  const [winners, setWinners] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', number: '', prize: '', photoUrl: '', note: '' });
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  if (!loaded) {
    setLoaded(true);
    api.sorteoPublic().then((r) => setWinners(r.winners ?? [])).catch(() => {});
  }

  const add = async () => {
    if (!form.name.trim()) { setError('Poné el nombre del ganador'); return; }
    setError(null);
    try {
      await api.createSorteoWinner({
        name: form.name.trim(),
        number: form.number ? Number(form.number) : undefined,
        prize: form.prize || undefined,
        photoUrl: form.photoUrl || undefined,
        note: form.note || undefined,
      });
      setForm({ name: '', number: '', prize: '', photoUrl: '', note: '' });
      const r = await api.sorteoPublic();
      setWinners(r.winners ?? []);
    } catch (e: any) { setError(e?.message || 'No se pudo guardar el ganador'); }
  };

  const remove = async (id: string) => {
    await api.deleteSorteoWinner(id);
    setWinners((prev) => prev.filter((w) => w.id !== id));
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>Cargar un ganador</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <Input placeholder="Nombre del ganador *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <div className="flex gap-2">
            <Input placeholder="Número" inputMode="numeric" value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value.replace(/\D/g, '') })} />
            <Input placeholder="Premio (ej: $50.000)" value={form.prize} onChange={(e) => setForm({ ...form, prize: e.target.value })} />
          </div>
          <Input placeholder="Nota (opcional)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <ImageField
            label="Foto del ganador"
            urls={form.photoUrl ? [form.photoUrl] : []}
            onChange={(urls) => setForm({ ...form, photoUrl: urls[0] ?? '' })}
            max={1}
          />
          {error && <p className="text-[13px] text-rose">{error}</p>}
          <Button onClick={add}><Plus className="h-4 w-4" /> Agregar ganador</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Ganadores publicados</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {winners.map((w) => (
            <div key={w.id} className="flex items-center gap-3 rounded-xl border border-line/10 bg-surface-2 p-2.5">
              {w.photoUrl && <img src={w.photoUrl} alt="" className="h-12 w-12 rounded-lg object-cover" />}
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13px] font-semibold text-content">{w.name}</div>
                <div className="text-[11.5px] text-muted">{[w.number ? `N° ${w.number}` : null, w.prize].filter(Boolean).join(' · ') || '—'}</div>
              </div>
              <Button variant="danger" size="icon" onClick={() => remove(w.id)} aria-label="Borrar"><Trash2 className="h-4 w-4" /></Button>
            </div>
          ))}
          {!winners.length && <p className="text-[13px] text-muted">Todavía no cargaste ganadores.</p>}
        </CardContent>
      </Card>
    </div>
  );
}

// --------------------------- Configuración ---------------------------

function ConfigTab({ settings }: { settings: ReturnType<typeof useSorteoSettings> }) {
  const s = settings.settings;
  const packages = useSorteoPackages();
  const set = (patch: Partial<SorteoSettings>) => settings.save({ ...s, ...patch });
  const [pkgError, setPkgError] = useState<string | null>(null);

  const savePackages = async (rows: { chances: number; price: number; isPopular?: boolean }[]) => {
    setPkgError(null);
    try { await packages.replace(rows); }
    catch (e: any) { setPkgError(e?.message || 'No se pudieron guardar los paquetes'); }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle>El sorteo</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <LabeledInput label="Titular de la portada" value={s.title} onChange={(v) => set({ title: v })} placeholder="COMPRÁ QUE SE VAN VOLANDO!" />
          <p className="text-[11.5px] text-muted">La última palabra se resalta en verde.</p>
          <LabeledInput label="Premio principal" value={s.prize} onChange={(v) => set({ prize: v })} />
          <p className="text-[11.5px] text-muted">Corto, aparece en los textos de la página. Ej: MOTO.</p>
          <div>
            <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted">Detalle del premio</label>
            <textarea
              value={s.prizeDetails}
              onChange={(e) => set({ prizeDetails: e.target.value })}
              rows={5}
              placeholder={`Honda Wave 110 0KM
Color negro
Patentamiento incluido
Entrega en Rosario`}
              className="w-full rounded-xl border border-line/15 bg-surface-2/60 px-3.5 py-2.5 text-sm text-content placeholder:text-muted/70 transition focus:border-primary/50 focus:bg-surface-2 focus:outline-none"
            />
            <p className="mt-1 text-[11.5px] text-muted">Una línea por dato. Se muestra en su propio apartado &quot;LA MOTO&quot;.</p>
          </div>
          <LabeledInput label="Cuándo se sortea" value={s.drawDate} onChange={(v) => set({ drawDate: v })} placeholder="5 de septiembre de 2026" />
          <LabeledInput label="Dónde se ve el ganador" value={s.drawWhere} onChange={(v) => set({ drawWhere: v })} placeholder="Quiniela de Buenos Aires — La Previa 10:15 hs" />
          <LabeledInput
            label="Cantidad total de números" value={String(s.totalNumbers)} inputMode="numeric"
            onChange={(v) => set({ totalNumbers: Number(v.replace(/\D/g, '')) || 1 })}
          />
          <p className="text-[11.5px] text-muted">Los números van del 1 al {s.totalNumbers.toLocaleString('es-AR')}.</p>

          <label className="flex items-center gap-2 text-[13px] text-content">
            <input type="checkbox" checked={s.isActive} onChange={(e) => set({ isActive: e.target.checked })} />
            Sorteo abierto (si lo destildás, la página deja de aceptar compras)
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Foto y video del premio</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ImageField label="Fotos de la moto (se ven abajo del video, se agrandan al tocarlas)" urls={s.images} onChange={(urls) => set({ images: urls })} max={6} />
          <VideoField url={s.videoUrl} onChange={(url) => set({ videoUrl: url })} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Marca y contacto</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <LabeledInput label="Nombre de la marca" value={s.brandName} onChange={(v) => set({ brandName: v })} placeholder="TREBOL MOTOS" />
          <p className="text-[11.5px] text-muted">La primera palabra se muestra en verde en el logo.</p>
          <LabeledInput label="Email de contacto" value={s.email} onChange={(v) => set({ email: v })} placeholder="info@trebolmotos.com.ar" />
          <LabeledInput label="Instagram (link)" value={s.instagramUrl} onChange={(v) => set({ instagramUrl: v })} placeholder="https://instagram.com/..." />
          <LabeledInput label="Facebook (link)" value={s.facebookUrl} onChange={(v) => set({ facebookUrl: v })} placeholder="https://facebook.com/..." />
          <LabeledInput label="TikTok (link)" value={s.tiktokUrl} onChange={(v) => set({ tiktokUrl: v })} placeholder="https://tiktok.com/@..." />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Cobro</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <LabeledInput label="Alias para transferir" value={s.paymentAlias} onChange={(v) => set({ paymentAlias: v })} />
          <LabeledInput label="Titular de la cuenta" value={s.paymentHolder} onChange={(v) => set({ paymentHolder: v })} />
          <LabeledInput label="WhatsApp de consultas" value={s.whatsappNumber} onChange={(v) => set({ whatsappNumber: v.replace(/\D/g, '') })} placeholder="5493413807110" />
          {settings.saveError && <p className="text-[13px] text-rose">{settings.saveError}</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Números bendecidos (premios secundarios)</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <LabeledInput
            label="Números separados por coma"
            value={s.blessedNumbers.join(', ')}
            placeholder="8899, 6868, 828, 777, 168"
            onChange={(v) => set({
              blessedNumbers: v.split(',').map((x) => Number(x.replace(/\D/g, ''))).filter((n) => n > 0),
            })}
          />
          <LabeledInput label="Qué gana" value={s.blessedPrize} onChange={(v) => set({ blessedPrize: v })} placeholder="$50.000" />
          <p className="text-[11.5px] text-muted">
            En la página se muestran tachados los que ya se vendieron.
          </p>
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Paquetes de chances</CardTitle></CardHeader>
        <CardContent>
          <PackagesEditor rows={packages.packages} onSave={savePackages} />
          {(pkgError || packages.error) && <p className="mt-2 text-[13px] text-rose">{pkgError || packages.error}</p>}
        </CardContent>
      </Card>

      <Card className="lg:col-span-2">
        <CardHeader><CardTitle>Sorteo N° {s.edition}</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-[13px] text-muted">
            Cuando este sorteo termine y quieras arrancar uno nuevo, esto libera todos los números para
            volver a venderlos desde cero. Las compras y los números del sorteo actual quedan guardados
            como historial.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              if (confirm(`¿Cerrar el sorteo N° ${s.edition} y arrancar el N° ${s.edition + 1}?\n\nTodos los números vuelven a estar libres.`)) {
                settings.nextEdition();
              }
            }}
          >Arrancar el sorteo N° {s.edition + 1}</Button>
        </CardContent>
      </Card>
    </div>
  );
}

function LabeledInput({
  label, value, onChange, placeholder, inputMode,
}: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; inputMode?: 'numeric' }) {
  return (
    <div>
      <label className="mb-1 block text-[11px] uppercase tracking-wide text-muted">{label}</label>
      <Input value={value} placeholder={placeholder} inputMode={inputMode} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/** Arranque sugerido cuando todavía no hay ningún paquete cargado — se muestra
 * precargado en el editor, pero no queda guardado hasta que el admin toca Guardar. */
const PAQUETES_SUGERIDOS = [
  { chances: '3', price: '5000', isPopular: false },
  { chances: '8', price: '10000', isPopular: true },
  { chances: '18', price: '20000', isPopular: false },
  { chances: '38', price: '40000', isPopular: false },
  { chances: '50', price: '50000', isPopular: false },
];

function PackagesEditor({
  rows, onSave,
}: { rows: { chances: number; price: number; isPopular: boolean }[]; onSave: (r: any[]) => Promise<void> }) {
  const [draft, setDraft] = useState<{ chances: string; price: string; isPopular: boolean }[] | null>(null);
  const saved = rows.map((r) => ({ chances: String(r.chances), price: String(r.price), isPopular: r.isPopular }));
  const sinCargar = !draft && !saved.length;
  const current = draft ?? (saved.length ? saved : PAQUETES_SUGERIDOS);

  const update = (i: number, patch: Partial<(typeof current)[number]>) =>
    setDraft(current.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  return (
    <div className="space-y-2">
      {sinCargar && (
        <p className="rounded-xl border border-amber/30 bg-amber/10 p-2.5 text-[12.5px] text-amber">
          Estos paquetes vienen sugeridos y <b>todavía no están guardados</b> — hasta que toques
          Guardar, la página del sorteo no muestra botones de compra. Cambiá lo que quieras antes.
        </p>
      )}
      {current.map((r, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <Input
            className="max-w-[130px]" placeholder="Chances" inputMode="numeric" value={r.chances}
            onChange={(e) => update(i, { chances: e.target.value.replace(/\D/g, '') })}
          />
          <Input
            className="max-w-[160px]" placeholder="Precio" inputMode="numeric" value={r.price}
            onChange={(e) => update(i, { price: e.target.value.replace(/\D/g, '') })}
          />
          <label className="flex items-center gap-1.5 text-[12.5px] text-muted">
            <input type="checkbox" checked={r.isPopular} onChange={(e) => update(i, { isPopular: e.target.checked })} />
            Más popular
          </label>
          <Button variant="danger" size="icon" aria-label="Quitar" onClick={() => setDraft(current.filter((_, j) => j !== i))}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
      <div className="flex gap-2 pt-1">
        <Button variant="outline" onClick={() => setDraft([...current, { chances: '', price: '', isPopular: false }])}>
          <Plus className="h-4 w-4" /> Agregar paquete
        </Button>
        <Button
          disabled={!draft && !sinCargar}
          onClick={async () => {
            await onSave(current
              .filter((r) => Number(r.chances) > 0 && Number(r.price) >= 0)
              .map((r) => ({ chances: Number(r.chances), price: Number(r.price), isPopular: r.isPopular })));
            setDraft(null);
          }}
        >Guardar paquetes</Button>
      </div>
    </div>
  );
}

/** Subida a Vercel Blob, mismo helper que usa la tienda para banners. */
function ImageField({
  label, urls, onChange, max,
}: { label: string; urls: string[]; onChange: (urls: string[]) => void; max: number }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setBusy(true); setError(null);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, max - urls.length)) {
        uploaded.push(await uploadImage(file));
      }
      onChange([...urls, ...uploaded]);
    } catch (e: any) { setError(e?.message || 'No se pudo subir la imagen'); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-2">
      {label && <label className="block text-[11px] uppercase tracking-wide text-muted">{label}</label>}
      <div className="flex flex-wrap gap-2">
        {urls.map((u, i) => (
          <div key={u + i} className="relative">
            <img src={u} alt="" className="h-20 w-20 rounded-lg object-cover" />
            <button
              onClick={() => onChange(urls.filter((_, j) => j !== i))}
              className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-rose text-white"
              aria-label="Quitar"
            ><X className="h-3 w-3" /></button>
          </div>
        ))}
        {urls.length < max && (
          <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line/30 text-[11px] text-muted hover:bg-surface-2">
            <Upload className="h-4 w-4" />
            {busy ? '...' : 'Subir'}
            <input type="file" accept="image/*" multiple={max > 1} className="hidden" onChange={(e) => pick(e.target.files)} />
          </label>
        )}
      </div>
      {error && <p className="text-[13px] text-rose">{error}</p>}
    </div>
  );
}

/** El video va directo del navegador a Vercel Blob: no pasa por la función
 * serverless, que tiene un tope de body de ~4.5MB. */
function VideoField({ url, onChange }: { url: string; onChange: (url: string) => void }) {
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setPct(0); setError(null);
    try {
      onChange(await uploadLargeFile(file, setPct));
    } catch (e: any) { setError(e?.message || 'No se pudo subir el video'); }
    finally { setPct(null); }
  };

  return (
    <div className="space-y-2">
      <label className="block text-[11px] uppercase tracking-wide text-muted">Video de la moto</label>
      {url ? (
        <div className="space-y-2">
          <video src={url} controls className="w-full max-w-[320px] rounded-lg" />
          <Button variant="danger" size="sm" onClick={() => onChange('')}>
            <Trash2 className="h-3.5 w-3.5" /> Quitar video
          </Button>
        </div>
      ) : (
        <label className="flex h-20 w-full max-w-[320px] cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-line/30 text-[12px] text-muted hover:bg-surface-2">
          <Video className="h-5 w-5" />
          {pct === null ? 'Subir video (mp4, hasta 200MB)' : `Subiendo… ${pct}%`}
          <input
            type="file" accept="video/mp4,video/quicktime,video/webm" className="hidden"
            onChange={(e) => pick(e.target.files?.[0])}
          />
        </label>
      )}
      {error && <p className="text-[13px] text-rose">{error}</p>}
    </div>
  );
}

/**
 * Comprobante en PNG de una compra aprobada. Lo genera la web en
 * /api/sorteo/comprobante/<id>; acá se copia al portapapeles para pegarlo directo en
 * WhatsApp, o se baja el archivo si el navegador no deja escribir imágenes.
 */
function ComprobanteButtons({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const url = `/api/sorteo/comprobante/${orderId}`;
  const [state, setState] = useState<'idle' | 'copiando' | 'copiado' | 'error'>('idle');

  const copiar = async () => {
    setState('copiando');
    try {
      // El fetch va adentro del ClipboardItem: Safari exige que la promesa se le pase
      // en el mismo gesto del click, no después de un await.
      const item = new ClipboardItem({
        'image/png': fetch(url).then((r) => {
          if (!r.ok) throw new Error('No se pudo generar el comprobante');
          return r.blob();
        }),
      });
      await navigator.clipboard.write([item]);
      setState('copiado');
      setTimeout(() => setState('idle'), 2500);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 4000);
    }
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      <div className="flex gap-1.5">
        <Button size="sm" variant="outline" onClick={copiar} disabled={state === 'copiando'}>
          {state === 'copiado' ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          {state === 'copiado' ? 'Copiado' : 'Copiar PNG'}
        </Button>
        <a
          href={url} download={`${orderNumber}.png`} target="_blank" rel="noopener noreferrer"
          className="inline-flex h-8 items-center gap-1.5 rounded-xl border border-line/15 px-3 text-xs text-content hover:bg-surface-2"
        ><Download className="h-3.5 w-3.5" /> Ver</a>
      </div>
      {state === 'error' && (
        <span className="text-[11px] text-rose">No se pudo copiar — usá &quot;Ver&quot; y guardá la imagen.</span>
      )}
    </div>
  );
}
