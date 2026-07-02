/**
 * Motor de respuestas predefinidas (FAQ).
 * Resuelve las consultas frecuentes SIN llamar a Claude, para reducir costos.
 * Cada intent tiene patrones (regex/keywords). Si matchea con confianza,
 * se responde con una plantilla y NO se consume IA.
 */

export type FaqIntent =
  | 'PRECIO'
  | 'STOCK'
  | 'HORARIOS'
  | 'UBICACION'
  | 'MEDIOS_PAGO'
  | 'ENVIOS'
  | 'SALUDO'
  | 'DESPEDIDA';

export interface FaqMatch {
  intent: FaqIntent;
  confidence: number; // 0–1
  reply: string;
}

interface FaqRule {
  intent: FaqIntent;
  keywords: string[];
  // Plantilla con variables {{businessName}}, {{address}}, etc.
  reply: string;
  weight?: number;
}

/** Normaliza: minúsculas, sin acentos, sin signos. */
export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[¿?¡!.,;:]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const RULES: FaqRule[] = [
  {
    intent: 'PRECIO',
    keywords: ['precio', 'cuanto sale', 'cuanto cuesta', 'cuanto vale', 'valor', 'cuanto es'],
    reply:
      '¡Hola! 😊 Los precios actualizados los tenés en nuestro catálogo. ¿Sobre qué producto querés saber el precio? Te paso el detalle al toque.',
  },
  {
    intent: 'STOCK',
    keywords: ['stock', 'hay disponible', 'tenes disponible', 'queda', 'disponibilidad', 'hay en'],
    reply:
      '¡Sí! Tenemos stock disponible 📦. Contame qué modelo y color buscás y te confirmo disponibilidad inmediata.',
  },
  {
    intent: 'HORARIOS',
    keywords: ['horario', 'a que hora', 'abren', 'atienden', 'hasta que hora', 'cuando atienden'],
    reply:
      'Atendemos de {{hours}} 🕘. Por WhatsApp respondemos durante todo ese horario. ¿En qué te ayudo?',
  },
  {
    intent: 'UBICACION',
    keywords: ['ubicacion', 'donde estan', 'direccion', 'local', 'como llego', 'donde queda'],
    reply:
      'Estamos en {{address}} 📍. También hacemos envíos a todo el país. ¿Querés retirar o que te lo enviemos?',
  },
  {
    intent: 'MEDIOS_PAGO',
    keywords: ['pago', 'transferencia', 'efectivo', 'tarjeta', 'mercado pago', 'mercadopago', 'como pago', 'cuotas'],
    reply:
      'Aceptamos 💳 transferencia, Mercado Pago, débito/crédito y efectivo. ¿Cómo te queda más cómodo abonar?',
  },
  {
    intent: 'ENVIOS',
    keywords: ['envio', 'envian', 'mandan', 'correo', 'andreani', 'oca', 'cadeteria', 'a domicilio', 'demora el envio'],
    reply:
      'Hacemos envíos a todo el país 🚚 por correo y cadetería en la zona. El costo depende de tu ubicación. ¿A qué ciudad/provincia sería?',
  },
  {
    intent: 'SALUDO',
    keywords: ['hola', 'buenas', 'buen dia', 'buenas tardes', 'buenas noches', 'que tal'],
    reply:
      '¡Hola! 👋 Gracias por escribirnos. ¿Qué producto estás buscando? Te ayudo a encontrar lo que necesitás.',
    weight: 0.6,
  },
  {
    intent: 'DESPEDIDA',
    keywords: ['gracias', 'muchas gracias', 'chau', 'saludos', 'hasta luego', 'genial gracias'],
    reply:
      '¡Gracias a vos! 🙌 Cualquier cosa quedamos a disposición. ¡Que tengas un gran día!',
    weight: 0.6,
  },
];

/**
 * Intenta resolver un mensaje con una respuesta predefinida.
 * Devuelve null si ninguna regla supera el umbral (entonces se usa IA).
 */
export function matchFaq(
  rawText: string,
  vars: Record<string, string> = {},
): FaqMatch | null {
  const text = normalize(rawText);
  if (!text) return null;

  // Si el mensaje es largo y tiene muchas preguntas, mejor IA.
  const questionMarks = (rawText.match(/\?/g) || []).length;
  if (questionMarks >= 2 || text.split(' ').length > 25) return null;

  let best: { rule: FaqRule; score: number } | null = null;

  for (const rule of RULES) {
    let hits = 0;
    for (const kw of rule.keywords) {
      if (text.includes(kw)) hits++;
    }
    if (hits === 0) continue;
    const base = (rule.weight ?? 1) * Math.min(1, 0.6 + hits * 0.25);
    if (!best || base > best.score) best = { rule, score: base };
  }

  if (!best || best.score < 0.7) return null;

  return {
    intent: best.rule.intent,
    confidence: Number(best.score.toFixed(2)),
    reply: interpolate(best.rule.reply, vars),
  };
}

function interpolate(template: string, vars: Record<string, string>): string {
  const defaults: Record<string, string> = {
    hours: 'lunes a sábado de 9 a 19 hs',
    address: 'Av. Pellegrini 1234, Rosario, Santa Fe',
    businessName: 'la tienda',
  };
  const merged = { ...defaults, ...vars };
  return template.replace(/\{\{(\w+)\}\}/g, (_, k) => merged[k] ?? '');
}

/**
 * Heurística: ¿este mensaje necesita IA?
 * (negociación, mayoristas, ambigüedad, múltiples preguntas, queja).
 */
export function requiresAI(rawText: string): boolean {
  const text = normalize(rawText);
  const triggers = [
    'mayorista',
    'por mayor',
    'cantidad',
    'descuento',
    'oferta',
    'mejor precio',
    'reclamo',
    'problema',
    'no funciona',
    'devolucion',
    'cambio',
    'duda',
    'comparar',
    'diferencia entre',
    'recomenda',
    'cual conviene',
  ];
  if (triggers.some((t) => text.includes(t))) return true;
  const questionMarks = (rawText.match(/\?/g) || []).length;
  return questionMarks >= 2 || text.split(' ').length > 25;
}
