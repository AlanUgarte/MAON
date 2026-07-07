'use client';

import { useRef, useState } from 'react';
import { Image as ImageIcon, Plus, Trash2, ChevronUp, ChevronDown, Upload, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadImage } from '@/lib/api';
import type { BannerImage } from '@/lib/tienda-settings-store';

const inputClass = 'h-10 w-full rounded-xl border border-line/15 bg-surface-2/60 px-3 text-sm text-content focus:border-primary/50 focus:outline-none';

/** Administra una lista de banners (carrusel principal o tarjetas chicas): agregar, subir
 * imagen, activar/desactivar, reordenar (con flechas — sin drag&drop para no sumar una
 * librería nueva solo por eso) y borrar. Compartido entre tienda-config y estufa-config. */
export function BannerManager({ items, onChange, noun }: { items: BannerImage[]; onChange: (next: BannerImage[]) => void; noun: string }) {
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({});
  const sorted = [...items].sort((a, b) => a.order - b.order);

  const addItem = () => {
    onChange([...items, { id: `b_${Date.now()}`, imageUrl: '', title: `${noun} ${items.length + 1}`, link: '', active: true, order: items.length }]);
  };
  const update = (id: string, patch: Partial<BannerImage>) => onChange(items.map((b) => (b.id === id ? { ...b, ...patch } : b)));
  const remove = (id: string) => onChange(items.filter((b) => b.id !== id));
  const move = (id: string, dir: -1 | 1) => {
    const idx = sorted.findIndex((b) => b.id === id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const a = sorted[idx], b2 = sorted[swapIdx];
    onChange(items.map((x) => (x.id === a.id ? { ...x, order: b2.order } : x.id === b2.id ? { ...x, order: a.order } : x)));
  };
  const handleFile = async (id: string, file: File) => {
    setUploadingId(id);
    try {
      const url = await uploadImage(file);
      update(id, { imageUrl: url });
    } catch (err: any) {
      alert(err.message || 'No se pudo subir la imagen');
    } finally {
      setUploadingId(null);
    }
  };

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="text-[12.5px] text-muted">{sorted.length} {noun.toLowerCase()}{sorted.length === 1 ? '' : 's'}</div>
        <Button size="sm" onClick={addItem}><Plus className="h-3.5 w-3.5" /> Agregar {noun.toLowerCase()}</Button>
      </div>
      {sorted.length === 0 && (
        <div className="rounded-xl border border-dashed border-line/15 p-6 text-center text-[13px] text-muted">
          Todavía no armaste ningún {noun.toLowerCase()}.
        </div>
      )}
      {sorted.map((b, i) => (
        <div key={b.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line/10 p-3">
          <div className="flex shrink-0 items-center gap-1 text-muted">
            <GripVertical className="h-4 w-4 opacity-40" />
            <div className="flex flex-col">
              <button disabled={i === 0} onClick={() => move(b.id, -1)} className="disabled:opacity-20"><ChevronUp className="h-3.5 w-3.5" /></button>
              <button disabled={i === sorted.length - 1} onClick={() => move(b.id, 1)} className="disabled:opacity-20"><ChevronDown className="h-3.5 w-3.5" /></button>
            </div>
          </div>
          <div className="flex h-16 w-24 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-line/10 bg-surface-2">
            {b.imageUrl ? <img src={b.imageUrl} alt="" className="h-full w-full object-cover" /> : <ImageIcon className="h-5 w-5 text-muted" />}
          </div>
          <div className="flex min-w-[180px] flex-1 flex-col gap-1.5">
            <input value={b.title ?? ''} onChange={(e) => update(b.id, { title: e.target.value })} placeholder="Título (uso interno)" className={inputClass} />
            <input value={b.link ?? ''} onChange={(e) => update(b.id, { link: e.target.value })} placeholder="Link (opcional, ej: /tienda?marca=...)" className={inputClass} />
          </div>
          <div className="flex shrink-0 flex-col items-stretch gap-1.5">
            <input
              ref={(el) => { fileInputs.current[b.id] = el; }}
              type="file" accept="image/*" className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(b.id, f); e.target.value = ''; }}
            />
            <Button size="sm" variant="outline" onClick={() => fileInputs.current[b.id]?.click()} disabled={uploadingId === b.id}>
              {uploadingId === b.id ? 'Subiendo...' : <><Upload className="h-3.5 w-3.5" /> Reemplazar imagen</>}
            </Button>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-[11px] text-muted">
                <input type="checkbox" checked={b.active} onChange={(e) => update(b.id, { active: e.target.checked })} /> Activo
              </label>
              <button onClick={() => remove(b.id)} className="text-rose"><Trash2 className="h-4 w-4" /></button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
