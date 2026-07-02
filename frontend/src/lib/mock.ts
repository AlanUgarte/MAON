/**
 * Datos mock para que el frontend luzca "vivo" sin depender del backend.
 * Cuando conectes la API real, reemplazá estas constantes por llamados a lib/api.
 */

export type Stage =
  | 'NUEVO_LEAD' | 'CONTACTADO' | 'INTERESADO' | 'NEGOCIANDO'
  | 'ESPERANDO_RESPUESTA' | 'VENTA_CERRADA' | 'VENTA_PERDIDA';

export type Intent = 'ALTA' | 'MEDIA' | 'BAJA';
export type Sentiment = 'POSITIVO' | 'NEUTRO' | 'NEGATIVO';

export const STAGE_LABEL: Record<Stage, string> = {
  NUEVO_LEAD: 'Nuevo lead',
  CONTACTADO: 'Contactado',
  INTERESADO: 'Interesado',
  NEGOCIANDO: 'Negociando',
  ESPERANDO_RESPUESTA: 'Esperando respuesta',
  VENTA_CERRADA: 'Venta cerrada',
  VENTA_PERDIDA: 'Venta perdida',
};

export const STAGE_COLOR: Record<Stage, string> = {
  NUEVO_LEAD: 'sky',
  CONTACTADO: 'primary',
  INTERESADO: 'amber',
  NEGOCIANDO: 'amber',
  ESPERANDO_RESPUESTA: 'muted',
  VENTA_CERRADA: 'emerald',
  VENTA_PERDIDA: 'rose',
};

export type IvaCondition = 'RESPONSABLE_INSCRIPTO' | 'MONOTRIBUTO' | 'CONSUMIDOR_FINAL' | 'EXENTO';
export const IVA_CONDITION_LABEL: Record<IvaCondition, string> = {
  RESPONSABLE_INSCRIPTO: 'Responsable Inscripto',
  MONOTRIBUTO: 'Monotributo',
  CONSUMIDOR_FINAL: 'Consumidor Final',
  EXENTO: 'Exento',
};

export interface Client {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  city: string;
  province: string;
  stage: Stage;
  product: string;
  source: 'META_ADS' | 'WHATSAPP';
  leadScore: number;
  intent: Intent;
  sentiment: Sentiment;
  tags: { name: string; color: string }[];
  lastInboundAt: string;
  unread: number;
  summary: string;
  objection: string;
  seller: string;
  // Datos fiscales (facturación)
  businessName?: string;
  cuit?: string;
  ivaCondition: IvaCondition;
  address?: string;
  postalCode?: string;
  clientCode?: string;
  condicionVenta?: string;
}

const TAGS = {
  caliente: { name: 'Cliente caliente', color: 'amber' },
  frio: { name: 'Cliente frío', color: 'sky' },
  mayorista: { name: 'Mayorista', color: 'primary' },
  minorista: { name: 'Minorista', color: 'emerald' },
  recurrente: { name: 'Recurrente', color: 'rose' },
};

const PRODUCTS = [
  'Funda iPhone 15 Pro Silicona',
  'Funda iPhone 14 Transparente',
  'Organizador de Escritorio Bambú',
  'Cargador MagSafe 15W',
  'Vidrio Templado iPhone 15',
  'Organizador de Cables Magnético',
];

const NAMES: [string, string][] = [
  ['Martín', 'Gómez'], ['Lucía', 'Fernández'], ['Joaquín', 'Pérez'], ['Camila', 'Rodríguez'],
  ['Tomás', 'López'], ['Sofía', 'Díaz'], ['Mateo', 'Martínez'], ['Valentina', 'Sánchez'],
  ['Benjamín', 'Romero'], ['Julieta', 'Torres'], ['Nicolás', 'Ruiz'], ['Catalina', 'Flores'],
];

const CITIES: [string, string][] = [
  ['Rosario', 'Santa Fe'], ['Córdoba', 'Córdoba'], ['CABA', 'Buenos Aires'],
  ['Mendoza', 'Mendoza'], ['La Plata', 'Buenos Aires'], ['Mar del Plata', 'Buenos Aires'],
];

const STAGES: Stage[] = [
  'NEGOCIANDO', 'INTERESADO', 'NUEVO_LEAD', 'VENTA_CERRADA', 'CONTACTADO',
  'ESPERANDO_RESPUESTA', 'INTERESADO', 'NEGOCIANDO', 'NUEVO_LEAD', 'VENTA_PERDIDA',
  'INTERESADO', 'CONTACTADO',
];

const SUMMARIES = [
  'Pregunta por descuento mayorista (10+ unidades). Listo para cerrar.',
  'Consultó stock y envío a su ciudad. Interés medio-alto.',
  'Recién llegó del anuncio. Pidió precio.',
  'Compró. Cliente recurrente, buena predisposición.',
  'Pidió catálogo completo. Comparando opciones.',
  'Dejó de responder hace 2 días tras pasarle el precio.',
];

