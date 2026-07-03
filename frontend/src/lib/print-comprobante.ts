import { IVA_CONDITION_LABEL } from './mock';
import { TIPO_LABEL, type Comprobante } from './comprobantes-store';
import { pesosEnLetras } from './utils';

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

const money = (n: number) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const pct = (rate: number) => `${(rate * 100).toFixed(1).replace(/\.0$/, '')}%`;
const fechaAR = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-AR');

/** Reabre el comprobante ya emitido (o uno recién creado) en una pestaña lista para imprimir/guardar como PDF. */
export function printComprobante(e: Comprobante) {
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
}
