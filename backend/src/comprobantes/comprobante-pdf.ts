import PDFDocument from 'pdfkit';
import type { Comprobante, ComprobanteItem, Client } from '@prisma/client';

// Mismos datos fijos del emisor que usa el PDF que se imprime desde el navegador
// (frontend/src/lib/print-comprobante.ts) — hay que mantenerlos iguales a mano.
const EMISOR = {
  nombre: 'UGARTE ALAN ISMAEL (MAON - Mayorista Online)',
  cuit: '20-43005969-7',
  localidad: 'Rosario',
  provincia: 'Santa Fe',
};

const TIPO_LABEL: Record<string, string> = {
  FACTURA: 'Factura',
  REMITO: 'Remito',
  NOTA_CREDITO: 'Nota de Crédito',
  NOTA_CREDITO_REMITO: 'Nota de Crédito / Remito',
};

const money = (n: number) => '$' + n.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fechaAR = (d: Date) => d.toLocaleDateString('es-AR');

type ComprobanteConDetalle = Comprobante & { items: ComprobanteItem[]; client: Client };

/**
 * Genera el PDF del comprobante en el backend (para adjuntarlo por WhatsApp) — versión
 * más simple que el HTML que se imprime desde el navegador (print-comprobante.ts), pero
 * con los mismos datos esenciales: no hace falta que sea pixel-idéntico, solo completo y prolijo.
 */
export function buildComprobantePdf(c: ComprobanteConDetalle): Promise<Buffer> {
  const doc = new PDFDocument({ margin: 40, size: 'A4' });
  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve) => doc.on('end', () => resolve(Buffer.concat(chunks))));

  const client = c.client;
  const razonSocial = client.businessName || `${client.firstName} ${client.lastName ?? ''}`.trim();

  // Encabezado
  doc.fontSize(18).fillColor('#1B3358').text('MAON', { continued: true }).fontSize(10).fillColor('#666').text('  Mayorista Online');
  doc.moveDown(0.3);
  doc.fontSize(9).fillColor('#333').text(`${EMISOR.nombre}  ·  CUIT ${EMISOR.cuit}  ·  ${EMISOR.localidad}, ${EMISOR.provincia}`);
  doc.moveDown(1);

  doc.fontSize(14).fillColor('#000').text(`${TIPO_LABEL[c.tipo] ?? c.tipo} ${c.letra}`, { continued: true });
  doc.fontSize(11).text(`   Nro. ${c.numero}`);
  doc.fontSize(10).fillColor('#555').text(`Fecha: ${fechaAR(c.issuedAt)}`);
  if (c.letra === 'R') doc.fillColor('#a33').text('DOCUMENTO NO VÁLIDO COMO FACTURA');
  doc.moveDown(0.8);

  // Cliente
  doc.fontSize(10).fillColor('#000');
  doc.text(`Cliente: ${razonSocial || '(sin nombre)'}`);
  if (client.address) doc.text(`Domicilio: ${client.address}`);
  if (client.city) doc.text(`Localidad: ${client.city}${client.province ? ' - ' + client.province : ''}`);
  if (client.cuit) doc.text(`CUIT/DNI: ${client.cuit}`);
  doc.moveDown(0.8);

  // Tabla de items
  const colX = { cant: 40, detalle: 90, unit: 380, importe: 470 };
  const tableTop = doc.y;
  doc.fontSize(9).fillColor('#fff').rect(40, tableTop, 515, 18).fill('#1B3358');
  doc.fillColor('#fff')
    .text('Cant.', colX.cant, tableTop + 5)
    .text('Detalle', colX.detalle, tableTop + 5)
    .text('Unitario', colX.unit, tableTop + 5, { width: 80, align: 'right' })
    .text('Importe', colX.importe, tableTop + 5, { width: 80, align: 'right' });

  let y = tableTop + 22;
  doc.fillColor('#000').fontSize(9);
  for (const it of c.items) {
    doc.text(String(it.cantidad), colX.cant, y)
      .text(it.detalle, colX.detalle, y, { width: 280 })
      .text(money(Number(it.unitPrice)), colX.unit, y, { width: 80, align: 'right' })
      .text(money(Number(it.subtotal)), colX.importe, y, { width: 80, align: 'right' });
    y += 18;
  }
  doc.moveTo(40, y).lineTo(555, y).strokeColor('#ccc').stroke();
  y += 10;

  // Totales
  doc.fontSize(10);
  if (Number(c.iva) > 0) {
    doc.text(`Subtotal: ${money(Number(c.subtotal))}`, 380, y, { width: 175, align: 'right' });
    y += 15;
    doc.text(`IVA: ${money(Number(c.iva))}`, 380, y, { width: 175, align: 'right' });
    y += 15;
  }
  doc.fontSize(13).fillColor('#1B3358').text(
    `Total${c.sign < 0 ? ' (N/C)' : ''}: ${money(Number(c.total))}`,
    380, y, { width: 175, align: 'right' },
  );
  y += 25;

  if (c.cae) {
    doc.fontSize(9).fillColor('#000').text(`CAE N°: ${c.cae}`, 40, y);
    if (c.caeVto) doc.text(`Vto. CAE: ${fechaAR(c.caeVto)}`, 40, y + 13);
  }

  doc.end();
  return done;
}
