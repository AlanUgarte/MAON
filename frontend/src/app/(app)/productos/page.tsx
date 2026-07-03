'use client';
import { useEffect, useMemo, useState } from 'react';
import { Search, Plus, Upload, Sparkles, LayoutGrid, List, X, Copy, ExternalLink, Download, Pencil, Trash2 } from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { PRODUCT_ROWS } from '@/lib/mock';
import { useProductCatalog } from '@/lib/product-catalog-store';
import { useTiendaSettings } from '@/lib/tienda-settings-store';
import { api } from '@/lib/api';

const CATICON: Record<string, string> = {
  Galletitas: '🍪', Golosinas: '🍬', Alfajores: '🍫', Kiosco: '🛒',
  Alimentos: '🥫', Bebidas: '🥤', Chocolates: '🍫', 'Cotillón': '🎉', 'Desayuno y Merienda': '☕', Harinas: '🌾',
};
const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');
const moneyD = (n: number) => '$' + n.toLocaleString('es-AR', { maximumFractionDigits: 2 });

type Prod = (typeof PRODUCT_ROWS)[number] & { margin: number | null };

function ProdImg({ src, cat, size }: { src: string; cat: string; size: number }) {
  const [err, setErr] = useState(false);
  if (!src || err)
    return (
      <div className="flex shrink-0 items-center justify-center rounded-xl bg-surface-2" style={{ width: size, height: size, fontSize: size / 2 }}>
        {CATICON[cat] || '📦'}
      </div>
    );
  return <img src={src} loading="lazy" decoding="async" onError={() => setErr(true)} alt="" className="shrink-0 rounded-xl border border-line/15 object-cover" style={{ width: size, height: size }} />;
}

function fromBackendProduct(bp: any): Prod {
  return {
    id: bp.id, name: bp.name, sku: bp.sku, category: bp.category ?? '', brand: bp.brand ?? '-',
    units: bp.unitsPerBulk ?? 0, img: bp.images?.[0] ?? '', price: Number(bp.price), stock: bp.stock ?? 0,
    active: bp.isActive ?? true, margin: bp.marginPct ?? null,
  };
}