const OBJECTIONS = ['PRECIO', 'ENVIO', 'NINGUNA', 'CONFIANZA', 'TIEMPO_ENTREGA'];
const SELLERS = ['Vale Vendedora', 'Sergio Supervisor', 'Ana Administradora'];

function scoreFor(stage: Stage, i: number): number {
  switch (stage) {
    case 'VENTA_CERRADA': return 92 + (i % 6);
    case 'NEGOCIANDO': return 74 + (i % 18);
    case 'INTERESADO': return 52 + (i % 22);
    case 'ESPERANDO_RESPUESTA': return 44 + (i % 16);
    case 'CONTACTADO': return 36 + (i % 18);
    case 'VENTA_PERDIDA': return 12 + (i % 14);
    default: return 24 + (i % 22);
  }
}

const IVA_CONDITIONS: IvaCondition[] = ['RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'CONSUMIDOR_FINAL', 'RESPONSABLE_INSCRIPTO'];
const STREETS = ['Florida 300', 'San Martín 158', 'Simón Bolívar 2212', 'Roullón 3323', 'Corrientes 1450', 'Mitre 890', 'Belgrano 210', 'Urquiza 1120', 'Sarmiento 675', 'Rivadavia 940', 'Pellegrini 305', 'Alvear 512'];

export const CLIENTS: Client[] = NAMES.map(([firstName, lastName], i) => {
  const stage = STAGES[i];
  const [city, province] = CITIES[i % CITIES.length];
  const score = Math.min(100, scoreFor(stage, i));
  const intent: Intent = score >= 70 ? 'ALTA' : score >= 45 ? 'MEDIA' : 'BAJA';
  const tagPool = Object.values(TAGS);
  return {
    id: `c_${i + 1}`,
    firstName, lastName,
    phone: `+54 9 341 5${String(100000 + i * 137).slice(-6)}`,
    city, province,
    stage,
    product: PRODUCTS[i % PRODUCTS.length],
    source: i % 3 === 0 ? 'META_ADS' : 'WHATSAPP',
    leadScore: score,
    intent,
    sentiment: score >= 60 ? 'POSITIVO' : score >= 35 ? 'NEUTRO' : 'NEGATIVO',
    tags: [tagPool[i % tagPool.length]],
    lastInboundAt: new Date(Date.now() - (i + 1) * 3.5 * 3600_000).toISOString(),
    unread: i % 3 === 0 ? (i % 4) + 1 : 0,
    summary: SUMMARIES[i % SUMMARIES.length],
    objection: OBJECTIONS[i % OBJECTIONS.length],
    seller: SELLERS[i % SELLERS.length],
    // Datos fiscales
    ivaCondition: IVA_CONDITIONS[i % IVA_CONDITIONS.length],
    cuit: `20${String(30000000 + i * 137931).slice(0, 8)}${(i % 9) + 1}`,
    address: STREETS[i % STREETS.length],
    postalCode: String(1000 + i * 137).slice(0, 4),
    clientCode: `C${String(29000 + i * 113).padStart(6, '0')}`,
    condicionVenta: 'Contado',
  };
});

export interface ChatMessage {
  id: string;
  direction: 'ENTRANTE' | 'SALIENTE';
  author: 'CLIENTE' | 'VENDEDOR' | 'AUTOMATIZACION' | 'IA';
  content: string;
  at: string;
  type?: 'TEXTO' | 'IMAGEN' | 'VIDEO' | 'DOCUMENTO';
  mediaUrl?: string;
}

export function mockThread(client: Client): ChatMessage[] {
  const base = Date.now() - 4 * 3600_000;
  const m = (min: number) => new Date(base + min * 60_000).toISOString();
  return [
    { id: 'm1', direction: 'ENTRANTE', author: 'CLIENTE', content: `Hola! Vi el anuncio de ${client.product} 👀`, at: m(0) },
    { id: 'm2', direction: 'SALIENTE', author: 'AUTOMATIZACION', content: '¡Hola! 👋 Gracias por escribirnos. ¿Qué estás buscando?', at: m(1) },
    { id: 'm3', direction: 'ENTRANTE', author: 'CLIENTE', content: '¿Cuánto sale? ¿Tenés stock?', at: m(35) },
    { id: 'm4', direction: 'SALIENTE', author: 'VENDEDOR', content: '¡Sí! Tenemos stock 📦. ¿Te lo reservo?', at: m(42) },
    { id: 'm5', direction: 'ENTRANTE', author: 'CLIENTE', content: client.objection === 'PRECIO' ? '¿No tenés algo más económico? Estoy comparando 🤔' : '¿Hacés envíos a mi ciudad?', at: m(120) },
  ];
}

export const KPIS = {
  leadsToday: 14,
  leadsWeek: 86,
  leadsMonth: 342,
  salesToday: 184900,
  salesTodayCount: 9,
  salesMonth: 4218500,
  salesMonthCount: 187,
  conversion: 24.6,
  avgTicket: 22560,
  pendingLeads: 58,
  withoutFollowUp: 12,
};

export const PIPELINE = [
  { stage: 'NUEVO_LEAD', label: 'Nuevo lead', count: 42 },
  { stage: 'CONTACTADO', label: 'Contactado', count: 31 },
  { stage: 'INTERESADO', label: 'Interesado', count: 28 },
  { stage: 'NEGOCIANDO', label: 'Negociando', count: 17 },
  { stage: 'ESPERANDO_RESPUESTA', label: 'Esperando', count: 23 },
  { stage: 'VENTA_CERRADA', label: 'Cerrada', count: 19 },
  { stage: 'VENTA_PERDIDA', label: 'Perdida', count: 8 },
];

function days(n: number) {
  const out: { date: string; label: string; leads: number; sales: number }[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86_400_000);
    const wd = d.getDay();
    const weekend = wd === 0 || wd === 6;
    out.push({
      date: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }),
      leads: Math.round((weekend ? 6 : 14) + Math.sin(i / 2) * 5 + (i % 4) * 2),
      sales: Math.round((weekend ? 2 : 6) + Math.cos(i / 3) * 3 + (i % 3)),
    });
  }
  return out;
}
export const SERIES = days(14);

