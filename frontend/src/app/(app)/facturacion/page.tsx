'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { PRODUCT_ROWS, IVA_CONDITION_LABEL, type Client } from '@/lib/mock';
import { useClients, fromBackend as fromBackendClient } from '@/lib/clients-store';
import { useChatThreads } from '@/lib/chat-store';
import { api } from '@/lib/api';
import { pesosEnLetras } from '@/lib/utils';

type Tipo = 'FACTURA' | 'REMITO' | 'NOTA_CREDITO' | 'NOTA_CREDITO_REMITO';
type Letra = 'A' | 'B' | 'C' | 'R';

const TIPO_LABEL: Record<Tipo, string> = {
  FACTURA: 'Factura',
  REMITO: 'Remito',
  NOTA_CREDITO: 'Nota de crédito',
  NOTA_CREDITO_REMITO: 'Nota de crédito en remito',
};
const PREFIX: Record<Tipo, string> = { FACTURA: 'FC', REMITO: 'RE', NOTA_CREDITO: 'NC', NOTA_CREDITO_REMITO: 'NCR' };
// Letras válidas por tipo: factura/N.C. son fiscales (A/B/C), remitos no son válidos como factura (R)
const LETRAS_POR_TIPO: Record<Tipo, Letra[]> = {
  FACTURA: ['A', 'B', 'C'],
  NOTA_CREDITO: ['A', 'B', 'C'],
  REMITO: ['R'],
  NOTA_CREDITO_REMITO: ['R'],
};

// ponytail: datos del emisor a completar con los reales de MAON cuando estén disponibles
const EMISOR = {
  nombre: 'MAON - Mayorista Online',
  direccion: 'Dirección a completar',
  localidad: 'Rosario',
  provincia: 'Santa Fe',
  cuit: '00-00000000-0',
  ivaCondition: 'Responsable Inscripto',
  ingresosBrutos: 'A completar',
  inicioActividades: 'A completar',
  tel: '',
  web: '',
  email: '',
};

interface Item { detalle: string; cantidad: number; unitPrice: number; subtotal: number; ivaRate: number }
interface IvaGroup { rate: number; neto: number; importe: number }
interface Comprobante {
  numero: string; fecha: string; tipo: Tipo; letra: Letra;
  clientId: string; client: Client;
  items: Item[]; subtotal: number; ivaGroups: IvaGroup[]; iva: number; total: number; sign: number;
  cae?: string; caeVto?: string;
}

const IVA_RATES = [
  { value: 0.21, label: 'IVA 21%' },
  { value: 0.105, label: 'IVA 10.5%' },
  { value: 0, label: 'Exento / no discriminado' },
];

const money = (n: number) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (rate: number) => `${(rate * 100).toFixed(1).replace(/\.0$/, '')}%`;
const todayISO = () => new Date().toISOString().slice(0, 10);
const fechaAR = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR');

/** El backend ya persiste ivaRate por ítem; acá se reconstruye el desglose por alícuota para imprimir igual que en modo local. */
function fromBackendComprobante(bc: any): Comprobante {
  const items: Item[] = (bc.items ?? []).map((it: any) => ({
    detalle: it.detalle, cantidad: it.cantidad, unitPrice: Number(it.unitPrice),
    subtotal: Number(it.subtotal), ivaRate: it.ivaRate ?? 0.21,
  }));
  const byRate = new Map<number, number>();
  items.forEach((it) => { if (it.ivaRate > 0) byRate.set(it.ivaRate, (byRate.get(it.ivaRate) ?? 0) + it.subtotal); });
  const ivaGroups: IvaGroup[] = Array.from(byRate.entries()).map(([rate, neto]) => ({ rate, neto, importe: Math.round(neto * rate * 100) / 100 }));
  return {
    numero: bc.numero, fecha: String(bc.issuedAt ?? bc.createdAt ?? todayISO()).slice(0, 10),
    tipo: bc.tipo, letra: bc.letra, clientId: bc.clientId, client: fromBackendClient(bc.client),
    items, subtotal: Number(bc.subtotal), ivaGroups, iva: Number(bc.iva), total: Number(bc.total),
    sign: bc.sign, cae: bc.cae ?? undefined, caeVto: bc.caeVto ? String(bc.caeVto).slice(0, 10) : undefined,
  };
}

function FacturacionInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { clients: CLIENTS } = useClients();
  const { appendMessage: sendToChat } = useChatThreads();
  const [tab, setTab] = useState<'emitir' | 'libro'>('emitir');
  const [clientId, setClientId] = useState('');

  // Llegó desde Bandeja con "/cerrarventa": precarga el cliente para facturarle
  useEffect(() => {
    const fromChat = searchParams.get('clientId');
    if (fromChat) setClientId(fromChat);
  }, [searchParams]);

  // Intenta traer el libro de comprobantes real del backend; si no responde, se queda vacío como siempre
  useEffect(() => {
    let cancelled = false;
    api.comprobantes()
      .then((res) => {
        if (cancelled) return;
        const rows = (res.data ?? res).map(fromBackendComprobante);
        setLedger(rows);
        setComprobanteSource('backend');
      })
      .catch(() => { if (!cancelled) setComprobanteSource('local'); });
    return () => { cancelled = true; };
  }, []);
  const [tipo, setTipo] = useState<Tipo>('FACTURA');
  const [letra, setLetra] = useState<Letra>('A');
  const [cae, setCae] = useState('');
  const [caeVto, setCaeVto] = useState('');
  const [ivaBlanco, setIvaBlanco] = useState(false); // solo para N/C en blanco (sin ítems)
  const [enBlanco, setEnBlanco] = useState(false);
  const [desc, setDesc] = useState('');
  const [importe, setImporte] = useState('');
  const [prodId, setProdId] = useState(PRODUCT_ROWS[0]?.id ?? '');
  const [qty, setQty] = useState(1);
  const [itemIvaRate, setItemIvaRate] = useState(0.21);
  const [margin, setMargin] = useState(30);
  const [draft, setDraft] = useState<Item[]>([]);
  const [ledger, setLedger] = useState<Comprobante[]>([]);
  const [comprobanteSource, setComprobanteSource] = useState<'backend' | 'local'>('local');
  const [sentToChatNums, setSentToChatNums] = useState<string[]>([]);
  const [libFilter, setLibFilter] = useState('');
  const [seq, setSeq] = useState<Record<string, number>>({});
  const [formError, setFormError] = useState('');

  const isNC = tipo === 'NOTA_CREDITO' || tipo === 'NOTA_CREDITO_REMITO';
  const requiereCae = letra === 'A' && (tipo === 'FACTURA' || isNC);
  const ventaBulto = (price: number) => Math.round(price * (1 + margin / 100));

  const changeTipo = (t: Tipo) => {
    setTipo(t);
    setEnBlanco(false);
    if (!LETRAS_POR_TIPO[t].includes(letra)) setLetra(LETRAS_POR_TIPO[t][0]);
  };

  const subtotal = useMemo(
    () => (enBlanco && isNC ? Number(importe) || 0 : draft.reduce((a, it) => a + it.subtotal, 0)),
    [enBlanco, isNC, importe, draft],
  );
  // Agrupa por alícuota (un comprobante puede mezclar 21% y 10.5%, como en los ejemplos reales)
  const ivaGroups: IvaGroup[] = useMemo(() => {
    if (enBlanco && isNC) return ivaBlanco ? [{ rate: 0.21, neto: subtotal, importe: subtotal * 0.21 }] : [];
    const byRate = new Map<number, number>();
    draft.forEach((it) => byRate.set(it.ivaRate, (byRate.get(it.ivaRate) || 0) + it.subtotal));
    return Array.from(byRate.entries())
      .filter(([rate]) => rate > 0)
      .map(([rate, neto]) => ({ rate, neto, importe: Math.round(neto * rate * 100) / 100 }));
  }, [enBlanco, isNC, ivaBlanco, subtotal, draft]);
  const ivaImporte = ivaGroups.reduce((a, g) => a + g.importe, 0);
  const total = subtotal + ivaImporte;

  const addItem = () => {
    const p = PRODUCT_ROWS.find((x) => x.id === prodId);
    if (!p) return;
    const q = Math.max(1, qty || 1);
    const unit = ventaBulto(p.price);
    setDraft((d) => [...d, { detalle: `${p.name} (bulto x${p.units || '-'})`, cantidad: q, unitPrice: unit, subtotal: unit * q, ivaRate: itemIvaRate }]);
  };

  const commitEntry = async (opts: {
    tipo: Tipo; letra: Letra; clientId: string; items: Item[];
    subtotal: number; ivaGroups: IvaGroup[]; ivaImporte: number; cae?: string; caeVto?: string;
  }) => {
    if (comprobanteSource === 'backend') {
      try {
        const created = await api.createComprobante({
          tipo: opts.tipo, letra: opts.letra, clientId: opts.clientId,
          cae: opts.cae, caeVto: opts.caeVto,
          items: opts.items.map((it) => ({ detalle: it.detalle, cantidad: it.cantidad, unitPrice: it.unitPrice, ivaRate: it.ivaRate })),
        });
        const entry = fromBackendComprobante(created);
        setLedger((l) => [entry, ...l]);
        printComprobante(entry);
        return entry;
      } catch {
        // si falla el POST, se emite igual localmente para no perder la carga
      }
    }

    const client = CLIENTS.find((x) => x.id === opts.clientId)!;
    const seqKey = `${opts.tipo}_${opts.letra}`;
    const nextN = (seq[seqKey] || 0) + 1;
    setSeq((s) => ({ ...s, [seqKey]: nextN }));
    const numero = `${PREFIX[opts.tipo]} 0001-${String(nextN).padStart(8, '0')}`;
    const entry: Comprobante = {
      numero, fecha: todayISO(), tipo: opts.tipo, letra: opts.letra, clientId: opts.clientId, client,
      items: opts.items, subtotal: opts.subtotal, ivaGroups: opts.ivaGroups, iva: opts.ivaImporte,
      total: Math.round((opts.subtotal + opts.ivaImporte) * 100) / 100,
      sign: (opts.tipo === 'NOTA_CREDITO' || opts.tipo === 'NOTA_CREDITO_REMITO') ? -1 : 1,
      cae: opts.cae, caeVto: opts.caeVto,
    };
    setLedger((l) => [entry, ...l]);
    printComprobante(entry);
    return entry;
  };

  const emitir = () => {
    setFormError('');
    if (!clientId) return setFormError('Elegí un cliente');
    if (enBlanco && isNC) { if (!(Number(importe) > 0)) return setFormError('Poné el importe de la nota'); }
    else if (!draft.length) return setFormError('Agregá al menos un producto');
    if (requiereCae && (!cae.trim() || !caeVto)) {
      return setFormError('Factura y nota de crédito letra A requieren CAE y fecha de vencimiento (indica que impactó en ARCA)');
    }

    const items: Item[] = enBlanco && isNC
      ? [{ detalle: desc || 'Nota de crédito', cantidad: 1, unitPrice: subtotal, subtotal, ivaRate: ivaBlanco ? 0.21 : 0 }]
      : draft;
    commitEntry({
      tipo, letra, clientId, items, subtotal, ivaGroups, ivaImporte,
      cae: requiereCae ? cae.trim() : undefined,
      caeVto: requiereCae ? caeVto : undefined,
    });
    setDraft([]); setDesc(''); setImporte(''); setCae(''); setCaeVto('');
  };

  // Genera un Remito de prueba (letra R, sin CAE) para probar el circuito PDF / Enviar al chat sin trabas.
  const emitirPrueba = () => {
    setFormError('');
    const testClientId = clientId || CLIENTS[0]?.id;
    if (!testClientId) return setFormError('No hay clientes cargados para la prueba');
    const p = PRODUCT_ROWS[0];
    const unit = ventaBulto(p.price);
    const testItem: Item = { detalle: `${p.name} (bulto x${p.units || '-'})`, cantidad: 1, unitPrice: unit, subtotal: unit, ivaRate: 0 };
    commitEntry({
      tipo: 'REMITO', letra: 'R', clientId: testClientId,
      items: [testItem], subtotal: unit, ivaGroups: [], ivaImporte: 0,
    });
  };

  const printComprobante = (e: Comprobante) => {
    const c = e.client;
    const razonSocial = c.businessName || `${c.firstName} ${c.lastName}`.trim();
    const rows = e.items.map(
      (it) => `<tr><td>${it.cantidad.toFixed(2)}</td><td>${it.detalle}</td><td style="text-align:right">${money(it.unitPrice)}</td><td style="text-align:right">${money(it.subtotal)}</td></tr>`,
    ).join('');
    const esFiscalA = !!e.cae;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${e.numero}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px;font-size:12px}
        .box{max-width:760px;margin:auto;border:1px solid #000}
        .head{display:flex;border-bottom:1px solid #000}
        .head .empresa{flex:1;padding:10px;border-right:1px solid #000}
        .head .empresa h1{font-size:20px;margin:0 0 4px;color:#56682B;letter-spacing:1px}
        .head .letra{width:56px;display:flex;align-items:center;justify-content:center;font-size:30px;font-weight:800;border-right:1px solid #000}
        .head .doc{flex:1.1;padding:10px}
        .doc .t{font-weight:700;font-size:15px}
        .doc .sub{font-size:11px;color:#333;margin-bottom:6px}
        .row{display:flex;font-size:12px;justify-content:space-between;margin:2px 0}
        .clientes{display:flex;border-bottom:1px solid #000}
        .clientes .l,.clientes .r{flex:1;padding:10px}
        .clientes .l{border-right:1px solid #000}
        .clientes b{display:inline-block;min-width:112px}
        .cond{display:flex;border-bottom:1px solid #000;padding:8px 10px;justify-content:space-between;font-size:12px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th{text-align:left;background:#eee;padding:6px 10px;border-bottom:1px solid #000}
        td{padding:6px 10px;border-bottom:1px solid #ddd}
        .totales{display:flex;border-top:1px solid #000}
        .totales .imp{flex:1;padding:10px;border-right:1px solid #000}
        .totales .sum{width:220px;padding:10px}
        .sum .r2{display:flex;justify-content:space-between;font-size:12px;margin:3px 0}
        .sum .tot{display:flex;justify-content:space-between;font-weight:800;font-size:16px;border-top:1px solid #000;margin-top:6px;padding-top:6px}
        .letras{padding:8px 10px;border-top:1px solid #000;font-size:11px}
        .footer{display:flex;border-top:1px solid #000}
        .footer .qr{width:150px;padding:10px;text-align:center;font-size:10px;color:#555;border-right:1px solid #000}
        .footer .arca{flex:1;padding:10px;text-align:center;font-size:11px;font-weight:700}
        .footer .cae{width:220px;padding:10px;font-size:11px;text-align:right}
        .btn{background:#56682B;color:#fff;border:none;border-radius:6px;padding:10px 16px;cursor:pointer;font-weight:600;margin-top:14px}
        @media print{.btn{display:none}}
      </style></head><body>
      <div class="box">
        <div class="head">
          <div class="empresa">
            <h1>${EMISOR.nombre}</h1>
            <div>${EMISOR.direccion}</div>
            <div>${EMISOR.localidad} - ${EMISOR.provincia}</div>
            <div>ARGENTINA</div>
            <div style="margin-top:4px">IVA: ${EMISOR.ivaCondition}</div>
            ${EMISOR.tel ? `<div>Tel: ${EMISOR.tel}</div>` : ''}
          </div>
          <div class="letra">${e.letra}</div>
          <div class="doc">
            <div class="t">${TIPO_LABEL[e.tipo]}</div>
            ${!esFiscalA && (e.tipo === 'FACTURA' || e.tipo.startsWith('NOTA')) ? '<div class="sub">Documento No Válido como Factura</div>' : ''}
            <div class="row"><span>N°:</span><b>${e.numero}</b></div>
            <div class="row"><span>Fecha:</span><b>${fechaAR(e.fecha)}</b></div>
            <div class="row"><span>CUIT:</span><b>${EMISOR.cuit}</b></div>
            <div class="row"><span>Ing. Brutos:</span><b>${EMISOR.ingresosBrutos}</b></div>
            <div class="row"><span>Inic. Activ.:</span><b>${EMISOR.inicioActividades}</b></div>
          </div>
        </div>
        <div class="clientes">
          <div class="l">
            <div><b>Razón Social:</b> ${razonSocial}</div>
            <div><b>Código Cliente:</b> ${c.clientCode || '-'}</div>
            <div><b>Dirección:</b> ${c.address || '-'}</div>
            <div>${c.postalCode || ''} ${c.city || ''}</div>
            <div>ARGENTINA</div>
          </div>
          <div class="r">
            <div><b>CUIT:</b> ${c.cuit || '-'}</div>
            <div><b>IVA:</b> ${IVA_CONDITION_LABEL[c.ivaCondition]}</div>
            <div><b>Localidad:</b> ${c.city || '-'}</div>
            <div><b>Provincia:</b> ${c.province || '-'}</div>
            <div><b>Vendedor:</b> ${c.seller || '-'}</div>
          </div>
        </div>
        <div class="cond">
          <span><b>Condición de Venta:</b> ${c.condicionVenta || 'Contado'}</span>
          <span><b>Vencimiento:</b> ${fechaAR(e.fecha)}</span>
        </div>
        <table>
          <thead><tr><th style="width:70px">Cantidad</th><th>Descripción</th><th style="text-align:right;width:120px">Precio</th><th style="text-align:right;width:120px">Total</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <div class="totales">
          <div class="imp">
            <b>Detalle de Impuestos</b>
            ${e.ivaGroups.length > 0
              ? e.ivaGroups.map((g) => `<div class="row"><span>IVA ${pct(g.rate)} (neto ${money(g.neto)})</span><span>${money(g.importe)}</span></div>`).join('')
              : '<div style="color:#777">El monto del IVA discriminado no puede computarse como crédito fiscal</div>'}
          </div>
          <div class="sum">
            <div class="r2"><span>Subtotal</span><span>${money(e.subtotal)}</span></div>
            ${e.iva > 0 ? `<div class="r2"><span>Total IVA</span><span>${money(e.iva)}</span></div>` : ''}
            <div class="tot"><span>Total${e.sign < 0 ? ' (N/C)' : ''}</span><span>${money(e.total)}</span></div>
          </div>
        </div>
        <div class="letras">${pesosEnLetras(e.total)}</div>
        <div class="footer">
          <div class="qr">[ QR ARCA ]</div>
          <div class="arca">ARCA<br/>Agencia de Recaudación<br/>y Control Aduanero</div>
          <div class="cae">
            ${esFiscalA ? `<div><b>CAE:</b> ${e.cae}</div><div><b>Vto CAE:</b> ${fechaAR(e.caeVto!)}</div>` : '<div style="color:#777">Sin CAE — no válido como factura</div>'}
          </div>
        </div>
      </div>
      <button class="btn" onclick="window.print()">Imprimir / Guardar PDF</button>
      </body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); }
  };

  const handleSendToChat = (e: Comprobante) => {
    sendToChat(e.client, { content: `${TIPO_LABEL[e.tipo]} ${e.letra} · ${e.numero}.pdf`, type: 'DOCUMENTO' });
    setSentToChatNums((nums) => [...nums, e.numero]);
    router.push(`/bandeja?clientId=${e.clientId}`);
  };

  const libRows = libFilter ? ledger.filter((e) => e.clientId === libFilter) : ledger;
  const chrono = [...libRows].reverse();
  let saldo = 0;
  const withSaldo = chrono.map((e) => {
    const debe = e.sign > 0 ? e.total : 0;
    const haber = e.sign < 0 ? e.total : 0;
    saldo += debe - haber;
    return { ...e, debe, haber, saldo };
  }).reverse();
  const totFac = libRows.filter((e) => e.sign > 0).reduce((a, e) => a + e.total, 0);
  const totNC = libRows.filter((e) => e.sign < 0).reduce((a, e) => a + e.total, 0);

  const card: React.CSSProperties = { background: 'var(--surface)', border: '1px solid var(--line)', borderRadius: 16, padding: 18 };
  const inp: React.CSSProperties = { height: 38, border: '1px solid var(--line2)', background: 'var(--surface)', borderRadius: 10, padding: '0 12px', color: 'var(--text)', fontSize: 13, width: '100%' };
  const btn: React.CSSProperties = { height: 38, padding: '0 16px', borderRadius: 10, background: 'var(--primary)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 13, cursor: 'pointer' };
  const btnOut: React.CSSProperties = { ...btn, background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--line2)' };
  const btnSm: React.CSSProperties = { height: 26, padding: '0 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: 'pointer' };

  return (
    <div style={{ maxWidth: 1180, margin: '0 auto', padding: 20 }}>
      <h1 style={{ fontSize: 23, fontWeight: 800 }}>Facturación</h1>
      <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 16 }}>
        Emití facturas, remitos y notas de crédito. Todo queda en el libro contable por cliente.
      </p>

      <div style={{ display: 'inline-flex', background: 'var(--surface2)', border: '1px solid var(--line)', borderRadius: 10, padding: 3, marginBottom: 16 }}>
        {(['emitir', 'libro'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            style={{ border: 'none', background: tab === t ? 'var(--lime-bg)' : 'transparent', color: tab === t ? 'var(--primary-dark)' : 'var(--muted)', fontWeight: 600, fontSize: 13, padding: '6px 14px', borderRadius: 8, cursor: 'pointer' }}>
            {t === 'emitir' ? 'Emitir comprobante' : 'Libro contable'}
          </button>
        ))}
      </div>

      {tab === 'emitir' && (
        <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr]" style={{ gap: 14 }}>
          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>Nuevo comprobante</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              <label style={{ flex: 2, minWidth: 160 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Cliente</div>
                <select style={inp} value={clientId} onChange={(e) => setClientId(e.target.value)}>
                  <option value="">Elegí un cliente</option>
                  {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.businessName || `${c.firstName} ${c.lastName}`} {c.cuit ? `· ${c.cuit}` : ''}</option>)}
                </select>
              </label>
              <label style={{ flex: 1, minWidth: 150 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Tipo de comprobante</div>
                <select style={inp} value={tipo} onChange={(e) => changeTipo(e.target.value as Tipo)}>
                  {(Object.keys(TIPO_LABEL) as Tipo[]).map((t) => <option key={t} value={t}>{TIPO_LABEL[t]}</option>)}
                </select>
              </label>
              <label style={{ width: 90 }}>
                <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Letra</div>
                <select style={inp} value={letra} onChange={(e) => setLetra(e.target.value as Letra)}>
                  {LETRAS_POR_TIPO[tipo].map((l) => <option key={l} value={l}>{l}</option>)}
                </select>
              </label>
            </div>

            {requiereCae && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, background: 'var(--surface2)', padding: 10, borderRadius: 10 }}>
                <label style={{ flex: 1, minWidth: 180 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>CAE (ARCA) *</div>
                  <input style={inp} value={cae} onChange={(e) => setCae(e.target.value)} placeholder="Nº de CAE otorgado por ARCA" />
                </label>
                <label style={{ width: 170 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Vto. CAE *</div>
                  <input style={inp} type="date" value={caeVto} onChange={(e) => setCaeVto(e.target.value)} />
                </label>
                <div style={{ fontSize: 11, color: 'var(--muted)', alignSelf: 'center' }}>
                  Obligatorio en letra A: certifica que el comprobante impactó en ARCA.
                </div>
              </div>
            )}

            {isNC && (
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer', margin: '4px 0 12px' }}>
                <input type="checkbox" checked={enBlanco} onChange={(e) => setEnBlanco(e.target.checked)} />
                Nota de crédito en blanco (sin productos, importe manual)
              </label>
            )}

            {!enBlanco && (
              <>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-end', marginBottom: 10 }}>
                  <label style={{ flex: 2, minWidth: 160 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Producto</div>
                    <select style={inp} value={prodId} onChange={(e) => setProdId(e.target.value)}>
                      {PRODUCT_ROWS.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                  </label>
                  <label style={{ width: 88 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Bultos</div>
                    <input style={inp} type="number" min={1} value={qty} onChange={(e) => setQty(Number(e.target.value))} />
                  </label>
                  <label style={{ width: 150 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Alícuota</div>
                    <select style={inp} value={itemIvaRate} onChange={(e) => setItemIvaRate(Number(e.target.value))}>
                      {IVA_RATES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </label>
                  <button style={btnOut} onClick={addItem}>Agregar</button>
                </div>
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', minWidth: 560, borderCollapse: 'collapse', fontSize: 13 }}>
                    <thead><tr>
                      {['Detalle', 'Cant.', 'P. unit', 'Subtotal', 'IVA', ''].map((h) => (
                        <th key={h} style={{ textAlign: 'left', color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', borderBottom: '1px solid var(--line)', padding: 8 }}>{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {draft.length === 0 && <tr><td colSpan={6} style={{ color: 'var(--muted)', textAlign: 'center', padding: 14 }}>Sin items. Agregá productos.</td></tr>}
                      {draft.map((it, i) => (
                        <tr key={i}>
                          <td style={{ padding: 8, borderBottom: '1px solid var(--line)' }}>{it.detalle}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid var(--line)' }}>{it.cantidad}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid var(--line)' }}>{money(it.unitPrice)}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid var(--line)' }}>{money(it.subtotal)}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid var(--line)' }}>{it.ivaRate > 0 ? pct(it.ivaRate) : '-'}</td>
                          <td style={{ padding: 8, borderBottom: '1px solid var(--line)' }}>
                            <button style={{ ...btnOut, height: 28, padding: '0 8px' }} onClick={() => setDraft((d) => d.filter((_, k) => k !== i))}>✕</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {enBlanco && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                <label style={{ flex: 2, minWidth: 160 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Descripción</div>
                  <input style={inp} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Detalle de la nota" />
                </label>
                <label style={{ width: 150 }}>
                  <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Importe ($)</div>
                  <input style={inp} type="number" value={importe} onChange={(e) => setImporte(e.target.value)} />
                </label>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', marginTop: 12, paddingTop: 12, gap: 10, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                {enBlanco && isNC ? (
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)', cursor: 'pointer' }}>
                    <input type="checkbox" checked={ivaBlanco} onChange={(e) => setIvaBlanco(e.target.checked)} /> Discriminar IVA 21%
                  </label>
                ) : (
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>La alícuota de IVA se elige por producto al agregarlo.</div>
                )}
                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--muted)' }}>
                  Margen % <input style={{ ...inp, width: 64, height: 30 }} type="number" value={margin} onChange={(e) => setMargin(Number(e.target.value))} />
                </label>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>Total</div>
                <div style={{ fontSize: 24, fontWeight: 800 }}>{money(total)}</div>
              </div>
            </div>
            {formError && <div style={{ marginTop: 10, borderRadius: 8, border: '1px solid var(--red)', background: 'rgba(203,74,51,0.1)', padding: '8px 12px', fontSize: 12, color: 'var(--red)' }}>{formError}</div>}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button style={{ ...btn, flex: 1 }} onClick={emitir}>Emitir y generar PDF</button>
              <button style={{ ...btnOut }} onClick={emitirPrueba} title="Genera un remito de prueba (letra R, sin CAE) para probar PDF y envío al chat">Generar boleta de prueba</button>
            </div>
            <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
              {requiereCae ? 'Letra A: el comprobante requiere CAE de ARCA para ser válido como factura.' : 'Sin letra A no se solicita CAE (documento no válido como factura fiscal).'}
            </div>
          </div>

          <div style={card}>
            <div style={{ fontWeight: 700, marginBottom: 10 }}>Últimos comprobantes</div>
            {ledger.length === 0 && <div style={{ color: 'var(--muted)', fontSize: 13 }}>Todavía no emitiste comprobantes.</div>}
            {ledger.slice(0, 10).map((e, i) => (
              <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid var(--line)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{TIPO_LABEL[e.tipo]} {e.letra}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>{e.numero} · {e.client.businessName || `${e.client.firstName} ${e.client.lastName}`}</div>
                  </div>
                  <b style={{ color: e.sign < 0 ? 'var(--red)' : 'var(--green)' }}>{e.sign < 0 ? '-' : ''}{money(e.total)}</b>
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  <button style={{ ...btnOut, ...btnSm }} onClick={() => printComprobante(e)}>PDF</button>
                  <button style={{ ...btn, ...btnSm }} disabled={sentToChatNums.includes(e.numero)} onClick={() => handleSendToChat(e)}>
                    {sentToChatNums.includes(e.numero) ? 'Enviado al chat ✓' : 'Enviar al chat'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'libro' && (
        <>
          <div style={{ ...card, display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            <label>
              <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 5 }}>Filtrar por cliente</div>
              <select style={{ ...inp, minWidth: 200 }} value={libFilter} onChange={(e) => setLibFilter(e.target.value)}>
                <option value="">Todos los clientes</option>
                {CLIENTS.map((c) => <option key={c.id} value={c.id}>{c.firstName} {c.lastName}</option>)}
              </select>
            </label>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
              <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Facturado</div><div style={{ fontWeight: 800, color: 'var(--green)' }}>{money(totFac)}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Notas de crédito</div><div style={{ fontWeight: 800, color: 'var(--red)' }}>{money(totNC)}</div></div>
              <div><div style={{ fontSize: 11, color: 'var(--muted)' }}>Saldo</div><div style={{ fontWeight: 800 }}>{money(totFac - totNC)}</div></div>
            </div>
          </div>
          <div style={{ ...card, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: 640, borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr>
                  {['Fecha', 'Cliente', 'Comprobante', 'Tipo', 'Debe', 'Haber', 'Saldo'].map((h, k) => (
                    <th key={h} style={{ textAlign: k > 3 ? 'right' : 'left', color: 'var(--muted)', fontSize: 11, textTransform: 'uppercase', padding: '11px 13px', borderBottom: '1px solid var(--line)' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {withSaldo.length === 0 && <tr><td colSpan={7} style={{ textAlign: 'center', color: 'var(--muted)', padding: 16 }}>Sin movimientos. Emití un comprobante.</td></tr>}
                  {withSaldo.map((e, i) => (
                    <tr key={i}>
                      <td style={{ padding: '12px 13px', borderBottom: '1px solid var(--line)', color: 'var(--muted)' }}>{fechaAR(e.fecha)}</td>
                      <td style={{ padding: '12px 13px', borderBottom: '1px solid var(--line)' }}>{e.client.businessName || `${e.client.firstName} ${e.client.lastName}`}</td>
                      <td style={{ padding: '12px 13px', borderBottom: '1px solid var(--line)' }}>{e.numero}</td>
                      <td style={{ padding: '12px 13px', borderBottom: '1px solid var(--line)' }}>{TIPO_LABEL[e.tipo]} {e.letra}</td>
                      <td style={{ padding: '12px 13px', borderBottom: '1px solid var(--line)', textAlign: 'right' }}>{e.debe ? money(e.debe) : '-'}</td>
                      <td style={{ padding: '12px 13px', borderBottom: '1px solid var(--line)', textAlign: 'right', color: 'var(--red)' }}>{e.haber ? money(e.haber) : '-'}</td>
                      <td style={{ padding: '12px 13px', borderBottom: '1px solid var(--line)', textAlign: 'right', fontWeight: 700 }}>{money(e.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default function FacturacionPage() {
  return (
    <Suspense fallback={null}>
      <FacturacionInner />
    </Suspense>
  );
}
