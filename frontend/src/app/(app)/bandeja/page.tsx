'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Search, Send, Phone, Sparkles, Target, MessageSquareWarning,
  Copy, Paperclip, Smile, ChevronDown, Bot, CheckCheck,
  FileText, Image as ImageIcon, X, ArrowLeft, Video, VideoOff,
} from 'lucide-react';
import { Topbar } from '@/components/app/topbar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScoreGauge } from '@/components/app/score-gauge';
import { StatusBadge, IntentBadge } from '@/components/app/status-badge';
import { type ProductRow } from '@/lib/mock';
import { useProductCatalog } from '@/lib/product-catalog-store';
import { useClients } from '@/lib/clients-store';
import { useChatThreads } from '@/lib/chat-store';
import { useTiendaOrders } from '@/lib/tienda-orders-store';
import { useTiendaSettings } from '@/lib/tienda-settings-store';
import { InvoiceChoiceModal } from '@/components/app/invoice-choice-modal';
import { api, getUser } from '@/lib/api';
import { cn, initials, timeAgo } from '@/lib/utils';

const OBJECTION_LABEL: Record<string, string> = {
  PRECIO: 'Precio', ENVIO: 'Envío', CONFIANZA: 'Confianza',
  TIEMPO_ENTREGA: 'Tiempo de entrega', COMPETENCIA: 'Competencia', NINGUNA: 'Sin objeciones',
};

const money = (n: number) => '$' + Math.round(n).toLocaleString('es-AR');

