import { IVA_CONDITION_LABEL } from './mock';
import { TIPO_LABEL, type Comprobante } from './comprobantes-store';
import { pesosEnLetras } from './utils';

const BRAND = '#1B3358';

// ponytail: dirección, Ingresos Brutos e inicio de actividades siguen a completar (no confirmados aún)
export const EMISOR = {
  nombre: 'UGARTE ALAN ISMAEL (MAON - Mayorista Online)',
  direccion: 'Dirección a completar',
  localidad: 'Rosario',
  provincia: 'Santa Fe',
  cuit: '20-43005969-7',
  ivaCondition: 'Responsable Inscripto',
  ingresosBrutos: 'A completar',
  inicioActividades: 'A completar',
  tel: '',
  web: '',
  email: '',
};

const money = (n: number) => n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (rate: number) => `${(rate * 100).toFixed(1).replace(/\.0$/, '')}%`;
const fechaAR = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR');

/** Reabre el comprobante ya emitido (o uno recién creado) en una pestaña lista para imprimir/guardar como PDF. */
export function printComprobante(e: Comprobante) {
  const c = e.client;
  const razonSocial = c.businessName || `${c.firstName} ${c.lastName}`.trim() || '(sin nombre)';
  const esFiscalA = !!e.cae;
  const noValidoComoFactura = e.letra === 'R';
  // Letra A/monotributista discrimina IVA; a un consumidor final (B) el IVA va incluido
  // en el precio y solo se informa como "contenido" (Régimen de Transparencia Fiscal, Ley 27.743).
  const discriminaIva = e.letra === 'A';

  const rows = e.items.map(
    (it) => `<tr><td>${it.cantidad.toFixed(2)}</td><td>${it.detalle}</td><td style="text-align:right">${money(it.unitPrice)}</td><td style="text-align:right">${money(it.subtotal)}</td></tr>`,
  ).join('');

  const bultos = e.items.reduce((a, it) => a + it.cantidad, 0);

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${e.numero}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#111;padding:24px;font-size:12px}
      .box{max-width:780px;margin:auto;border:1px solid #000}
      .head{display:flex;border-bottom:1px solid #000}
      .head .empresa{flex:1.3;padding:10px 12px;border-right:1px solid #000}
      .logo{display:flex;align-items:center;gap:8px;margin-bottom:6px}
      .logo .mark{width:30px;height:30px;border-radius:8px;background:${BRAND};color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px}
      .logo .word{line-height:1.1}
      .logo .word b{display:block;color:${BRAND};font-size:17px;font-weight:800;letter-spacing:0.3px}
      .logo .word span{display:block;color:#666;font-size:9px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase}
      .empresa .legal{font-size:11px;color:#333;line-height:1.5}
      .head .letra{width:60px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:800;border-right:1px solid #000}
      .head .doc{flex:1;padding:10px 12px;border-right:1px solid #000}
      .doc .t{font-weight:700;font-size:14px;margin-bottom:4px}
      .head .fiscal{flex:1;padding:10px 12px;font-size:11px}
      .row{display:flex;font-size:11.5px;justify-content:space-between;margin:2px 0}
      .ivacond{display:flex;justify-content:space-between;border-bottom:1px solid #000;padding:6px 12px;font-size:11.5px;font-weight:700}
      .clientes{border-bottom:1px solid #000;padding:9px 12px;font-size:11.5px;line-height:1.7}
      .clientes b{display:inline-block;min-width:100px}
      .cond{display:flex;border-bottom:1px solid #000;font-size:11.5px}
      .cond>div{flex:1;padding:8px 12px}
      .cond>div:first-child{border-right:1px solid #000}
      .cond .line{display:flex;justify-content:space-between;margin:2px 0}
      table{width:100%;border-collapse:collapse;font-size:11.5px}
      th{text-align:left;background:#e9e9e9;padding:6px 12px;border-bottom:1px solid #000}
      td{padding:5px 12px;border-bottom:1px solid #eee}
      .foot{display:flex;border-top:1px solid #000}
      .foot .bultos{flex:1;padding:10px 12px;border-right:1px solid #000;font-size:11.5px}
      .foot .sum{width:240px;padding:10px 12px}
      .sum .r2{display:flex;justify-content:space-between;font-size:11.5px;margin:3px 0}
      .sum .tot{display:flex;justify-content:space-between;font-weight:800;font-size:16px;border-top:1px solid #000;margin-top:6px;padding-top:6px}
      .sum .nota{margin-top:8px;font-size:10.5px;color:#555;border-top:1px dashed #999;padding-top:6px}
      .letras{padding:8px 12px;border-top:1px solid #000;font-size:11px;font-style:italic}
      .cae{display:flex;border-top:1px solid #000}
      .cae .qr{width:100px;height:100px;margin:10px;border:1px solid #999;display:flex;align-items:center;justify-content:center;font-size:9px;color:#999;text-align:center}
      .cae .info{flex:1;padding:10px 0;font-size:11px;display:flex;flex-direction:column;justify-content:center}
      .cae .nro{text-align:right;padding:10px 12px;font-size:11px}
      .btn{background:${BRAND};color:#fff;border:none;border-radius:6px;padding:10px 16px;cursor:pointer;font-weight:600;margin-top:14px}
      @media print{.btn{display:none}}
    </style></head><body>
    <div class="box">
      <div class="head">
        <div class="empresa">
          <div class="logo">
            <div class="mark">M</div>
            <div class="word"><b>MAON</b><span>Mayorista Online</span></div>
          </div>
          <div class="legal">
            ${EMISOR.nombre}<br/>
            ${EMISOR.direccion}<br/>
            ${EMISOR.localidad} - ${EMISOR.provincia}<br/>
            ${EMISOR.tel ? `Tel: ${EMISOR.tel}<br/>` : ''}
            ${EMISOR.web ? `${EMISOR.web}<br/>` : ''}
          </div>
        </div>
        <div class="letra">${e.letra}</div>
        <div class="doc">
          <div class="t">${TIPO_LABEL[e.tipo]}</div>
          <div class="row"><span>Nro.</span><b>${e.numero}</b></div>
          <div class="row"><span>Fecha:</span><b>${fechaAR(e.fecha)}</b></div>
        </div>
        <div class="fiscal">
          <div class="row"><span>CUIT:</span><b>${EMISOR.cuit}</b></div>
          <div class="row"><span>Ing. Brutos N°:</span><b>${EMISOR.ingresosBrutos}</b></div>
          <div class="row"><span>Inic. Activ.:</span><b>${EMISOR.inicioActividades}</b></div>
        </div>
      </div>
      <div class="ivacond">
        <span>I.V.A. ${EMISOR.ivaCondition.toUpperCase()}</span>
        ${noValidoComoFactura ? '<span>DOCUMENTO NO VALIDO COMO FACTURA</span>' : ''}
      </div>
      <div class="clientes">
        <div><b>Razón Social:</b> ${razonSocial}</div>
        <div><b>Domicilio:</b> ${c.address || '-'}</div>
        <div><b>Localidad:</b> ${c.city || '-'}</div>
        <div><b>Provincia:</b> ${c.province || '-'}</div>
        <div><b>Vendedor:</b> ${c.seller || '-'}</div>
        ${c.clientCode ? `<div><b>Código Cliente:</b> ${c.clientCode}</div>` : ''}
      </div>
      <div class="cond">
        <div>
          <div class="line"><span>I.V.A.:</span><b>${IVA_CONDITION_LABEL[c.ivaCondition]}</b></div>
          <div class="line"><span>Cond. de Venta:</span><b>${c.condicionVenta || 'Contado'}</b></div>
        </div>
        <div>
          <div class="line"><span>DNI/CUIT:</span><b>${c.cuit || '-'}</b></div>
          <div class="line"><span>Fecha Venc.:</span><b>${fechaAR(e.fecha)}</b></div>
        </div>
      </div>
      <table>
        <thead><tr><th style="width:70px">Cantidad</th><th>Concepto</th><th style="text-align:right;width:120px">Unitario</th><th style="text-align:right;width:120px">Importe</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div class="foot">
        <div class="bultos"><b>Bultos:</b> ${bultos.toFixed(1)} &nbsp;&nbsp; <b>Usuario:</b> ${c.seller || '-'}</div>
        <div class="sum">
          ${discriminaIva ? `
            <div class="r2"><span>Subtotal</span><span>${money(e.subtotal)}</span></div>
            ${e.ivaGroups.map((g) => `<div class="r2"><span>IVA ${pct(g.rate)}</span><span>${money(g.importe)}</span></div>`).join('')}
            <div class="tot"><span>Total${e.sign < 0 ? ' (N/C)' : ''}</span><span>$ ${money(e.total)}</span></div>
          ` : `
            <div class="tot"><span>Total${e.sign < 0 ? ' (N/C)' : ''}</span><span>$ ${money(e.total)}</span></div>
            <div class="nota">
              <i>Régimen de Transparencia Fiscal al Consumidor (Ley 27.743)</i>
              <div class="r2"><span>IVA contenido:</span><span>${money(e.iva)}</span></div>
            </div>
          `}
        </div>
      </div>
      <div class="letras">${pesosEnLetras(e.total)}</div>
      ${esFiscalA ? `
        <div class="cae">
          <div class="qr">Código QR<br/>ARCA</div>
          <div class="info">Comprobante autorizado electrónicamente</div>
          <div class="nro">
            <div><b>CAE N°:</b> ${e.cae}</div>
            <div><b>Vto. CAE:</b> ${fechaAR(e.caeVto!)}</div>
          </div>
        </div>
      ` : ''}
    </div>
    <button class="btn" onclick="window.print()">Imprimir / Guardar PDF</button>
    </body></html>`;
  const w = window.open('', '_blank');
  if (w) { w.document.write(html); w.document.close(); }
}