export const SALES_BY_PRODUCT = [
  { product: 'Funda iPhone 15 Pro', quantity: 64 },
  { product: 'Vidrio Templado', quantity: 58 },
  { product: 'Cargador MagSafe', quantity: 41 },
  { product: 'Organizador Bambú', quantity: 29 },
  { product: 'Funda iPhone 14', quantity: 24 },
];

export const CAMPAIGN_CONVERSION = [
  { campaign: 'Fundas iPhone - Verano', leads: 142, sales: 38, conversion: 26.8 },
  { campaign: 'Organizadores - Hogar', leads: 98, sales: 19, conversion: 19.4 },
  { campaign: 'Accesorios - Retargeting', leads: 64, sales: 21, conversion: 32.8 },
];

export interface ProductRow {
  id: string; name: string; sku: string; category: string;
  brand: string; units: number; img: string; price: number; stock: number; active: boolean;
}
export const PRODUCT_ROWS: ProductRow[] = [
  { id: 'p1', name: "FANTOCHE ALF.TRIPLE NEGRO 24*85 GR.", sku: "TOP1", category: "Alfajores", brand: "FANTOCHE", units: 24, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090240670.jpg", price: 16527.9, stock: 0, active: true },
  { id: 'p2', name: "GUAYMALLEN ALFAJOR TRIPLE CHOCOLATE *24 UN.", sku: "TOP2", category: "Alfajores", brand: "GUAYMALLEN", units: 24, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090240061.jpg", price: 9868.81, stock: 0, active: true },
  { id: 'p3', name: "GUAYMALLEN ALFAJOR TRIPLE BLANCO *24 UN.", sku: "TOP3", category: "Alfajores", brand: "GUAYMALLEN", units: 24, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090240063.jpg", price: 9868.81, stock: 0, active: true },
  { id: 'p4', name: "LIA MEDIATARDE CRACKERS 14*315 GR.", sku: "TOP4", category: "Galletitas", brand: "LIA", units: 14, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010140593.jpg", price: 16787.43, stock: 0, active: true },
  { id: 'p5', name: "FANTOCHE ALF.TRIPLE BLANCO 24*85 GR.", sku: "TOP5", category: "Alfajores", brand: "FANTOCHE", units: 24, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090240102.jpg", price: 16527.9, stock: 0, active: true },
  { id: 'p6', name: "9 DE ORO BIZC.CLASICOS 24*200 GR.", sku: "TOP6", category: "Galletitas", brand: "9 DE ORO", units: 24, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010240407.jpg", price: 24885.96, stock: 0, active: true },
  { id: 'p7', name: "RIERA TOSTADA CLASICA LIBRE DE SELLO 18*200 GR", sku: "TOP7", category: "Galletitas", brand: "RIERA", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090180011.jpg", price: 18520.71, stock: 0, active: true },
  { id: 'p8', name: "GUAYMALLEN ALFAJOR SIMPLE CHOCOLATE 40*38 GR.", sku: "TOP8", category: "Alfajores", brand: "GUAYMALLEN", units: 40, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090400237.jpg", price: 9868.81, stock: 0, active: true },
  { id: 'p9', name: "9 DE ORO BIZC.AGRIDULCE 20*200 GR.", sku: "TOP9", category: "Galletitas", brand: "9 DE ORO", units: 20, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010200380.jpg", price: 20738.32, stock: 0, active: true },
  { id: 'p10', name: "FANTOCHE GALL.TAPITA *3.5 KG.", sku: "TOP10", category: "Galletitas", brand: "FANTOCHE", units: 1, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010010679.jpg", price: 14451.01, stock: 0, active: true },
  { id: 'p11', name: "TRIO TRICHOC 12*300 GR.", sku: "TOP11", category: "Galletitas", brand: "TRIO", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120021.jpg", price: 13632.33, stock: 0, active: true },
  { id: 'p12', name: "MISKY TURRON DE MANI 4*50*25 GR.", sku: "TOP12", category: "Golosinas", brand: "MISKY", units: 4, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1060040012.jpg", price: 30254.46, stock: 0, active: true },
  { id: 'p13', name: "GUAYMALLEN ALFAJOR SIMPLE BLANCO 40*38 GR.", sku: "TOP13", category: "Alfajores", brand: "GUAYMALLEN", units: 40, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090400236.jpg", price: 9868.81, stock: 0, active: true },
  { id: 'p14', name: "TRIO PEPAS 10*500 GR.", sku: "TOP14", category: "Galletitas", brand: "TRIO", units: 10, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010100023.jpg", price: 16227.47, stock: 0, active: true },
  { id: 'p15', name: "MISKY GOMA FANTASIA 6*1 KG", sku: "TOP15", category: "Golosinas", brand: "MISKY", units: 6, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1060060756.jpg", price: 39605.76, stock: 0, active: true },
  { id: 'p16', name: "TEREPIN PEPAS CASERITAS 14*400 GR.", sku: "TOP16", category: "Galletitas", brand: "TEREPIN", units: 14, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010140176.jpg", price: 16994.47, stock: 0, active: true },
  { id: 'p17', name: "NEVARES ALF.FULBITO MANI 40*30 GR.", sku: "TOP17", category: "Alfajores", brand: "NEVARES", units: 40, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090400271.jpg", price: 6095.69, stock: 0, active: true },
  { id: 'p18', name: "PASEO CINCO SEMILLAS 14*300 GR.", sku: "TOP18", category: "Golosinas", brand: "PASEO", units: 14, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010140387.jpg", price: 20721.63, stock: 0, active: true },
  { id: 'p19', name: "TRIO PEPAS 12*320 GR.", sku: "TOP19", category: "Galletitas", brand: "TRIO", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120028.jpg", price: 12461.69, stock: 0, active: true },
  { id: 'p20', name: "TRIO CHOCOTRIO 12*300 GR.", sku: "TOP20", category: "Galletitas", brand: "TRIO", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120022.jpg", price: 18352.68, stock: 0, active: true },
  { id: 'p21', name: "LIA MEDIATARDE SANDWICH 16*3*107 GR.", sku: "TOP21", category: "Galletitas", brand: "LIA", units: 16, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010160833.jpg", price: 18983.06, stock: 0, active: true },
  { id: 'p22', name: "NEVARES TURRON DE MANI *50 UNID.", sku: "TOP22", category: "Golosinas", brand: "NEVARES", units: 50, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1060500065.jpg", price: 9968.1, stock: 0, active: true },
  { id: 'p23', name: "SOLITAS ANIMACION CON CONFITES 10*400 GR.", sku: "TOP23", category: "Golosinas", brand: "SOLITAS", units: 10, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010100340.jpg", price: 14242.14, stock: 0, active: true },
  { id: 'p24', name: "MISKY GOMA JELLY ROLL 6*1 KG", sku: "TOP24", category: "Golosinas", brand: "MISKY", units: 6, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1060060055.jpg", price: 39605.76, stock: 0, active: true },
  { id: 'p25', name: "RASTA ALFAJOR NEGRO *18 UNID.", sku: "TOP25", category: "Alfajores", brand: "RASTA", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090180005.jpg", price: 18682.4, stock: 0, active: true },
  { id: 'p26', name: "TEREPIN PEPAS MEMBRILLO 12*500 GR.", sku: "TOP26", category: "Galletitas", brand: "TEREPIN", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120181.jpg", price: 17968.5, stock: 0, active: true },
  { id: 'p27', name: "9 DE ORO BIZC.AZUCARADOS 28*210 GR.", sku: "TOP27", category: "Galletitas", brand: "9 DE ORO", units: 28, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010280410.jpg", price: 29033.66, stock: 0, active: true },
  { id: 'p28', name: "TRIO PEPAS ALEMANAS 12*300 GR.", sku: "TOP28", category: "Galletitas", brand: "TRIO", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120010.jpg", price: 13632.33, stock: 0, active: true },
  { id: 'p29', name: "MISKY MASTICABLE SURTIDO 10*800 GR", sku: "TOP29", category: "Golosinas", brand: "MISKY", units: 10, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1060100056.jpg", price: 55043.63, stock: 0, active: true },
  { id: 'p30', name: "TRIO GLASY 12*300 GR.", sku: "TOP30", category: "Golosinas", brand: "TRIO", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120030.jpg", price: 13632.33, stock: 0, active: true },
  { id: 'p31', name: "SWEET VAINILLAS 18*180 GR.", sku: "TOP31", category: "Galletitas", brand: "MASSARINI", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010180814.jpg", price: 19552.93, stock: 0, active: true },
  { id: 'p32', name: "PRUEBA 1806", sku: "TOP32", category: "Golosinas", brand: "FANTOCHE", units: 24, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090240104.jpg", price: 16527.9, stock: 0, active: true },
  { id: 'p33', name: "CELOSAS BAÑADAS 10*350 GR", sku: "TOP33", category: "Golosinas", brand: "CELOSAS", units: 10, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010100321.jpg", price: 17390.6, stock: 0, active: true },
  { id: 'p34', name: "SOLITAS ALFAJORCITO C/CHOCOLATE 14*300 GR.", sku: "TOP34", category: "Alfajores", brand: "SOLITAS", units: 14, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010140325.jpg", price: 37359.56, stock: 0, active: true },
  { id: 'p35', name: "RONDA TRIANGULITOS 18*150 GR.", sku: "TOP35", category: "Golosinas", brand: "HOJALMAR", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010180855.jpg", price: 21207.79, stock: 0, active: true },
  { id: 'p36', name: "DON SATUR BIZCOCHOS DE GRASA 30*200 GR.", sku: "TOP36", category: "Galletitas", brand: "DON SATUR", units: 30, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010300446.jpg", price: 32798.15, stock: 0, active: true },
  { id: 'p37', name: "NOGALI SANDWICH FAMILIAR 18*300 GR.", sku: "TOP37", category: "Galletitas", brand: "NOGALI", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010180494.jpg", price: 13966.43, stock: 0, active: true },
  { id: 'p38', name: "LIA VOCACION CLASICA 36*141 GR.", sku: "TOP38", category: "Golosinas", brand: "LIA", units: 36, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010360571.jpg", price: 23039.97, stock: 0, active: true },
  { id: 'p39', name: "FANTOCHE GALL.MARMOLADA 12*350 GR.", sku: "TOP39", category: "Galletitas", brand: "FANTOCHE", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120553.jpg", price: 16117.49, stock: 0, active: true },
  { id: 'p40', name: "FANTOCHE ALFAJOR SUPER TRIPLE 12*100 GR.", sku: "TOP40", category: "Alfajores", brand: "FANTOCHE", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090122564.jpg", price: 10008.91, stock: 0, active: true },
  { id: 'p41', name: "TRIO TRICHOC 10*500 GR.", sku: "TOP41", category: "Galletitas", brand: "TRIO", units: 10, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010100009.jpg", price: 17507.2, stock: 0, active: true },
  { id: 'p42', name: "FANTOCHE GALL.YAYITA C/CHIPS 12*275 GR.", sku: "TOP42", category: "Galletitas", brand: "FANTOCHE", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120806.jpg", price: 16843.27, stock: 0, active: true },
  { id: 'p43', name: "NEVARES ALF.MOGY NEGRO 40*38 GR.", sku: "TOP43", category: "Alfajores", brand: "NEVARES", units: 40, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090400027.jpg", price: 10208.77, stock: 0, active: true },
  { id: 'p44', name: "9 DE ORO COOKIES CHIPS 16*120 GR.", sku: "TOP44", category: "Galletitas", brand: "9 DE ORO", units: 16, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010160402.jpg", price: 10385.15, stock: 0, active: true },
  { id: 'p45', name: "PAR-NOR MOROCHITAS *4.5 KG.", sku: "TOP45", category: "Golosinas", brand: "PARNOR", units: 1, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010010080.jpg", price: 26261.21, stock: 0, active: true },
  { id: 'p46', name: "FANTOCHE ALFAJOR TRIPLE RED VELVET 12*100 GR.", sku: "TOP46", category: "Alfajores", brand: "FANTOCHE", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090122563.jpg", price: 10008.91, stock: 0, active: true },
  { id: 'p47', name: "LEIVA TOSTADAS ARROZ C/SAL 12*150 GR.", sku: "TOP47", category: "Galletitas", brand: "LEIVA", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120356.jpg", price: 11798.98, stock: 0, active: true },
  { id: 'p48', name: "FANTOCHE ALFAJOR PESCADO RAUL SIMPLE NEGRO 12*50 GR.", sku: "TOP48", category: "Alfajores", brand: "FANTOCHE", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090122561.jpg", price: 6974.69, stock: 0, active: true },
  { id: 'p49', name: "RIERA TOSTADA LIGHT LIBRE DE SELLO 18*200 GR", sku: "TOP49", category: "Galletitas", brand: "RIERA", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090180010.jpg", price: 21375.1, stock: 0, active: true },
  { id: 'p50', name: "FANTOCHE GALL.HOROSCOPO 12*300 GR.", sku: "TOP50", category: "Galletitas", brand: "FANTOCHE", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120277.jpg", price: 16843.27, stock: 0, active: true },
  { id: 'p51', name: "LIA SURTIDO 21*400 GR.", sku: "TOP51", category: "Golosinas", brand: "LIA", units: 21, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010210792.jpg", price: 30695.59, stock: 0, active: true },
  { id: 'p52', name: "FANTOCHE ALFAJOR PESCADO RAUL SIMPLE BLANCO 12*50 GR.", sku: "TOP52", category: "Alfajores", brand: "FANTOCHE", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090122562.jpg", price: 6974.69, stock: 0, active: true },
  { id: 'p53', name: "TRIO GLASY 10*500 GR.", sku: "TOP53", category: "Golosinas", brand: "TRIO", units: 10, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010100014.jpg", price: 16227.47, stock: 0, active: true },
  { id: 'p54', name: "NEVARES ALF.MOGY BLANCO 40*38 GR.", sku: "TOP54", category: "Alfajores", brand: "NEVARES", units: 40, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090400028.jpg", price: 10208.77, stock: 0, active: true },
  { id: 'p55', name: "PASEO CRACKERS 14*300 GR", sku: "TOP55", category: "Galletitas", brand: "PASEO", units: 14, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010140544.jpg", price: 16689.88, stock: 0, active: true },
  { id: 'p56', name: "RIERA TOSTADA INTEGRAL LIBRES DE SELLOS 18*200 GR", sku: "TOP56", category: "Galletitas", brand: "RIERA", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090180020.jpg", price: 18520.71, stock: 0, active: true },
  { id: 'p57', name: "9 DE ORO COOKIES CHIPS COLORES 16*120 GR.", sku: "TOP57", category: "Galletitas", brand: "9 DE ORO", units: 16, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010160404.jpg", price: 10385.15, stock: 0, active: true },
  { id: 'p58', name: "FANTOCHE ALFAJOR TRIPLE NIGHT 12*85 GR.", sku: "TOP58", category: "Alfajores", brand: "FANTOCHE", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090120097.jpg", price: 8981.32, stock: 0, active: true },
  { id: 'p59', name: "TRIO FROLITAS MEMBRILLO 12*300 GR.", sku: "TOP59", category: "Golosinas", brand: "TRIO", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120007.jpg", price: 13632.33, stock: 0, active: true },
  { id: 'p60', name: "SOLITAS PURITOS BAÑADOS CHOCOLATE 14*300 GR.", sku: "TOP60", category: "Golosinas", brand: "SOLITAS", units: 14, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010140339.jpg", price: 25535.88, stock: 0, active: true },
  { id: 'p61', name: "GUAYMALLEN ALFAJOR TRIPLE FRUTA *24 UN.", sku: "TOP61", category: "Alfajores", brand: "GUAYMALLEN", units: 24, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090240145.jpg", price: 9868.81, stock: 0, active: true },
  { id: 'p62', name: "MISKY GOMA EUCALIPTO 6*1 KG", sku: "TOP62", category: "Golosinas", brand: "MISKY", units: 6, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1060060758.jpg", price: 39605.76, stock: 0, active: true },
  { id: 'p63', name: "FANTOCHE GALL.TAPITA (BANDEJA) 12*350 GR.", sku: "TOP63", category: "Galletitas", brand: "FANTOCHE", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120524.jpg", price: 17449.75, stock: 0, active: true },
  { id: 'p64', name: "LIA VOCACION CLASICA 12*3*128 GR.", sku: "TOP64", category: "Golosinas", brand: "LIA", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010122446.jpg", price: 19200.06, stock: 0, active: true },
  { id: 'p65', name: "TERRABUSI OREO C/CACAO 36*118 GR.", sku: "TOP65", category: "Golosinas", brand: "OREO", units: 36, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010360578.jpg", price: 56511.96, stock: 0, active: true },
  { id: 'p66', name: "SOLITAS ALFAJORCITO C/CHOCOLATE 25*160 GR.", sku: "TOP66", category: "Alfajores", brand: "SOLITAS", units: 25, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010250326.jpg", price: 37621.44, stock: 0, active: true },
  { id: 'p67', name: "FANTOCHE ALFAJOR TRIPLE DAY 12*85 GR.", sku: "TOP67", category: "Alfajores", brand: "FANTOCHE", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090120098.jpg", price: 8981.32, stock: 0, active: true },
  { id: 'p68', name: "LIA POLVORITA GALL.CHOCOLATE/VAINILLA 40*81 GR.", sku: "TOP68", category: "Galletitas", brand: "LIA", units: 40, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010400004.jpg", price: 17919.81, stock: 0, active: true },
  { id: 'p69', name: "PASEO SALVADO 14*300 GR.", sku: "TOP69", category: "Golosinas", brand: "PASEO", units: 14, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010140389.jpg", price: 20721.63, stock: 0, active: true },
  { id: 'p70', name: "RIERA PAN RALLADO LIBRES DE SELLOS 12*500 GR.", sku: "TOP70", category: "Golosinas", brand: "RIERA", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090122532.jpg", price: 8661.18, stock: 0, active: true },
  { id: 'p71', name: "RIERA TOSTADA SIN SAL LIBRES DE SELLOS 18*200 GR", sku: "TOP71", category: "Galletitas", brand: "RIERA", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090180013.jpg", price: 18520.71, stock: 0, active: true },
  { id: 'p72', name: "PAR-NOR PITUSAS RELLENA CHOCOLATE 30*160 GR.", sku: "TOP72", category: "Golosinas", brand: "PARNOR", units: 30, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010300078.jpg", price: 25802.5, stock: 0, active: true },
  { id: 'p73', name: "TRIO OSKITO 12*300 GR.", sku: "TOP73", category: "Golosinas", brand: "TRIO", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120024.jpg", price: 18352.68, stock: 0, active: true },
  { id: 'p74', name: "FANTOCHE ALFAJOR MINI NEGRO 24*150 GR.", sku: "TOP74", category: "Alfajores", brand: "FANTOCHE", units: 24, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090240194.jpg", price: 36883.56, stock: 0, active: true },
  { id: 'p75', name: "TRIO PEPAS ALEMANAS 10*500 GR.", sku: "TOP75", category: "Galletitas", brand: "TRIO", units: 10, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010100011.jpg", price: 17507.2, stock: 0, active: true },
  { id: 'p76', name: "BAGLEY GALLETITAS SURTIDAS 21*400 GR.", sku: "TOP76", category: "Galletitas", brand: "BAGLEY", units: 21, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010210813.jpg", price: 52818.73, stock: 0, active: true },
  { id: 'p77', name: "RASTA ALFAJOR BLANCO *18 UNID.", sku: "TOP77", category: "Alfajores", brand: "RASTA", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090180004.jpg", price: 18682.4, stock: 0, active: true },
  { id: 'p78', name: "PIPAS SNACK SEMILLITAS GIGANTES 12*160 GR.", sku: "TOP78", category: "Golosinas", brand: "PIPAS", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1060121165.jpg", price: 21258.73, stock: 0, active: true },
  { id: 'p79', name: "LIA VOCACION ACARAMELADA 36*145 GR.", sku: "TOP79", category: "Golosinas", brand: "LIA", units: 36, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010360715.jpg", price: 23039.97, stock: 0, active: true },
  { id: 'p80', name: "RIERA TOSTADA 100% INTEGRALES LIBRES DE SELLOS 18*200 GR", sku: "TOP80", category: "Galletitas", brand: "RIERA", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090180019.jpg", price: 23922.0, stock: 0, active: true },
  { id: 'p81', name: "PIPAS SEMILLITA GIGANTE 12*12 UNID.", sku: "TOP81", category: "Golosinas", brand: "PIPAS", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1060120610.jpg", price: 82087.37, stock: 0, active: true },
  { id: 'p82', name: "SOLITAS LEGENDARIAS 8*500 GR", sku: "TOP82", category: "Golosinas", brand: "SOLITAS", units: 8, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010080483.jpg", price: 12483.09, stock: 0, active: true },
  { id: 'p83', name: "TRIO CHOCOLATINA 12*300 GR.", sku: "TOP83", category: "Golosinas", brand: "TRIO", units: 12, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010120005.jpg", price: 18352.68, stock: 0, active: true },
  { id: 'p84', name: "RIERA TOSTADA DULCE LIBRE DE SELLO 18*200 GR", sku: "TOP84", category: "Galletitas", brand: "RIERA", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090180009.jpg", price: 18520.71, stock: 0, active: true },
  { id: 'p85', name: "LIA POLVORITA GALL.VAINILLA/FRUTILLA 40*81 GR.", sku: "TOP85", category: "Galletitas", brand: "LIA", units: 40, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010400464.jpg", price: 17919.81, stock: 0, active: true },
  { id: 'p86', name: "NEVARES TURRON FULBITO RELLENO 50*25 GR.", sku: "TOP86", category: "Golosinas", brand: "NEVARES", units: 50, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1060500064.jpg", price: 5705.59, stock: 0, active: true },
  { id: 'p87', name: "CARILO GALLETA ARROZ C/SAL 18*150 GR.", sku: "TOP87", category: "Galletitas", brand: "CARILO", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010180090.jpg", price: 27212.2, stock: 0, active: true },
  { id: 'p88', name: "SOLITAS ARITOS SURTIDOS 8*500 GR.", sku: "TOP88", category: "Golosinas", brand: "SOLITAS", units: 8, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010080338.jpg", price: 12716.39, stock: 0, active: true },
  { id: 'p89', name: "PAR-NOR PITUSAS RELLENA CHOCOLATE 16*300 GR.", sku: "TOP89", category: "Golosinas", brand: "PARNOR", units: 16, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010160071.jpg", price: 24655.72, stock: 0, active: true },
  { id: 'p90', name: "TEMFLOR CIGARRITOS *3 KG", sku: "TOP90", category: "Golosinas", brand: "TEMFLOR", units: 1, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010010345.jpg", price: 27190.68, stock: 0, active: true },
  { id: 'p91', name: "RIERA TOSTADA SEMILLAS LIBRES DE SELLOS 18*200 GR", sku: "TOP91", category: "Galletitas", brand: "RIERA", units: 18, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090180012.jpg", price: 21375.1, stock: 0, active: true },
  { id: 'p92', name: "NEVARES RAPSODIA 24*80 GR.", sku: "TOP92", category: "Golosinas", brand: "NEVARES", units: 24, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010240044.jpg", price: 14446.43, stock: 0, active: true },
  { id: 'p93', name: "ARCOR SURTIDO DIVERSION 21*400 GR.", sku: "TOP93", category: "Golosinas", brand: "ARCOR", units: 21, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010210499.jpg", price: 42825.99, stock: 0, active: true },
  { id: 'p94', name: "TURIMAR ALFAJOR TRIPLE NEGRO 24*60 GR.", sku: "TOP94", category: "Alfajores", brand: "TURIMAR", units: 24, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090240669.jpg", price: 8262.36, stock: 0, active: true },
  { id: 'p95', name: "MANJARES PALMERITA 20*200 GR.", sku: "TOP95", category: "Golosinas", brand: "MANJARES", units: 20, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010200158.jpg", price: 32597.4, stock: 0, active: true },
  { id: 'p96', name: "SOLITAS ARITOS FRUTILLA 8*500 GR.", sku: "TOP96", category: "Golosinas", brand: "SOLITAS", units: 8, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010080374.jpg", price: 12716.39, stock: 0, active: true },
  { id: 'p97', name: "PAR-NOR PITUSAS RELLENA FRUTILLA 16*300 GR.", sku: "TOP97", category: "Golosinas", brand: "PARNOR", units: 16, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010160085.jpg", price: 24655.72, stock: 0, active: true },
  { id: 'p98', name: "TURIMAR GALL.C/CHIPS CHOCOLATE 16*400 GR.", sku: "TOP98", category: "Galletitas", brand: "TURIMAR", units: 16, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010160498.jpg", price: 31582.89, stock: 0, active: true },
  { id: 'p99', name: "MANTECOL ALF.TRIPLE RELLENO C/PASTA MANTECOL 20*60 GR.", sku: "TOP99", category: "Alfajores", brand: "MANTECOL", units: 20, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1090200386.jpg", price: 19994.04, stock: 0, active: true },
  { id: 'p100', name: "SWEET VAINILLAS 14*225 GR.", sku: "TOP100", category: "Galletitas", brand: "MASSARINI", units: 14, img: "https://www.tyna.com.ar/archivos/imagenes_productos/1010140124.jpg", price: 19076.99, stock: 0, active: true },
];

export interface CampaignRow {
  id: string; name: string; status: string;
  recipients: number; sent: number; delivered: number; read: number; replied: number;
  date: string;
}
export const CAMPAIGN_ROWS: CampaignRow[] = [
  { id: 'ca1', name: 'Promo Fundas iPhone -20%', status: 'COMPLETADA', recipients: 142, sent: 142, delivered: 139, read: 98, replied: 41, date: '2026-06-15' },
  { id: 'ca2', name: 'Reactivación inactivos 30d', status: 'COMPLETADA', recipients: 210, sent: 210, delivered: 201, read: 120, replied: 33, date: '2026-06-10' },
  { id: 'ca3', name: 'Lanzamiento Organizadores', status: 'ENVIANDO', recipients: 96, sent: 54, delivered: 50, read: 22, replied: 7, date: '2026-06-17' },
  { id: 'ca4', name: 'Black Week (borrador)', status: 'BORRADOR', recipients: 0, sent: 0, delivered: 0, read: 0, replied: 0, date: '—' },
];
