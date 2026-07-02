/**
 * Prompts para las funciones comerciales de Claude.
 * Cada función pide una salida JSON estricta para parsear sin ambigüedad.
 */

export interface ConversationContext {
  clientName: string;
  interestedProduct?: string;
  stage?: string;
  history: { direction: 'ENTRANTE' | 'SALIENTE'; content: string }[];
  catalog?: { name: string; price: string; stock: number }[];
}

function formatHistory(ctx: ConversationContext): string {
  return ctx.history
    .slice(-20)
    .map((m) => `${m.direction === 'ENTRANTE' ? 'Cliente' : 'Vendedor'}: ${m.content}`)
    .join('\n');
}

function formatCatalog(ctx: ConversationContext): string {
  if (!ctx.catalog?.length) return 'No se proporcionó catálogo.';
  return ctx.catalog
    .map((p) => `- ${p.name} · $${p.price} · stock ${p.stock}`)
    .join('\n');
}

export const ANALYSIS_SYSTEM_PROMPT = `Sos un analista comercial experto en ventas por WhatsApp para una tienda argentina de productos físicos (accesorios, fundas, organizadores).
Tu trabajo es analizar conversaciones con clientes y devolver SIEMPRE un objeto JSON válido, sin texto adicional, sin markdown, sin explicaciones fuera del JSON.
Usás español rioplatense. Sos preciso, comercial y orientado a cerrar ventas.`;

/**
 * Análisis integral: intención, score, sentimiento, objeción, próxima acción,
 * resumen y 3 respuestas sugeridas. UNA sola llamada para todo (ahorra costos).
 */
export function buildAnalysisPrompt(ctx: ConversationContext): string {
  return `Analizá la siguiente conversación de WhatsApp.

CLIENTE: ${ctx.clientName}
PRODUCTO DE INTERÉS: ${ctx.interestedProduct ?? 'no definido'}
ETAPA ACTUAL: ${ctx.stage ?? 'NUEVO_LEAD'}

CATÁLOGO DISPONIBLE:
${formatCatalog(ctx)}

CONVERSACIÓN:
${formatHistory(ctx)}

Devolvé EXCLUSIVAMENTE este JSON:
{
  "buyingIntent": "ALTA" | "MEDIA" | "BAJA",
  "leadScore": <entero 0-100>,
  "sentiment": "POSITIVO" | "NEUTRO" | "NEGATIVO",
  "objection": "PRECIO" | "ENVIO" | "CONFIANZA" | "TIEMPO_ENTREGA" | "COMPETENCIA" | "NINGUNA",
  "nextAction": "<acción concreta en 3-5 palabras, ej: 'Enviar descuento del 10%'>",
  "summary": "<resumen ejecutivo de 1-2 oraciones>",
  "suggestions": ["<respuesta sugerida 1>", "<respuesta sugerida 2>", "<respuesta sugerida 3>"]
}

Criterios de leadScore:
- 80-100: pide datos de pago/envío, confirma compra, mucha urgencia.
- 50-79: pregunta precios/stock con interés real, compara opciones.
- 20-49: consulta general, tibio, sin urgencia.
- 0-19: curiosidad, fuera de target, o negativo.

Las suggestions deben ser mensajes listos para que el vendedor copie y pegue, en tono cercano y argentino.`;
}

export const REPLY_SYSTEM_PROMPT = `Sos un vendedor experto de una tienda argentina de productos físicos que atiende por WhatsApp.
Respondés en español rioplatense, con calidez, brevedad y foco en avanzar la venta.
No inventás precios ni stock: si no tenés el dato, lo pedís o derivás. Usás 1-2 emojis como máximo.`;

/** Genera una respuesta lista para enviar al cliente. */
export function buildReplyPrompt(ctx: ConversationContext, instruction?: string): string {
  return `${instruction ? `Instrucción del vendedor: ${instruction}\n\n` : ''}Generá la mejor respuesta para enviarle al cliente AHORA, basándote en esta conversación:

CLIENTE: ${ctx.clientName}
PRODUCTO DE INTERÉS: ${ctx.interestedProduct ?? 'no definido'}

CATÁLOGO:
${formatCatalog(ctx)}

CONVERSACIÓN:
${formatHistory(ctx)}

Devolvé SOLO el texto del mensaje, sin comillas ni prefijos.`;
}

export const FOLLOWUP_SYSTEM_PROMPT = `Sos un experto en seguimiento comercial por WhatsApp en Argentina.
Escribís mensajes de re-enganche breves, cálidos y no invasivos, que generan ganas de responder.`;