export default function ProductosPage() {
  const { products: fullCatalog } = useProductCatalog();
  const { settings } = useTiendaSettings();
  const [items, setItems] = useState<Prod[]>(() => PRODUCT_ROWS.map((p) => ({ ...p, margin: null })));
  const [productSource, setProductSource] = useState<'backend' | 'local'>('local');

  useEffect(() => {
    if (productSource === 'backend') return;
    setItems(fullCatalog.map((p) => ({ ...p, margin: null })));
  }, [fullCatalog, productSource]);
  const [view, setView] = useState<'cards' | 'list'>('cards');
  const [brand, setBrand] = useState('');
  const [cat, setCat] = useState('');
  const [sort, setSort] = useState('rank');
  const [q, setQ] = useState('');
  const [gPct, setGPct] = useState(Math.round(settings.margenVenta * 100));
  // El margen por defecto acá tiene que ser el mismo que el de venta pública (Tienda → General).
  useEffect(() => setGPct(Math.round(settings.margenVenta * 100)), [settings.margenVenta]);
  const [showImport, setShowImport] = useState(false);
  const [showGpt, setShowGpt] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [importText, setImportText] = useState('');
  const emptyNew = { name: '', brand: '', category: 'Galletitas', price: '', margin: '', units: '', img: '' };
  const [newProd, setNewProd] = useState(emptyNew);
  const [newError, setNewError] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.products()
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data ?? res).map(fromBackendProduct);
        if (rows.length) { setItems(rows); setProductSource('backend'); }
      })
      .catch(() => {}); // sin backend disponible: se queda con el catálogo mock de siempre
    return () => { cancelled = true; };
  }, []);

  const brands = useMemo(() => [...new Set(items.map((p) => p.brand))].sort(), [items]);
  const cats = useMemo(() => [...new Set(items.map((p) => p.category))].sort(), [items]);

  const effMargin = (p: Prod) => (p.margin === null ? gPct : p.margin);
  const punit = (p: Prod) => (p.units ? p.price / p.units : 0);
  const ventaB = (p: Prod) => Math.round(p.price * (1 + effMargin(p) / 100));
  const ventaU = (p: Prod) => (p.units ? Math.round(ventaB(p) / p.units) : 0);

  const filtered = useMemo(() => {
    let r = items.filter(
      (p) =>
        (!brand || p.brand === brand) &&
        (!cat || p.category === cat) &&
        (p.name.toLowerCase().includes(q.toLowerCase()) || p.brand.toLowerCase().includes(q.toLowerCase())),
    );
    if (sort === 'price_desc') r = [...r].sort((a, b) => b.price - a.price);
    else if (sort === 'price_asc') r = [...r].sort((a, b) => a.price - b.price);
    else if (sort === 'name') r = [...r].sort((a, b) => a.name.localeCompare(b.name));
    return r;
  }, [items, brand, cat, sort, q]);

  // ponytail: con el catálogo completo (7000+) sin filtro, evita pintar todo el DOM de una — pedimos buscar/filtrar.
  const RENDER_CAP = 150;
  const visible = q || brand || cat ? filtered : filtered.slice(0, RENDER_CAP);
  const truncated = filtered.length > visible.length;

  const avg = items.length ? Math.round(items.reduce((a, p) => a + p.price, 0) / items.length) : 0;

  const setMargin = (id: string, v: string) =>
    setItems((arr) => arr.map((p) => (p.id === id ? { ...p, margin: v === '' ? null : Math.max(0, parseFloat(v) || 0) } : p)));
  const setPrice = (id: string, v: string) =>
    setItems((arr) => arr.map((p) => (p.id === id ? { ...p, price: Math.max(0, parseFloat(v) || 0) } : p)));
  const applyMargin = (scope: 'all' | 'brand' | 'cat') =>
    setItems((arr) =>
      arr.map((p) => {
        if (scope === 'all') return { ...p, margin: gPct };
        if (scope === 'brand' && brand && p.brand === brand) return { ...p, margin: gPct };
        if (scope === 'cat' && cat && p.category === cat) return { ...p, margin: gPct };
        return p;
      }),
    );

  const doImport = () => {
    const rows = importText.split('\n').map((l) => l.trim()).filter(Boolean);
    const add: Prod[] = [];
    rows.forEach((l, k) => {
      const c = l.split(',').map((x) => x.trim());
      if (c.length < 4 || !c[0]) return;
      add.push({
        id: 'imp' + Date.now() + k, name: c[0], brand: c[1] || '-', category: c[2] || 'Galletitas',
        price: Number(c[3]) || 0, units: Number(c[4]) || 0, img: c[5] || '', sku: 'IMP' + k, stock: 0, active: true, margin: null,
      });
    });
    setItems((arr) => [...add, ...arr]);
    setImportText(''); setShowImport(false);
  };

  const openNew = () => { setEditingId(null); setNewProd(emptyNew); setNewError(''); setShowNew(true); };
  const openEdit = (p: Prod) => {
    setEditingId(p.id);
    setNewProd({
      name: p.name, brand: p.brand, category: p.category ?? 'Galletitas',
      price: String(p.price), margin: p.margin === null ? '' : String(p.margin), units: String(p.units || ''), img: p.img,
    });
    setNewError('');
    setShowNew(true);
  };

  const submitNewProd = async () => {
    if (!newProd.name.trim() || !Number(newProd.price)) return setNewError('Nombre y precio son obligatorios');
    setNewError('');
    const margin = newProd.margin === '' ? null : Number(newProd.margin) || 0;

    if (editingId) {
      if (productSource === 'backend' && !editingId.startsWith('new') && !editingId.startsWith('imp')) {
        try {
          const updated = await api.updateProduct(editingId, {
            name: newProd.name.trim(), category: newProd.category, brand: newProd.brand.trim() || undefined,
            unitsPerBulk: Number(newProd.units) || undefined, marginPct: margin ?? undefined,
            price: Number(newProd.price) || 0, images: newProd.img.trim() ? [newProd.img.trim()] : [],
          });
          setItems((arr) => arr.map((p) => (p.id === editingId ? fromBackendProduct(updated) : p)));
          setEditingId(null); setNewProd(emptyNew); setShowNew(false);
          return;
        } catch { /* si falla el PATCH, se aplica igual el cambio localmente abajo */ }
      }
      setItems((arr) => arr.map((p) => (p.id === editingId ? {
        ...p, name: newProd.name.trim(), brand: newProd.brand.trim() || '-', category: newProd.category,
        price: Number(newProd.price) || 0, units: Number(newProd.units) || 0, img: newProd.img.trim(), margin,
      } : p)));
      setEditingId(null); setNewProd(emptyNew); setShowNew(false);
      return;
    }

    if (productSource === 'backend') {
      try {
        const created = await api.createProduct({
          name: newProd.name.trim(), sku: 'NEW' + Date.now(), category: newProd.category,
          brand: newProd.brand.trim() || undefined, unitsPerBulk: Number(newProd.units) || undefined,
          marginPct: margin ?? undefined, price: Number(newProd.price) || 0,
          images: newProd.img.trim() ? [newProd.img.trim()] : [],
        });
        setItems((arr) => [fromBackendProduct(created), ...arr]);
        setNewProd(emptyNew);
        setShowNew(false);
        return;
      } catch {
        // si falla el POST, lo cargamos igual localmente para no perder lo tipeado
      }
    }
    setItems((arr) => [{
      id: 'new' + Date.now(), name: newProd.name.trim(), brand: newProd.brand.trim() || '-',
      category: newProd.category, price: Number(newProd.price) || 0, units: Number(newProd.units) || 0,
      img: newProd.img.trim(), sku: 'NEW' + Date.now(), stock: 0, active: true, margin,
    }, ...arr]);
    setNewProd(emptyNew);
    setShowNew(false);
  };

  const removeProduct = async (p: Prod) => {
    if (!confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)) return;
    if (productSource === 'backend' && !p.id.startsWith('new') && !p.id.startsWith('imp')) {
      try { await api.deleteProduct(p.id); } catch { /* si falla el DELETE, lo sacamos igual de la vista */ }
    }
    setItems((arr) => arr.filter((x) => x.id !== p.id));
  };

  const buildPrompt = () => {
    const head = [
      'Actua como disenador grafico experto en catalogos comerciales. Genera un CATALOGO MAYORISTA en formato PDF, profesional y listo para imprimir y compartir con clientes, para mi distribuidora COMPVEN (venta por bultos cerrados, rubro golosinas, galletitas y alfajores).',
      '', 'DISENO:',
      '- Portada con el titulo COMPVEN, subtitulo "Catalogo mayorista", la fecha e indice por marca.',
      '- Agrupa los productos por MARCA con un encabezado por marca.',
      '- Por cada articulo: nombre/descripcion, presentacion (bulto x N u.), PRECIO POR BULTO y PRECIO POR UNIDAD bien visibles, y precio de venta si lo paso.',
      '- Si paso URL de imagen, insertala al lado; si no, deja un recuadro gris.',
      '- Estilo limpio, paleta verde oliva, tarjetas o tabla por producto.',
      '- Ultima pagina: contacto y como pedir por WhatsApp. Entregalo como PDF descargable.',
      '', 'PRODUCTOS:',
    ].join('\n');
    const lines = filtered
      .map((p) => {
        const u = p.units ? Math.round(punit(p)) : '';
        const v = effMargin(p) > 0 ? ` | Venta: $${ventaB(p).toLocaleString('es-AR')}` : '';
        const im = p.img ? ` | Imagen: ${p.img}` : '';
        return `- ${p.name} | ${p.brand} | Bulto x ${p.units || '?'} u. | Bulto: $${p.price.toLocaleString('es-AR')}${u ? ` | Unidad: $${u.toLocaleString('es-AR')}` : ''}${v}${im}`;
      })
      .join('\n');
    return head + '\n' + lines;
  };

  const downloadCatalog = () => {
    const it = filtered;
    if (!it.length) return;
    const byB: Record<string, Prod[]> = {};
    it.forEach((p) => { (byB[p.brand] = byB[p.brand] || []).push(p); });
    const card = (p: Prod) => {
      const vb = effMargin(p) > 0 ? money(ventaB(p)) : money(p.price);
      const vu = effMargin(p) > 0 ? (p.units ? money(ventaU(p)) : '-') : (p.units ? moneyD(Math.round(punit(p))) : '-');
      const im = p.img
        ? `<img src="${p.img}" style="width:78px;height:78px;border-radius:8px;object-fit:cover;flex-shrink:0">`
        : `<div style="width:78px;height:78px;border-radius:8px;background:#F6F8EC;display:flex;align-items:center;justify-content:center;font-size:32px;flex-shrink:0">${CATICON[p.category] || '📦'}</div>`;
      return `<div style="border:1px solid #E7E9D6;border-radius:12px;padding:12px;display:flex;gap:12px;break-inside:avoid">${im}<div style="flex:1"><div style="font-weight:700;font-size:14px;color:#262B20">${p.name}</div><div style="font-size:11px;color:#7E836D;margin:2px 0 8px">${p.brand} · Bulto x ${p.units || '-'} u.</div><div style="font-size:18px;font-weight:800;color:#56682B">${vb}</div><div style="font-size:11px;color:#7E836D">por bulto · unidad ${vu}</div></div></div>`;
    };
    const body = Object.keys(byB).sort()
      .map((b) => `<h2 style="color:#56682B;font-size:18px;margin:22px 0 10px;border-bottom:2px solid #D9E88A;padding-bottom:6px">${b}</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">${byB[b].map(card).join('')}</div>`)
      .join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Catálogo COMPVEN</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:32px;color:#262B20}@media print{.np{display:none}}</style></head><body><div style="display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #56682B;padding-bottom:14px"><div><h1 style="color:#56682B;margin:0">COMPVEN · Catálogo mayorista</h1><div style="color:#7E836D;font-size:13px;margin-top:4px">${it.length} artículos · ${new Date().toLocaleDateString('es-AR')}</div></div><button class="np" onclick="window.print()" style="background:#56682B;color:#fff;border:none;border-radius:10px;padding:10px 18px;font-weight:600;cursor:pointer">Imprimir / Guardar PDF</button></div>${body}<div style="margin-top:28px;text-align:center;color:#7E836D;font-size:12px">Pedidos por WhatsApp · COMPVEN</div></body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
  };

  const stats = [
    ['Productos', String(items.length)],
    ['Marcas', String(brands.length)],
    ['Categorías', String(cats.length)],
    ['Precio prom. bulto', money(avg)],
  ];
  const sel = 'h-[38px] rounded-[10px] border border-line/15 bg-surface px-2.5 text-[13px] font-semibold text-content';

  return (
    <>
      <Topbar title="Productos" subtitle={`${items.length} productos · ${brands.length} marcas`} />
      <main className="flex-1 space-y-4 p-5 lg:p-7">
        <div className="flex flex-wrap items-center justify-end gap-2.5">
          <div className="flex rounded-[10px] border border-line/15 bg-surface-2 p-0.5">
            <button onClick={() => setView('cards')} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${view === 'cards' ? 'bg-primary text-white' : 'text-muted'}`}><LayoutGrid className="h-4 w-4" /> Tarjetas</button>
            <button onClick={() => setView('list')} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[13px] font-semibold ${view === 'list' ? 'bg-primary text-white' : 'text-muted'}`}><List className="h-4 w-4" /> Lista</button>
          </div>
          <button onClick={() => setShowImport(true)} className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line/15 bg-surface px-4 text-[13px] font-semibold text-content hover:bg-surface-2"><Upload className="h-4 w-4" /> Importar</button>
          <button onClick={() => setShowGpt(true)} className="flex h-[38px] items-center gap-2 rounded-[10px] border px-4 text-[13px] font-semibold" style={{ borderColor: '#4285F4', color: '#4285F4' }}><Sparkles className="h-4 w-4" /> Catálogo con Gemini</button>
          <button onClick={downloadCatalog} className="flex h-[38px] items-center gap-2 rounded-[10px] border border-line/15 bg-surface px-4 text-[13px] font-semibold text-content hover:bg-surface-2"><Download className="h-4 w-4" /> Descargar catálogo</button>
          <button onClick={openNew} className="flex h-[38px] items-center gap-2 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white"><Plus className="h-4 w-4" /> Nuevo</button>
        </div>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s[0]} className="rounded-2xl border border-line/10 bg-surface p-4">
              <div className="text-[11px] font-bold uppercase tracking-wide text-muted">{s[0]}</div>
              <div className="mt-1.5 font-display text-2xl font-extrabold tnum">{s[1]}</div>
            </div>
          ))}
        </section>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[180px] flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar producto..." className="h-[38px] w-full rounded-[10px] border border-line/15 bg-surface pl-9 pr-3 text-[13px]" />
          </div>
          <select value={brand} onChange={(e) => setBrand(e.target.value)} className={sel}>
            <option value="">Todas las marcas ({items.length})</option>
            {brands.map((b) => <option key={b} value={b}>{b} ({items.filter((p) => p.brand === b).length})</option>)}
          </select>
          <select value={cat} onChange={(e) => setCat(e.target.value)} className={sel}>
            <option value="">Todas las categorías</option>
            {cats.map((c) => <option key={c} value={c!}>{c}</option>)}
          </select>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className={sel}>
            <option value="rank">Orden: más vendidos</option>
            <option value="price_desc">Precio: mayor a menor</option>
            <option value="price_asc">Precio: menor a mayor</option>
            <option value="name">Nombre A-Z</option>
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-line/10 bg-surface p-4">
          <span className="text-[13px] font-bold">Margen de ganancia</span>
          <div className="flex items-center gap-1.5">
            <input type="number" value={gPct} onChange={(e) => setGPct(Math.max(0, parseFloat(e.target.value) || 0))} className="h-9 w-[72px] rounded-[9px] border border-line/15 bg-surface px-2 text-center font-bold" />
            <span className="text-[13px] text-muted">%</span>
          </div>
          <button onClick={() => applyMargin('all')} className="h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px] font-semibold hover:bg-surface-2">Aplicar a todos</button>
          <button onClick={() => applyMargin('brand')} className="h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px] font-semibold hover:bg-surface-2">A la marca filtrada</button>
          <button onClick={() => applyMargin('cat')} className="h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px] font-semibold hover:bg-surface-2">A la categoría filtrada</button>
          <span className="text-[11px] text-muted">o editá el % de cada artículo en la vista Lista</span>
        </div>

        {truncated && (
          <div className="rounded-xl border border-dashed border-line/15 p-3 text-center text-[12px] text-muted">
            Mostrando {visible.length} de {filtered.length} productos — usá el buscador o los filtros para ver el resto.
          </div>
        )}

        {view === 'cards' ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {visible.map((p) => (
              <div key={p.id} className="group relative rounded-2xl border border-line/10 bg-surface p-4">
                <div className="absolute right-3 top-3 hidden gap-1 group-hover:flex">
                  <button onClick={() => openEdit(p)} aria-label="Editar" className="rounded-lg bg-surface-2 p-1.5 text-muted hover:text-content"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => removeProduct(p)} aria-label="Eliminar" className="rounded-lg bg-surface-2 p-1.5 text-muted hover:bg-rose/15 hover:text-rose"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                <div className="flex gap-3">
                  <ProdImg src={p.img} cat={p.category!} size={56} />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold">{p.name}</div>
                    <div className="mt-0.5 text-[11px] text-muted">{p.brand}</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">{p.category}</span>
                      <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">Bulto x {p.units || '-'} u.</span>
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-end justify-between border-t border-line/10 pt-3">
                  <div>
                    <div className="text-[10px] text-muted">Costo bulto / unidad</div>
                    <div className="text-[15px] font-bold tnum">{money(p.price)} <span className="text-[11px] font-medium text-muted">/ {p.units ? moneyD(Math.round(punit(p))) : '-'}</span></div>
                  </div>
                  {effMargin(p) > 0 && (
                    <div className="text-right">
                      <div className="text-[10px] text-emerald">Venta +{effMargin(p)}%</div>
                      <div className="text-[15px] font-extrabold tnum text-emerald">{money(ventaB(p))} <span className="text-[11px] font-medium">/ {p.units ? money(ventaU(p)) : '-'}</span></div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-line/10 bg-surface">
            <table className="w-full text-[13px]">
              <thead>
                <tr className="border-b border-line/10 text-left text-[11px] uppercase tracking-wide text-muted">
                  <th className="p-3">Producto</th><th className="p-3">Marca</th><th className="p-3">Cat.</th><th className="p-3">Bulto</th>
                  <th className="p-3">Precio bulto</th><th className="p-3">Costo unidad</th><th className="p-3">Margen %</th><th className="p-3">Venta bulto</th><th className="p-3">Venta unidad</th><th className="p-3"></th>
                </tr>
              </thead>
              <tbody>
                {visible.map((p) => (
                  <tr key={p.id} className="border-b border-line/10 hover:bg-surface-2">
                    <td className="p-3"><div className="flex items-center gap-2.5"><ProdImg src={p.img} cat={p.category!} size={34} /><span className="font-semibold">{p.name}</span></div></td>
                    <td className="p-3 text-muted">{p.brand}</td>
                    <td className="p-3"><span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">{p.category}</span></td>
                    <td className="p-3">x {p.units || '-'}</td>
                    <td className="p-3"><input type="number" value={p.price} onChange={(e) => setPrice(p.id, e.target.value)} className="h-[30px] w-[92px] rounded-lg border border-line/15 bg-surface px-2 text-right font-bold" /></td>
                    <td className="p-3 text-muted">{p.units ? moneyD(Math.round(punit(p))) : '-'}</td>
                    <td className="p-3"><input type="number" value={p.margin ?? ''} placeholder={String(gPct)} onChange={(e) => setMargin(p.id, e.target.value)} className="h-[30px] w-[62px] rounded-lg border border-line/15 bg-surface px-2 text-center font-bold" /></td>
                    <td className="p-3 font-bold text-emerald">{money(ventaB(p))}</td>
                    <td className="p-3 text-emerald">{p.units ? money(ventaU(p)) : '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(p)} aria-label="Editar" className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-content"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => removeProduct(p)} aria-label="Eliminar" className="rounded-lg p-1.5 text-muted hover:bg-rose/15 hover:text-rose"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {showNew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setShowNew(false)}>
          <div className="w-full max-w-[440px] rounded-2xl border border-line/10 bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><div className="font-bold">{editingId ? 'Editar producto' : 'Nuevo producto'}</div><button onClick={() => setShowNew(false)}><X className="h-5 w-5" /></button></div>
            <div className="grid grid-cols-2 gap-2">
              <input value={newProd.name} onChange={(e) => setNewProd((f) => ({ ...f, name: e.target.value }))} placeholder="Nombre*" className="col-span-2 h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
              <input value={newProd.brand} onChange={(e) => setNewProd((f) => ({ ...f, brand: e.target.value }))} placeholder="Marca" className="h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
              <select value={newProd.category} onChange={(e) => setNewProd((f) => ({ ...f, category: e.target.value }))} className="h-9 rounded-[10px] border border-line/15 bg-surface px-2 text-[13px]">
                {['Galletitas', 'Golosinas', 'Alfajores', 'Kiosco'].map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <input type="number" value={newProd.price} onChange={(e) => setNewProd((f) => ({ ...f, price: e.target.value }))} placeholder="Precio de costo (bulto)*" className="h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
              <input type="number" value={newProd.margin} onChange={(e) => setNewProd((f) => ({ ...f, margin: e.target.value }))} placeholder="% de ganancia" className="h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
              <input type="number" value={newProd.units} onChange={(e) => setNewProd((f) => ({ ...f, units: e.target.value }))} placeholder="Unidades por bulto" className="h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
              <input value={newProd.img} onChange={(e) => setNewProd((f) => ({ ...f, img: e.target.value }))} placeholder="URL de imagen (opcional)" className="col-span-2 h-9 rounded-[10px] border border-line/15 bg-surface px-3 text-[13px]" />
            </div>
            {newError && <div className="mt-2 rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-xs text-rose">{newError}</div>}
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setShowNew(false)} className="h-9 rounded-[10px] border border-line/15 px-4 text-[13px] font-semibold">Cancelar</button>
              <button onClick={submitNewProd} className="h-9 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white">{editingId ? 'Guardar cambios' : 'Guardar'}</button>
            </div>
          </div>
        </div>
      )}

      {showImport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setShowImport(false)}>
          <div className="w-full max-w-[470px] rounded-2xl border border-line/10 bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-3 flex items-center justify-between"><div className="font-bold">Importar catálogo</div><button onClick={() => setShowImport(false)}><X className="h-5 w-5" /></button></div>
            <p className="mb-2 text-[13px] text-muted">Pegá una fila por producto: <b>nombre, marca, categoría, precio_bulto, unidades, imagen_url</b></p>
            <textarea value={importText} onChange={(e) => setImportText(e.target.value)} rows={7} className="w-full rounded-[10px] border border-line/15 bg-surface p-3 font-mono text-xs" />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => setShowImport(false)} className="h-9 rounded-[10px] border border-line/15 px-4 text-[13px] font-semibold">Cancelar</button>
              <button onClick={doImport} className="h-9 rounded-[10px] bg-primary px-4 text-[13px] font-semibold text-white">Importar</button>
            </div>
          </div>
        </div>
      )}

      {showGpt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={() => setShowGpt(false)}>
          <div className="w-full max-w-[560px] rounded-2xl border border-line/10 bg-surface p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between"><div className="font-bold">Prompt para el catálogo PDF (Gemini)</div><button onClick={() => setShowGpt(false)}><X className="h-5 w-5" /></button></div>
            <p className="mb-2 text-[12px] text-muted">Listo para pegar en Gemini. Respeta el filtro de marca/categoría que tengas puesto.</p>
            <textarea readOnly value={buildPrompt()} rows={11} className="w-full rounded-[10px] border border-line/15 bg-surface p-3 font-mono text-xs" />
            <div className="mt-3 flex justify-end gap-2">
              <button onClick={() => navigator.clipboard?.writeText(buildPrompt())} className="flex h-9 items-center gap-1.5 rounded-[10px] border border-line/15 px-4 text-[13px] font-semibold"><Copy className="h-4 w-4" /> Copiar</button>
              <button onClick={() => { navigator.clipboard?.writeText(buildPrompt()); window.open('https://gemini.google.com/app', '_blank'); }} className="flex h-9 items-center gap-1.5 rounded-[10px] px-4 text-[13px] font-semibold text-white" style={{ background: '#4285F4' }}><ExternalLink className="h-4 w-4" /> Abrir Gemini</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