// Agrupa por categoría y muestra el precio de VENTA (costo + margen), nunca el costo interno.
function buildPriceListHtml(products: ProductRow[], margenVenta: number) {
  const ventaBulto = (p: ProductRow) => Math.round(p.price * (1 + margenVenta));
  const byCat = new Map<string, ProductRow[]>();
  [...products].sort((a, b) => a.name.localeCompare(b.name)).forEach((p) => {
    const cat = p.category || 'Otros';
    (byCat.get(cat) ?? byCat.set(cat, []).get(cat)!).push(p);
  });
  const sections = [...byCat.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([cat, items]) => `
    <h2>${cat} <span class="count">${items.length} artículos</span></h2>
    <table>
      <thead><tr><th>Descripción del artículo</th><th>Marca</th><th style="text-align:right">Precio en bulto</th></tr></thead>
      <tbody>${items.map((p) => `<tr><td>${p.name}</td><td>${p.brand}</td><td style="text-align:right">${money(ventaBulto(p))}</td></tr>`).join('')}</tbody>
    </table>`).join('');

  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Lista de precios · MAON</title>
    <style>
      body{font-family:system-ui,-apple-system,sans-serif;padding:32px;color:#1A2233;max-width:900px;margin:auto}
      .head{border-bottom:3px solid #1B3358;padding-bottom:14px;margin-bottom:8px;display:flex;justify-content:space-between;align-items:end}
      h1{color:#1B3358;margin:0;font-size:24px}
      .sub{color:#7E8AA0;font-size:13px;margin-top:4px}
      h2{color:#1B3358;font-size:15px;margin:26px 0 8px;border-bottom:1px solid #DCE3EE;padding-bottom:6px;display:flex;justify-content:space-between}
      .count{color:#7E8AA0;font-size:11px;font-weight:400}
      table{width:100%;border-collapse:collapse;font-size:13px}
      th{text-align:left;color:#7E8AA0;font-size:10.5px;text-transform:uppercase;letter-spacing:.03em;border-bottom:1px solid #DCE3EE;padding:6px 8px}
      td{padding:6px 8px;border-bottom:1px solid #F0F3F8}
      tr:hover td{background:#F7F9FC}
      .btn{position:sticky;top:16px;float:right;background:#1B3358;color:#fff;border:none;border-radius:8px;padding:10px 18px;cursor:pointer;font-weight:600;margin-top:16px}
      @media print{.btn{display:none}}
    </style></head><body>
    <div class="head">
      <div><h1>MAON — Mayorista Online</h1><div class="sub">Lista de precios de venta · ${new Date().toLocaleDateString('es-AR')} · ${products.length} artículos</div></div>
      <button class="btn" onclick="window.print()">Imprimir / Guardar PDF</button>
    </div>
    ${sections}
    </body></html>`;
}

// ponytail: el catálogo hoy solo trae 1 foto por artículo y 0 videos (no hay data cargada todavía).
// Esta función ya devuelve una lista por artículo para que, cuando carguen más fotos/videos reales, no haya que tocar el picker.
function getProductMedia(p: ProductRow): { type: 'IMAGEN' | 'VIDEO'; url: string }[] {
  return p.img ? [{ type: 'IMAGEN', url: p.img }] : [];
}

function BandejaInner() {
  const router = useRouter();
  const { clients: allClients, updateClient } = useClients();
  const user = getUser();
  // Un vendedor solo ve las conversaciones de sus propios clientes.
  const CLIENTS = user?.role === 'VENDEDOR' ? allClients.filter((c) => c.seller === user.fullName) : allClients;
  const { getThread, appendMessage: appendToClient, loadThread } = useChatThreads();
  const { products: fullCatalog } = useProductCatalog();
  const { settings } = useTiendaSettings();
  const PRODUCT_ROWS = useMemo(
    () => fullCatalog.filter((p) => !settings.hiddenProductIds.includes(p.id)),
    [fullCatalog, settings.hiddenProductIds],
  );
  const { orders: tiendaOrders } = useTiendaOrders();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [mediaSearch, setMediaSearch] = useState('');
  const [mediaProductId, setMediaProductId] = useState<string | null>(null);
  const [mediaTab, setMediaTab] = useState<'FOTOS' | 'VIDEOS'>('FOTOS');
  const [aiSuggestions, setAiSuggestions] = useState<string[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState<any | null>(null);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');
  const [showInvoiceChoice, setShowInvoiceChoice] = useState(false);
  const [sendError, setSendError] = useState('');

  // ponytail: se lee directo de la URL en vez de useSearchParams() — evita envolver toda
  // la página en Suspense solo por esto (causaba que se cuelgue en local con esta página tan pesada).
  useEffect(() => {
    const fromParam = new URLSearchParams(window.location.search).get('clientId');
    if (fromParam) setActiveId(fromParam);
  }, []);

  // Las sugerencias de IA son por cliente: al cambiar de chat, se limpian.
  useEffect(() => {
    setAiSuggestions(null);
    setAiError('');
    setSendError('');
    setAnalyzeResult(null);
    setAnalyzeError('');
  }, [activeId]);

  const active = CLIENTS.find((c) => c.id === activeId) ?? CLIENTS[0];

  // Al abrir una conversación puntual (no el fallback por defecto), se marca como leída.
  useEffect(() => {
    if (!activeId) return;
    const opened = CLIENTS.find((c) => c.id === activeId);
    if (opened && opened.unread > 0) updateClient(activeId, { unread: 0 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  // Trae los mensajes reales del backend al abrir un chat (si está conectado).
  useEffect(() => {
    if (!activeId) return;
    const opened = CLIENTS.find((c) => c.id === activeId);
    if (opened) loadThread(opened);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  const thread = active ? getThread(active) : [];
  const pendingOrder = active ? tiendaOrders.find((o) => o.clientId === active.id && !o.invoiced) : undefined;
  const q = search.trim().toLowerCase();
  const visibleClients = q
    ? CLIENTS.filter((c) => `${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(q))
    : CLIENTS;

  const fallbackSuggestions = [
    '¡Sí! Hacemos envíos a todo el país 🚚. ¿A qué ciudad sería?',
    'Te lo reservo y coordinamos el envío hoy mismo. ¿Te paso medios de pago?',
    active?.objection === 'PRECIO'
      ? 'Si llevás 2+ unidades te hago un precio especial 😉'
      : '¿Querés que te arme el pedido completo con el descuento de esta semana?',
  ];
  const suggestions = aiSuggestions ?? fallbackSuggestions;

  if (!active) {
    return (
      <>
        <Topbar title="Bandeja" subtitle="WhatsApp Business" />
        <div className="flex flex-1 flex-col items-center justify-center gap-2 p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <MessageSquareWarning className="h-6 w-6" />
          </div>
          <div className="font-display text-base font-semibold text-content">Todavía no tenés conversaciones</div>
          <p className="max-w-[360px] text-[13px] text-muted">
            Los chats aparecen acá apenas un cliente escribe por WhatsApp o hace un pedido desde la tienda online.
          </p>
        </div>
      </>
    );
  }

  // Llama de verdad a Claude vía el backend (/ai/clients/:id/suggest). Si el backend
  // todavía no está levantado, avisa y se queda con las sugerencias fijas de siempre.
  const regenerateSuggestions = async () => {
    setAiLoading(true);
    setAiError('');
    try {
      const res = await api.suggest(active.id);
      setAiSuggestions(res.suggestions?.length ? res.suggestions : null);
    } catch (err: any) {
      setAiError(err.message === 'Failed to fetch' ? 'Backend no disponible: usando respuestas de ejemplo.' : 'No se pudo generar con IA.');
      setAiSuggestions(null);
    } finally {
      setAiLoading(false);
    }
  };

  // Reanaliza al cliente con IA (/ai/clients/:id/analyze) y persiste el resultado en el backend.
  const analyzeClient = async () => {
    setAnalyzeLoading(true);
    setAnalyzeError('');
    try {
      const res = await api.analyze(active.id);
      setAnalyzeResult(res);
    } catch (err: any) {
      setAnalyzeError(err.message === 'Failed to fetch' ? 'Backend no disponible.' : 'No se pudo analizar con IA.');
      setAnalyzeResult(null);
    } finally {
      setAnalyzeLoading(false);
    }
  };

  const closeMediaPicker = () => {
    setShowMediaPicker(false);
    setMediaSearch('');
    setMediaProductId(null);
    setMediaTab('FOTOS');
  };

  const sendText = async () => {
    const text = draft.trim();
    if (!text) return;
    if (text.toLowerCase() === '/cerrarventa') {
      router.push(`/facturacion?clientId=${active.id}`);
      setDraft('');
      return;
    }
    setDraft('');
    setSendError('');
    const err = await appendToClient(active, { content: text });
    if (err) setSendError(err);
  };

  const sendPriceList = async () => {
    const html = buildPriceListHtml(PRODUCT_ROWS, settings.margenVenta);
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
    const err = await appendToClient(active, { content: 'Lista de precios · MAON.pdf', type: 'DOCUMENTO' });
    if (err) setSendError(err);
  };

  const sendMedia = async (url: string, type: 'IMAGEN' | 'VIDEO', name: string) => {
    if (!url) return;
    closeMediaPicker();
    const err = await appendToClient(active, { content: name, type, mediaUrl: url });
    if (err) setSendError(err);
  };

  // Busca por palabras sueltas (cada token debe aparecer en el nombre/marca), así "alfaj triple choc" encuentra "ALFAJOR TRIPLE CHOCOLATE"
  const mediaTokens = mediaSearch.trim().toLowerCase().split(/\s+/).filter(Boolean);
  const mediaResults = PRODUCT_ROWS.filter((p) => {
    if (!p.img) return false;
    if (mediaTokens.length === 0) return true;
    const haystack = `${p.name} ${p.brand}`.toLowerCase();
    return mediaTokens.every((t) => haystack.includes(t));
  }).slice(0, 40);

  const mediaProduct = PRODUCT_ROWS.find((p) => p.id === mediaProductId);
  const productMedia = mediaProduct ? getProductMedia(mediaProduct).filter((m) => (mediaTab === 'FOTOS' ? m.type === 'IMAGEN' : m.type === 'VIDEO')) : [];

  return (
    <>
      <Topbar title="Bandeja" subtitle="WhatsApp Business · 7 conversaciones sin leer" />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Lista de conversaciones — en mobile ocupa toda la pantalla hasta elegir un chat */}
        <div className={cn('w-full shrink-0 flex-col border-r border-line/10 bg-surface/30 lg:flex lg:w-[300px]', activeId ? 'hidden lg:flex' : 'flex')}>
          <div className="border-b border-line/10 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                placeholder="Buscar conversación…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full rounded-xl border border-line/15 bg-surface-2/60 pl-9 pr-3 text-sm text-content placeholder:text-muted/70 focus:border-primary/50 focus:outline-none"
              />
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto">
            {visibleClients.length === 0 && <div className="p-4 text-center text-[12px] text-muted">Sin resultados.</div>}
            {visibleClients.map((c) => (
              <button
                key={c.id}
                onClick={() => setActiveId(c.id)}
                className={cn(
                  'flex w-full items-center gap-3 border-b border-line/5 px-3 py-3 text-left transition',
                  active.id === c.id ? 'bg-primary/8' : 'hover:bg-surface-2/50',
                )}
              >
                <div className="relative shrink-0">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-sky/80 text-xs font-bold text-white">
                    {initials(`${c.firstName} ${c.lastName}`)}
                  </div>
                  {c.leadScore >= 70 && <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-amber text-[9px]">🔥</span>}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-[13px] font-medium text-content">{c.firstName} {c.lastName}</span>
                    <span className="shrink-0 text-[10px] text-muted">{timeAgo(c.lastInboundAt)}</span>
                  </div>
                  <div className="mt-0.5 flex items-center justify-between gap-2">
                    <span className="truncate text-[12px] text-muted">{c.summary}</span>
                    {c.unread > 0 && <span className="tnum flex h-4 min-w-4 shrink-0 items-center justify-center rounded-full bg-emerald px-1 text-[10px] font-bold text-white">{c.unread}</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chat — en mobile solo se ve cuando hay un chat elegido */}
        <div className={cn('min-w-0 flex-1 flex-col bg-bg', activeId ? 'flex' : 'hidden lg:flex')}>
          <div className="flex items-center gap-3 border-b border-line/10 bg-surface/30 px-3 py-3 lg:px-5">
            <button onClick={() => setActiveId(null)} className="shrink-0 lg:hidden"><ArrowLeft className="h-5 w-5 text-muted" /></button>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/80 to-sky/80 text-xs font-bold text-white">
              {initials(`${active.firstName} ${active.lastName}`)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-content">{active.firstName} {active.lastName}</div>
              <div className="flex items-center gap-2 text-[11px] text-muted"><Phone className="h-3 w-3" /> {active.phone}</div>
            </div>
            <StatusBadge stage={active.stage} />
            <Button variant="outline" size="sm" className="hidden sm:inline-flex"><ChevronDown className="h-4 w-4" /> Estado</Button>
          </div>

          {pendingOrder && (
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-amber/20 bg-amber/10 px-3 py-2.5 lg:px-5">
              <div className="text-[12.5px] text-content">
                <b>Pedido de la tienda sin facturar</b> · {money(pendingOrder.subtotal)} · {pendingOrder.items.length} producto{pendingOrder.items.length === 1 ? '' : 's'}
              </div>
              <Button size="sm" onClick={() => setShowInvoiceChoice(true)}>
                Confirmar pedido y facturar
              </Button>
            </div>
          )}

          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-3 lg:p-5">
            <div className="mx-auto w-fit rounded-full bg-surface-2/60 px-3 py-1 text-[11px] text-muted">Hoy</div>
            {thread.map((m) => {
              const out = m.direction === 'SALIENTE';
              return (
                <div key={m.id} className={cn('flex', out ? 'justify-end' : 'justify-start')}>
                  <div className={cn(
                    'max-w-[85%] rounded-2xl px-3.5 py-2 text-[13px] leading-relaxed shadow-sm sm:max-w-[72%]',
                    out ? 'bg-primary text-white' : 'border border-line/10 bg-surface text-content',
                  )}>
                    {m.author === 'AUTOMATIZACION' && (
                      <span className="mb-1 flex items-center gap-1 text-[10px] font-medium opacity-80"><Bot className="h-3 w-3" /> Respuesta automática</span>
                    )}
                    {m.type === 'IMAGEN' && m.mediaUrl && (
                      <img src={m.mediaUrl} alt="" className="mb-1.5 h-32 w-32 rounded-lg object-cover" />
                    )}
                    {m.type === 'VIDEO' && m.mediaUrl && (
                      <video src={m.mediaUrl} controls className="mb-1.5 h-32 w-40 rounded-lg object-cover" />
                    )}
                    {m.type === 'DOCUMENTO' && (
                      <div className={cn('mb-1 flex items-center gap-2 rounded-lg p-2', out ? 'bg-white/15' : 'bg-surface-2')}>
                        <FileText className="h-5 w-5 shrink-0" />
                        <span className="text-[12px] font-medium">{m.content}</span>
                      </div>
                    )}
                    {(!m.type || m.type === 'TEXTO') && m.content}
                    <span className={cn('mt-1 flex items-center justify-end gap-1 text-[10px]', out ? 'text-white/70' : 'text-muted')}>
                      {new Date(m.at).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                      {out && <CheckCheck className="h-3 w-3" />}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Composer */}
          <div className="relative border-t border-line/10 bg-surface/30 p-3">
            {sendError && (
              <div className="mb-2 rounded-lg border border-rose/30 bg-rose/10 px-3 py-2 text-[11.5px] text-rose">{sendError}</div>
            )}
            <div className="mb-2 flex flex-wrap gap-1.5">
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setDraft(s)} className="group flex max-w-full items-center gap-1.5 rounded-full border border-primary/20 bg-primary/8 px-2.5 py-1 text-[11px] text-primary transition hover:bg-primary/15">
                  <Sparkles className="h-3 w-3 shrink-0" />
                  <span className="truncate">{s}</span>
                </button>
              ))}
            </div>
            <div className="mb-2 flex flex-wrap gap-1.5">
              <button onClick={sendPriceList} className="flex items-center gap-1.5 rounded-full border border-line/15 bg-surface px-2.5 py-1 text-[11px] font-medium text-content transition hover:bg-surface-2">
                <FileText className="h-3.5 w-3.5" /> Enviar lista de precios
              </button>
              <button onClick={() => setShowMediaPicker((v) => !v)} className="flex items-center gap-1.5 rounded-full border border-line/15 bg-surface px-2.5 py-1 text-[11px] font-medium text-content transition hover:bg-surface-2">
                <ImageIcon className="h-3.5 w-3.5" /> Fotos y videos de artículos
              </button>
            </div>

            {showMediaPicker && (
              <div className="absolute bottom-full left-3 right-3 z-10 mb-2 w-auto rounded-2xl border border-line/10 bg-surface p-3 shadow-card sm:left-3 sm:right-auto sm:w-[360px]">
                {!mediaProduct ? (
                  <>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[12px] font-semibold text-content">Buscá el artículo a enviar</span>
                      <button onClick={closeMediaPicker}><X className="h-4 w-4 text-muted" /></button>
                    </div>
                    <div className="relative mb-2">
                      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                      <input
                        autoFocus
                        value={mediaSearch}
                        onChange={(e) => setMediaSearch(e.target.value)}
                        placeholder="Buscar artículo… (ej: alfaj triple choc)"
                        className="h-8 w-full rounded-lg border border-line/15 bg-surface-2/60 pl-8 pr-2 text-[12px] text-content placeholder:text-muted/70 focus:border-primary/50 focus:outline-none"
                      />
                    </div>
                    <div className="max-h-[260px] space-y-1 overflow-y-auto">
                      {mediaResults.length === 0 && <div className="py-3 text-center text-[11px] text-muted">Sin resultados.</div>}
                      {mediaResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => setMediaProductId(p.id)}
                          className="flex w-full items-center gap-2 rounded-lg p-1.5 text-left hover:bg-surface-2"
                        >
                          <img src={p.img} alt="" className="h-9 w-9 shrink-0 rounded-md object-cover" />
                          <span className="truncate text-[12px] text-content">{p.name}</span>
                        </button>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-2 flex items-center gap-2">
                      <button onClick={() => setMediaProductId(null)}><ArrowLeft className="h-4 w-4 text-muted" /></button>
                      <span className="min-w-0 flex-1 truncate text-[12px] font-semibold text-content">{mediaProduct.name}</span>
                      <button onClick={closeMediaPicker}><X className="h-4 w-4 text-muted" /></button>
                    </div>
                    <div className="mb-2 inline-flex rounded-lg border border-line/15 bg-surface-2/60 p-0.5">
                      <button onClick={() => setMediaTab('FOTOS')} className={cn('flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium', mediaTab === 'FOTOS' ? 'bg-primary text-white' : 'text-muted')}>
                        <ImageIcon className="h-3.5 w-3.5" /> Fotos
                      </button>
                      <button onClick={() => setMediaTab('VIDEOS')} className={cn('flex items-center gap-1 rounded-md px-2.5 py-1 text-[11px] font-medium', mediaTab === 'VIDEOS' ? 'bg-primary text-white' : 'text-muted')}>
                        <Video className="h-3.5 w-3.5" /> Videos
                      </button>
                    </div>
                    <div className="grid max-h-[220px] grid-cols-3 gap-2 overflow-y-auto">
                      {productMedia.length === 0 && (
                        <div className="col-span-3 flex flex-col items-center gap-1.5 py-6 text-center text-[11px] text-muted">
                          <VideoOff className="h-5 w-5" />
                          {mediaTab === 'VIDEOS' ? 'No hay videos cargados para este artículo.' : 'No hay fotos cargadas para este artículo.'}
                        </div>
                      )}
                      {productMedia.map((m, i) => (
                        <button key={i} onClick={() => sendMedia(m.url, m.type, mediaProduct.name)} className="overflow-hidden rounded-lg border border-line/10 hover:border-primary/40">
                          <img src={m.url} alt="" className="h-20 w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="flex items-end gap-2">
              <Button variant="ghost" size="icon" onClick={() => setShowMediaPicker((v) => !v)}><Paperclip className="h-4 w-4" /></Button>
              <div className="flex flex-1 items-center rounded-xl border border-line/15 bg-surface-2/60 px-3">
                <input
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendText()}
                  placeholder="Escribí un mensaje… (probá /cerrarventa)"
                  className="h-10 flex-1 bg-transparent text-sm text-content placeholder:text-muted/70 focus:outline-none"
                />
                <Smile className="h-4 w-4 text-muted" />
              </div>
              <Button size="icon" aria-label="Enviar" onClick={sendText}><Send className="h-4 w-4" /></Button>
            </div>
          </div>
        </div>

        {/* Panel IA */}
        <div className="hidden w-[300px] shrink-0 flex-col overflow-y-auto border-l border-line/10 bg-surface/30 xl:flex">
          <div className="flex flex-col items-center border-b border-line/10 p-5">
            <ScoreGauge value={active.leadScore} size={120} />
            <div className="mt-3 text-center">
              <div className="font-display text-sm font-semibold text-content">{active.firstName} {active.lastName}</div>
              <div className="text-xs text-muted">{active.city}, {active.province}</div>
            </div>
          </div>

          <div className="space-y-4 p-4">
            <div className="flex flex-wrap gap-1.5">
              <IntentBadge intent={active.intent} />
              <Badge tone={active.sentiment === 'POSITIVO' ? 'emerald' : active.sentiment === 'NEGATIVO' ? 'rose' : 'muted'}>
                {active.sentiment === 'POSITIVO' ? 'Sentimiento +' : active.sentiment === 'NEGATIVO' ? 'Sentimiento −' : 'Neutro'}
              </Badge>
              {active.tags.map((t) => <Badge key={t.name} tone={t.color as any}>{t.name}</Badge>)}
            </div>

            <div className="rounded-xl border border-line/10 bg-surface-2/40 p-3">
              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-primary"><Sparkles className="h-3.5 w-3.5" /> Resumen IA</div>
              <p className="text-[13px] leading-relaxed text-content">{active.summary}</p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-line/10 bg-surface-2/40 p-3">
                <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted"><MessageSquareWarning className="h-3 w-3" /> Objeción</div>
                <div className="text-[13px] font-medium text-content">{OBJECTION_LABEL[active.objection]}</div>
              </div>
              <div className="rounded-xl border border-line/10 bg-surface-2/40 p-3">
                <div className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wide text-muted"><Target className="h-3 w-3" /> Acción</div>
                <div className="text-[13px] font-medium text-content">{active.intent === 'ALTA' ? 'Cerrar venta' : 'Enviar catálogo'}</div>
              </div>
            </div>

            <div>
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-muted">Producto de interés</div>
              <div className="flex items-center gap-3 rounded-xl border border-line/10 bg-surface-2/40 p-2.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/12 text-primary">📱</div>
                <div className="min-w-0">
                  <div className="truncate text-[13px] font-medium text-content">{active.product}</div>
                  <div className="text-[11px] text-muted">vía {active.source === 'META_ADS' ? 'Meta Ads' : 'WhatsApp'}</div>
                </div>
              </div>
            </div>

            <Button variant="soft" className="w-full" onClick={regenerateSuggestions} disabled={aiLoading}>
              <Copy className="h-4 w-4" /> {aiLoading ? 'Pensando…' : 'Regenerar respuestas IA'}
            </Button>
            {aiError && <div className="rounded-lg border border-line/10 bg-surface-2/60 px-2.5 py-1.5 text-[11px] text-muted">{aiError}</div>}
            {aiSuggestions && !aiError && <div className="text-[11px] text-emerald">✓ Generadas con IA (Claude)</div>}

            <Button variant="soft" className="w-full" onClick={analyzeClient} disabled={analyzeLoading}>
              <Sparkles className="h-4 w-4" /> {analyzeLoading ? 'Analizando…' : 'Analizar con IA'}
            </Button>
            {analyzeError && <div className="rounded-lg border border-line/10 bg-surface-2/60 px-2.5 py-1.5 text-[11px] text-muted">{analyzeError}</div>}
            {analyzeResult && !analyzeError && (
              <div className="space-y-1.5 rounded-xl border border-primary/15 bg-primary/5 p-3">
                <div className="text-[11px] font-semibold text-primary">Score {analyzeResult.leadScore} · {analyzeResult.sentiment}</div>
                <p className="text-[12px] text-content">{analyzeResult.summary}</p>
                <div className="text-[11px] text-muted">Próxima acción: {analyzeResult.nextAction}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showInvoiceChoice && pendingOrder && (
        <InvoiceChoiceModal
          onClose={() => setShowInvoiceChoice(false)}
          onChoose={(tipo, letra) => router.push(`/facturacion?clientId=${active.id}&autoOrderId=${pendingOrder.id}&autoTipo=${tipo}&autoLetra=${letra}`)}
        />
      )}
    </>
  );
}

export default function BandejaPage() {
  return <BandejaInner />;
}