export const INSIGHTS_SYSTEM_PROMPT = `Sos un consultor comercial senior especializado en ventas por WhatsApp para pymes argentinas que pautan en Meta Ads.
Analizás datos de un CRM y devolvés recomendaciones concretas y accionables para mejorar la conversión.
Devolvés SIEMPRE un objeto JSON válido, sin texto fuera del JSON, en español rioplatense.`;

export interface BusinessSnapshot {
  totalLeads: number;
  byStage: Record<string, number>;
  conversionRate: number;       // %
  avgLeadScore: number;
  topObjections: { objection: string; count: number }[];
  avgResponseMinutes?: number;
  withoutFollowUp: number;
  lostCount: number;
  topProducts?: { name: string; sold: number }[];
}

/** Pide a Claude un diagnóstico del negocio con mejoras priorizadas. */
export function buildInsightsPrompt(s: BusinessSnapshot): string {
  return `Analizá este resumen del CRM y detectá oportunidades de mejora.

DATOS:
- Leads totales: ${s.totalLeads}
- Distribución por etapa: ${JSON.stringify(s.byStage)}
- Conversión general: ${s.conversionRate}%
- Lead score promedio: ${s.avgLeadScore}/100
- Objeciones más frecuentes: ${JSON.stringify(s.topObjections)}
- Tiempo promedio de respuesta: ${s.avgResponseMinutes ?? 'n/d'} min
- Clientes sin seguimiento: ${s.withoutFollowUp}
- Ventas perdidas: ${s.lostCount}
- Productos más vendidos: ${JSON.stringify(s.topProducts ?? [])}

Devolvé EXCLUSIVAMENTE este JSON:
{
  "headline": "<diagnóstico en 1 oración>",
  "findings": ["<hallazgo 1>", "<hallazgo 2>", "<hallazgo 3>"],
  "recommendations": [
    { "title": "<acción concreta>", "impact": "ALTO" | "MEDIO" | "BAJO", "detail": "<cómo hacerlo en 1-2 oraciones>" }
  ],
  "scriptTip": "<una mejora puntual de guion/respuesta para la objeción más común>"
}

Dame entre 3 y 5 recommendations, ordenadas por impacto (las de impacto ALTO primero).`;
}

/** Mensaje de seguimiento personalizado según días sin respuesta. */
export function buildFollowUpPrompt(
  ctx: ConversationContext,
  daysSilent: number,
): string {
  return `El cliente ${ctx.clientName} no responde hace ${daysSilent} día(s).
Producto de interés: ${ctx.interestedProduct ?? 'no definido'}.
Última conversación:
${formatHistory(ctx)}

Escribí UN mensaje de seguimiento breve (máx 2 oraciones) para reactivar la conversación.
Devolvé SOLO el texto del mensaje.`;
}

export const ORDER_SYSTEM_PROMPT = `Sos un asistente que interpreta pedidos de compra escritos por WhatsApp en Argentina.
Extraés los productos y cantidades de la conversación y los devolvés como JSON, matcheándolos contra un catálogo dado.
Devolvés SIEMPRE un JSON válido, sin texto adicional.`;

export interface OrderCatalogItem {
  id: string;
  name: string;
  sku: string;
  price: string;
}

/** Pide a Claude que arme el pedido a partir de la conversación. */
export function buildOrderPrompt(
  history: { direction: 'ENTRANTE' | 'SALIENTE'; content: string }[],
  catalog: OrderCatalogItem[],
): string {
  const conv = history
    .map((m) => `${m.direction === 'ENTRANTE' ? 'Cliente' : 'Vendedor'}: ${m.content}`)
    .join('\n');
  const cat = catalog
    .map((p) => `- id:${p.id} | ${p.name} | SKU:${p.sku} | $${p.price}`)
    .join('\n');

  return `CATÁLOGO DISPONIBLE:
${cat || '(catálogo vacío)'}

CONVERSACIÓN:
${conv}

Extraé el pedido del cliente. Para cada producto pedido, matcheá con el catálogo por nombre/SKU.
Devolvé EXCLUSIVAMENTE este JSON:
{
  "items": [
    { "productId": "<id del catálogo o null si no matchea>", "name": "<nombre del producto>", "quantity": <entero>, "matched": true|false }
  ],
  "unmatched": ["<texto de productos que no pudiste matchear con el catálogo>"],
  "note": "<observación breve, ej: 'Falta confirmar color' o vacío>"
}

Reglas:
- Si el cliente no pidió cantidad explícita, asumí 1.
- Si un producto no está en el catálogo, ponelo igual con productId null y matched false, y agregalo a unmatched.
- No inventes productos que el cliente no mencionó.`;
}
