import { PrismaClient, Prisma, Client } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos...');

  // Limpieza (orden por dependencias)
  await prisma.$transaction([
    prisma.aIAnalysis.deleteMany(),
    prisma.message.deleteMany(),
    prisma.conversation.deleteMany(),
    prisma.note.deleteMany(),
    prisma.followUp.deleteMany(),
    prisma.saleItem.deleteMany(),
    prisma.sale.deleteMany(),
    prisma.campaignRecipient.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.clientTag.deleteMany(),
    prisma.automation.deleteMany(),
    prisma.client.deleteMany(),
    prisma.product.deleteMany(),
    prisma.tag.deleteMany(),
    prisma.metaCampaign.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  // ---- Usuarios ----
  const pass = await bcrypt.hash('admin1234', 10);
  const [admin, supervisor, vendedor] = await Promise.all([
    prisma.user.create({ data: { email: 'admin@crm.com', password: pass, fullName: 'Ana Administradora', role: 'ADMINISTRADOR' } }),
    prisma.user.create({ data: { email: 'supervisor@crm.com', password: pass, fullName: 'Sergio Supervisor', role: 'SUPERVISOR' } }),
    prisma.user.create({ data: { email: 'vendedor@crm.com', password: pass, fullName: 'Vale Vendedora', role: 'VENDEDOR' } }),
  ]);

  // ---- Etiquetas ----
  const tagData = [
    { name: 'Cliente caliente', color: '#F59E0B' },
    { name: 'Cliente frío', color: '#38BDF8' },
    { name: 'Mayorista', color: '#7C5CFC' },
    { name: 'Minorista', color: '#10B981' },
    { name: 'Recurrente', color: '#F43F5E' },
  ];
  const tags = await Promise.all(tagData.map((t) => prisma.tag.create({ data: t })));

  // ---- Campañas Meta ----
  const metaCampaigns = await Promise.all([
    prisma.metaCampaign.create({ data: { metaId: 'mc_001', name: 'Fundas iPhone - Verano', objective: 'MESSAGES', status: 'ACTIVE', spend: new Prisma.Decimal(45000) } }),
    prisma.metaCampaign.create({ data: { metaId: 'mc_002', name: 'Organizadores - Hogar', objective: 'MESSAGES', status: 'ACTIVE', spend: new Prisma.Decimal(32000) } }),
    prisma.metaCampaign.create({ data: { metaId: 'mc_003', name: 'Accesorios - Retargeting', objective: 'MESSAGES', status: 'PAUSED', spend: new Prisma.Decimal(18000) } }),
  ]);

  // ---- Productos ----
  const productData = [
    { name: "FANTOCHE ALF.TRIPLE NEGRO 24*85 GR.", sku: "TOP1", category: "Alfajores", brand: "FANTOCHE", unitsPerBulk: 24, price: 16527.9, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090240670.jpg"], description: "FANTOCHE" },
    { name: "GUAYMALLEN ALFAJOR TRIPLE CHOCOLATE *24 UN.", sku: "TOP2", category: "Alfajores", brand: "GUAYMALLEN", unitsPerBulk: 24, price: 9868.81, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090240061.jpg"], description: "GUAYMALLEN" },
    { name: "GUAYMALLEN ALFAJOR TRIPLE BLANCO *24 UN.", sku: "TOP3", category: "Alfajores", brand: "GUAYMALLEN", unitsPerBulk: 24, price: 9868.81, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090240063.jpg"], description: "GUAYMALLEN" },
    { name: "LIA MEDIATARDE CRACKERS 14*315 GR.", sku: "TOP4", category: "Galletitas", brand: "LIA", unitsPerBulk: 14, price: 16787.43, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010140593.jpg"], description: "LIA" },
    { name: "FANTOCHE ALF.TRIPLE BLANCO 24*85 GR.", sku: "TOP5", category: "Alfajores", brand: "FANTOCHE", unitsPerBulk: 24, price: 16527.9, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090240102.jpg"], description: "FANTOCHE" },
    { name: "9 DE ORO BIZC.CLASICOS 24*200 GR.", sku: "TOP6", category: "Galletitas", brand: "9 DE ORO", unitsPerBulk: 24, price: 24885.96, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010240407.jpg"], description: "9 DE ORO" },
    { name: "RIERA TOSTADA CLASICA LIBRE DE SELLO 18*200 GR", sku: "TOP7", category: "Galletitas", brand: "RIERA", unitsPerBulk: 18, price: 18520.71, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090180011.jpg"], description: "RIERA" },
    { name: "GUAYMALLEN ALFAJOR SIMPLE CHOCOLATE 40*38 GR.", sku: "TOP8", category: "Alfajores", brand: "GUAYMALLEN", unitsPerBulk: 40, price: 9868.81, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090400237.jpg"], description: "GUAYMALLEN" },
    { name: "9 DE ORO BIZC.AGRIDULCE 20*200 GR.", sku: "TOP9", category: "Galletitas", brand: "9 DE ORO", unitsPerBulk: 20, price: 20738.32, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010200380.jpg"], description: "9 DE ORO" },
    { name: "FANTOCHE GALL.TAPITA *3.5 KG.", sku: "TOP10", category: "Galletitas", brand: "FANTOCHE", unitsPerBulk: 1, price: 14451.01, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010010679.jpg"], description: "FANTOCHE" },
    { name: "TRIO TRICHOC 12*300 GR.", sku: "TOP11", category: "Galletitas", brand: "TRIO", unitsPerBulk: 12, price: 13632.33, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120021.jpg"], description: "TRIO" },
    { name: "MISKY TURRON DE MANI 4*50*25 GR.", sku: "TOP12", category: "Golosinas", brand: "MISKY", unitsPerBulk: 4, price: 30254.46, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1060040012.jpg"], description: "MISKY" },
    { name: "GUAYMALLEN ALFAJOR SIMPLE BLANCO 40*38 GR.", sku: "TOP13", category: "Alfajores", brand: "GUAYMALLEN", unitsPerBulk: 40, price: 9868.81, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090400236.jpg"], description: "GUAYMALLEN" },
    { name: "TRIO PEPAS 10*500 GR.", sku: "TOP14", category: "Galletitas", brand: "TRIO", unitsPerBulk: 10, price: 16227.47, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010100023.jpg"], description: "TRIO" },
    { name: "MISKY GOMA FANTASIA 6*1 KG", sku: "TOP15", category: "Golosinas", brand: "MISKY", unitsPerBulk: 6, price: 39605.76, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1060060756.jpg"], description: "MISKY" },
    { name: "TEREPIN PEPAS CASERITAS 14*400 GR.", sku: "TOP16", category: "Galletitas", brand: "TEREPIN", unitsPerBulk: 14, price: 16994.47, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010140176.jpg"], description: "TEREPIN" },
    { name: "NEVARES ALF.FULBITO MANI 40*30 GR.", sku: "TOP17", category: "Alfajores", brand: "NEVARES", unitsPerBulk: 40, price: 6095.69, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090400271.jpg"], description: "NEVARES" },
    { name: "PASEO CINCO SEMILLAS 14*300 GR.", sku: "TOP18", category: "Golosinas", brand: "PASEO", unitsPerBulk: 14, price: 20721.63, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010140387.jpg"], description: "PASEO" },
    { name: "TRIO PEPAS 12*320 GR.", sku: "TOP19", category: "Galletitas", brand: "TRIO", unitsPerBulk: 12, price: 12461.69, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120028.jpg"], description: "TRIO" },
    { name: "TRIO CHOCOTRIO 12*300 GR.", sku: "TOP20", category: "Galletitas", brand: "TRIO", unitsPerBulk: 12, price: 18352.68, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120022.jpg"], description: "TRIO" },
    { name: "LIA MEDIATARDE SANDWICH 16*3*107 GR.", sku: "TOP21", category: "Galletitas", brand: "LIA", unitsPerBulk: 16, price: 18983.06, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010160833.jpg"], description: "LIA" },
    { name: "NEVARES TURRON DE MANI *50 UNID.", sku: "TOP22", category: "Golosinas", brand: "NEVARES", unitsPerBulk: 50, price: 9968.1, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1060500065.jpg"], description: "NEVARES" },
    { name: "SOLITAS ANIMACION CON CONFITES 10*400 GR.", sku: "TOP23", category: "Golosinas", brand: "SOLITAS", unitsPerBulk: 10, price: 14242.14, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010100340.jpg"], description: "SOLITAS" },
    { name: "MISKY GOMA JELLY ROLL 6*1 KG", sku: "TOP24", category: "Golosinas", brand: "MISKY", unitsPerBulk: 6, price: 39605.76, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1060060055.jpg"], description: "MISKY" },
    { name: "RASTA ALFAJOR NEGRO *18 UNID.", sku: "TOP25", category: "Alfajores", brand: "RASTA", unitsPerBulk: 18, price: 18682.4, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090180005.jpg"], description: "RASTA" },
    { name: "TEREPIN PEPAS MEMBRILLO 12*500 GR.", sku: "TOP26", category: "Galletitas", brand: "TEREPIN", unitsPerBulk: 12, price: 17968.5, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120181.jpg"], description: "TEREPIN" },
    { name: "9 DE ORO BIZC.AZUCARADOS 28*210 GR.", sku: "TOP27", category: "Galletitas", brand: "9 DE ORO", unitsPerBulk: 28, price: 29033.66, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010280410.jpg"], description: "9 DE ORO" },
    { name: "TRIO PEPAS ALEMANAS 12*300 GR.", sku: "TOP28", category: "Galletitas", brand: "TRIO", unitsPerBulk: 12, price: 13632.33, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120010.jpg"], description: "TRIO" },
    { name: "MISKY MASTICABLE SURTIDO 10*800 GR", sku: "TOP29", category: "Golosinas", brand: "MISKY", unitsPerBulk: 10, price: 55043.63, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1060100056.jpg"], description: "MISKY" },
    { name: "TRIO GLASY 12*300 GR.", sku: "TOP30", category: "Golosinas", brand: "TRIO", unitsPerBulk: 12, price: 13632.33, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120030.jpg"], description: "TRIO" },
    { name: "SWEET VAINILLAS 18*180 GR.", sku: "TOP31", category: "Galletitas", brand: "MASSARINI", unitsPerBulk: 18, price: 19552.93, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010180814.jpg"], description: "MASSARINI" },
    { name: "PRUEBA 1806", sku: "TOP32", category: "Golosinas", brand: "FANTOCHE", unitsPerBulk: 24, price: 16527.9, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090240104.jpg"], description: "FANTOCHE" },
    { name: "CELOSAS BAÑADAS 10*350 GR", sku: "TOP33", category: "Golosinas", brand: "CELOSAS", unitsPerBulk: 10, price: 17390.6, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010100321.jpg"], description: "CELOSAS" },
    { name: "SOLITAS ALFAJORCITO C/CHOCOLATE 14*300 GR.", sku: "TOP34", category: "Alfajores", brand: "SOLITAS", unitsPerBulk: 14, price: 37359.56, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010140325.jpg"], description: "SOLITAS" },
    { name: "RONDA TRIANGULITOS 18*150 GR.", sku: "TOP35", category: "Golosinas", brand: "HOJALMAR", unitsPerBulk: 18, price: 21207.79, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010180855.jpg"], description: "HOJALMAR" },
    { name: "DON SATUR BIZCOCHOS DE GRASA 30*200 GR.", sku: "TOP36", category: "Galletitas", brand: "DON SATUR", unitsPerBulk: 30, price: 32798.15, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010300446.jpg"], description: "DON SATUR" },
    { name: "NOGALI SANDWICH FAMILIAR 18*300 GR.", sku: "TOP37", category: "Galletitas", brand: "NOGALI", unitsPerBulk: 18, price: 13966.43, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010180494.jpg"], description: "NOGALI" },
    { name: "LIA VOCACION CLASICA 36*141 GR.", sku: "TOP38", category: "Golosinas", brand: "LIA", unitsPerBulk: 36, price: 23039.97, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010360571.jpg"], description: "LIA" },
    { name: "FANTOCHE GALL.MARMOLADA 12*350 GR.", sku: "TOP39", category: "Galletitas", brand: "FANTOCHE", unitsPerBulk: 12, price: 16117.49, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120553.jpg"], description: "FANTOCHE" },
    { name: "FANTOCHE ALFAJOR SUPER TRIPLE 12*100 GR.", sku: "TOP40", category: "Alfajores", brand: "FANTOCHE", unitsPerBulk: 12, price: 10008.91, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090122564.jpg"], description: "FANTOCHE" },
    { name: "TRIO TRICHOC 10*500 GR.", sku: "TOP41", category: "Galletitas", brand: "TRIO", unitsPerBulk: 10, price: 17507.2, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010100009.jpg"], description: "TRIO" },
    { name: "FANTOCHE GALL.YAYITA C/CHIPS 12*275 GR.", sku: "TOP42", category: "Galletitas", brand: "FANTOCHE", unitsPerBulk: 12, price: 16843.27, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120806.jpg"], description: "FANTOCHE" },
    { name: "NEVARES ALF.MOGY NEGRO 40*38 GR.", sku: "TOP43", category: "Alfajores", brand: "NEVARES", unitsPerBulk: 40, price: 10208.77, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090400027.jpg"], description: "NEVARES" },
    { name: "9 DE ORO COOKIES CHIPS 16*120 GR.", sku: "TOP44", category: "Galletitas", brand: "9 DE ORO", unitsPerBulk: 16, price: 10385.15, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010160402.jpg"], description: "9 DE ORO" },
    { name: "PAR-NOR MOROCHITAS *4.5 KG.", sku: "TOP45", category: "Golosinas", brand: "PARNOR", unitsPerBulk: 1, price: 26261.21, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010010080.jpg"], description: "PARNOR" },
    { name: "FANTOCHE ALFAJOR TRIPLE RED VELVET 12*100 GR.", sku: "TOP46", category: "Alfajores", brand: "FANTOCHE", unitsPerBulk: 12, price: 10008.91, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090122563.jpg"], description: "FANTOCHE" },
    { name: "LEIVA TOSTADAS ARROZ C/SAL 12*150 GR.", sku: "TOP47", category: "Galletitas", brand: "LEIVA", unitsPerBulk: 12, price: 11798.98, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120356.jpg"], description: "LEIVA" },
    { name: "FANTOCHE ALFAJOR PESCADO RAUL SIMPLE NEGRO 12*50 GR.", sku: "TOP48", category: "Alfajores", brand: "FANTOCHE", unitsPerBulk: 12, price: 6974.69, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090122561.jpg"], description: "FANTOCHE" },
    { name: "RIERA TOSTADA LIGHT LIBRE DE SELLO 18*200 GR", sku: "TOP49", category: "Galletitas", brand: "RIERA", unitsPerBulk: 18, price: 21375.1, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090180010.jpg"], description: "RIERA" },
    { name: "FANTOCHE GALL.HOROSCOPO 12*300 GR.", sku: "TOP50", category: "Galletitas", brand: "FANTOCHE", unitsPerBulk: 12, price: 16843.27, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120277.jpg"], description: "FANTOCHE" },
    { name: "LIA SURTIDO 21*400 GR.", sku: "TOP51", category: "Golosinas", brand: "LIA", unitsPerBulk: 21, price: 30695.59, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010210792.jpg"], description: "LIA" },
    { name: "FANTOCHE ALFAJOR PESCADO RAUL SIMPLE BLANCO 12*50 GR.", sku: "TOP52", category: "Alfajores", brand: "FANTOCHE", unitsPerBulk: 12, price: 6974.69, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090122562.jpg"], description: "FANTOCHE" },
    { name: "TRIO GLASY 10*500 GR.", sku: "TOP53", category: "Golosinas", brand: "TRIO", unitsPerBulk: 10, price: 16227.47, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010100014.jpg"], description: "TRIO" },
    { name: "NEVARES ALF.MOGY BLANCO 40*38 GR.", sku: "TOP54", category: "Alfajores", brand: "NEVARES", unitsPerBulk: 40, price: 10208.77, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090400028.jpg"], description: "NEVARES" },
    { name: "PASEO CRACKERS 14*300 GR", sku: "TOP55", category: "Galletitas", brand: "PASEO", unitsPerBulk: 14, price: 16689.88, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010140544.jpg"], description: "PASEO" },
    { name: "RIERA TOSTADA INTEGRAL LIBRES DE SELLOS 18*200 GR", sku: "TOP56", category: "Galletitas", brand: "RIERA", unitsPerBulk: 18, price: 18520.71, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090180020.jpg"], description: "RIERA" },
    { name: "9 DE ORO COOKIES CHIPS COLORES 16*120 GR.", sku: "TOP57", category: "Galletitas", brand: "9 DE ORO", unitsPerBulk: 16, price: 10385.15, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010160404.jpg"], description: "9 DE ORO" },
    { name: "FANTOCHE ALFAJOR TRIPLE NIGHT 12*85 GR.", sku: "TOP58", category: "Alfajores", brand: "FANTOCHE", unitsPerBulk: 12, price: 8981.32, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090120097.jpg"], description: "FANTOCHE" },
    { name: "TRIO FROLITAS MEMBRILLO 12*300 GR.", sku: "TOP59", category: "Golosinas", brand: "TRIO", unitsPerBulk: 12, price: 13632.33, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120007.jpg"], description: "TRIO" },
    { name: "SOLITAS PURITOS BAÑADOS CHOCOLATE 14*300 GR.", sku: "TOP60", category: "Golosinas", brand: "SOLITAS", unitsPerBulk: 14, price: 25535.88, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010140339.jpg"], description: "SOLITAS" },
    { name: "GUAYMALLEN ALFAJOR TRIPLE FRUTA *24 UN.", sku: "TOP61", category: "Alfajores", brand: "GUAYMALLEN", unitsPerBulk: 24, price: 9868.81, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090240145.jpg"], description: "GUAYMALLEN" },
    { name: "MISKY GOMA EUCALIPTO 6*1 KG", sku: "TOP62", category: "Golosinas", brand: "MISKY", unitsPerBulk: 6, price: 39605.76, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1060060758.jpg"], description: "MISKY" },
    { name: "FANTOCHE GALL.TAPITA (BANDEJA) 12*350 GR.", sku: "TOP63", category: "Galletitas", brand: "FANTOCHE", unitsPerBulk: 12, price: 17449.75, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120524.jpg"], description: "FANTOCHE" },
    { name: "LIA VOCACION CLASICA 12*3*128 GR.", sku: "TOP64", category: "Golosinas", brand: "LIA", unitsPerBulk: 12, price: 19200.06, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010122446.jpg"], description: "LIA" },
    { name: "TERRABUSI OREO C/CACAO 36*118 GR.", sku: "TOP65", category: "Golosinas", brand: "OREO", unitsPerBulk: 36, price: 56511.96, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010360578.jpg"], description: "OREO" },
    { name: "SOLITAS ALFAJORCITO C/CHOCOLATE 25*160 GR.", sku: "TOP66", category: "Alfajores", brand: "SOLITAS", unitsPerBulk: 25, price: 37621.44, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010250326.jpg"], description: "SOLITAS" },
    { name: "FANTOCHE ALFAJOR TRIPLE DAY 12*85 GR.", sku: "TOP67", category: "Alfajores", brand: "FANTOCHE", unitsPerBulk: 12, price: 8981.32, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090120098.jpg"], description: "FANTOCHE" },
    { name: "LIA POLVORITA GALL.CHOCOLATE/VAINILLA 40*81 GR.", sku: "TOP68", category: "Galletitas", brand: "LIA", unitsPerBulk: 40, price: 17919.81, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010400004.jpg"], description: "LIA" },
    { name: "PASEO SALVADO 14*300 GR.", sku: "TOP69", category: "Golosinas", brand: "PASEO", unitsPerBulk: 14, price: 20721.63, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010140389.jpg"], description: "PASEO" },
    { name: "RIERA PAN RALLADO LIBRES DE SELLOS 12*500 GR.", sku: "TOP70", category: "Golosinas", brand: "RIERA", unitsPerBulk: 12, price: 8661.18, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090122532.jpg"], description: "RIERA" },
    { name: "RIERA TOSTADA SIN SAL LIBRES DE SELLOS 18*200 GR", sku: "TOP71", category: "Galletitas", brand: "RIERA", unitsPerBulk: 18, price: 18520.71, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090180013.jpg"], description: "RIERA" },
    { name: "PAR-NOR PITUSAS RELLENA CHOCOLATE 30*160 GR.", sku: "TOP72", category: "Golosinas", brand: "PARNOR", unitsPerBulk: 30, price: 25802.5, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010300078.jpg"], description: "PARNOR" },
    { name: "TRIO OSKITO 12*300 GR.", sku: "TOP73", category: "Golosinas", brand: "TRIO", unitsPerBulk: 12, price: 18352.68, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120024.jpg"], description: "TRIO" },
    { name: "FANTOCHE ALFAJOR MINI NEGRO 24*150 GR.", sku: "TOP74", category: "Alfajores", brand: "FANTOCHE", unitsPerBulk: 24, price: 36883.56, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090240194.jpg"], description: "FANTOCHE" },
    { name: "TRIO PEPAS ALEMANAS 10*500 GR.", sku: "TOP75", category: "Galletitas", brand: "TRIO", unitsPerBulk: 10, price: 17507.2, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010100011.jpg"], description: "TRIO" },
    { name: "BAGLEY GALLETITAS SURTIDAS 21*400 GR.", sku: "TOP76", category: "Galletitas", brand: "BAGLEY", unitsPerBulk: 21, price: 52818.73, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010210813.jpg"], description: "BAGLEY" },
    { name: "RASTA ALFAJOR BLANCO *18 UNID.", sku: "TOP77", category: "Alfajores", brand: "RASTA", unitsPerBulk: 18, price: 18682.4, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090180004.jpg"], description: "RASTA" },
    { name: "PIPAS SNACK SEMILLITAS GIGANTES 12*160 GR.", sku: "TOP78", category: "Golosinas", brand: "PIPAS", unitsPerBulk: 12, price: 21258.73, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1060121165.jpg"], description: "PIPAS" },
    { name: "LIA VOCACION ACARAMELADA 36*145 GR.", sku: "TOP79", category: "Golosinas", brand: "LIA", unitsPerBulk: 36, price: 23039.97, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010360715.jpg"], description: "LIA" },
    { name: "RIERA TOSTADA 100% INTEGRALES LIBRES DE SELLOS 18*200 GR", sku: "TOP80", category: "Galletitas", brand: "RIERA", unitsPerBulk: 18, price: 23922.0, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090180019.jpg"], description: "RIERA" },
    { name: "PIPAS SEMILLITA GIGANTE 12*12 UNID.", sku: "TOP81", category: "Golosinas", brand: "PIPAS", unitsPerBulk: 12, price: 82087.37, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1060120610.jpg"], description: "PIPAS" },
    { name: "SOLITAS LEGENDARIAS 8*500 GR", sku: "TOP82", category: "Golosinas", brand: "SOLITAS", unitsPerBulk: 8, price: 12483.09, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010080483.jpg"], description: "SOLITAS" },
    { name: "TRIO CHOCOLATINA 12*300 GR.", sku: "TOP83", category: "Golosinas", brand: "TRIO", unitsPerBulk: 12, price: 18352.68, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010120005.jpg"], description: "TRIO" },
    { name: "RIERA TOSTADA DULCE LIBRE DE SELLO 18*200 GR", sku: "TOP84", category: "Galletitas", brand: "RIERA", unitsPerBulk: 18, price: 18520.71, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090180009.jpg"], description: "RIERA" },
    { name: "LIA POLVORITA GALL.VAINILLA/FRUTILLA 40*81 GR.", sku: "TOP85", category: "Galletitas", brand: "LIA", unitsPerBulk: 40, price: 17919.81, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010400464.jpg"], description: "LIA" },
    { name: "NEVARES TURRON FULBITO RELLENO 50*25 GR.", sku: "TOP86", category: "Golosinas", brand: "NEVARES", unitsPerBulk: 50, price: 5705.59, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1060500064.jpg"], description: "NEVARES" },
    { name: "CARILO GALLETA ARROZ C/SAL 18*150 GR.", sku: "TOP87", category: "Galletitas", brand: "CARILO", unitsPerBulk: 18, price: 27212.2, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010180090.jpg"], description: "CARILO" },
    { name: "SOLITAS ARITOS SURTIDOS 8*500 GR.", sku: "TOP88", category: "Golosinas", brand: "SOLITAS", unitsPerBulk: 8, price: 12716.39, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010080338.jpg"], description: "SOLITAS" },
    { name: "PAR-NOR PITUSAS RELLENA CHOCOLATE 16*300 GR.", sku: "TOP89", category: "Golosinas", brand: "PARNOR", unitsPerBulk: 16, price: 24655.72, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010160071.jpg"], description: "PARNOR" },
    { name: "TEMFLOR CIGARRITOS *3 KG", sku: "TOP90", category: "Golosinas", brand: "TEMFLOR", unitsPerBulk: 1, price: 27190.68, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010010345.jpg"], description: "TEMFLOR" },
    { name: "RIERA TOSTADA SEMILLAS LIBRES DE SELLOS 18*200 GR", sku: "TOP91", category: "Galletitas", brand: "RIERA", unitsPerBulk: 18, price: 21375.1, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090180012.jpg"], description: "RIERA" },
    { name: "NEVARES RAPSODIA 24*80 GR.", sku: "TOP92", category: "Golosinas", brand: "NEVARES", unitsPerBulk: 24, price: 14446.43, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010240044.jpg"], description: "NEVARES" },
    { name: "ARCOR SURTIDO DIVERSION 21*400 GR.", sku: "TOP93", category: "Golosinas", brand: "ARCOR", unitsPerBulk: 21, price: 42825.99, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010210499.jpg"], description: "ARCOR" },
    { name: "TURIMAR ALFAJOR TRIPLE NEGRO 24*60 GR.", sku: "TOP94", category: "Alfajores", brand: "TURIMAR", unitsPerBulk: 24, price: 8262.36, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090240669.jpg"], description: "TURIMAR" },
    { name: "MANJARES PALMERITA 20*200 GR.", sku: "TOP95", category: "Golosinas", brand: "MANJARES", unitsPerBulk: 20, price: 32597.4, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010200158.jpg"], description: "MANJARES" },
    { name: "SOLITAS ARITOS FRUTILLA 8*500 GR.", sku: "TOP96", category: "Golosinas", brand: "SOLITAS", unitsPerBulk: 8, price: 12716.39, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010080374.jpg"], description: "SOLITAS" },
    { name: "PAR-NOR PITUSAS RELLENA FRUTILLA 16*300 GR.", sku: "TOP97", category: "Golosinas", brand: "PARNOR", unitsPerBulk: 16, price: 24655.72, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010160085.jpg"], description: "PARNOR" },
    { name: "TURIMAR GALL.C/CHIPS CHOCOLATE 16*400 GR.", sku: "TOP98", category: "Galletitas", brand: "TURIMAR", unitsPerBulk: 16, price: 31582.89, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010160498.jpg"], description: "TURIMAR" },
    { name: "MANTECOL ALF.TRIPLE RELLENO C/PASTA MANTECOL 20*60 GR.", sku: "TOP99", category: "Alfajores", brand: "MANTECOL", unitsPerBulk: 20, price: 19994.04, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1090200386.jpg"], description: "MANTECOL" },
    { name: "SWEET VAINILLAS 14*225 GR.", sku: "TOP100", category: "Galletitas", brand: "MASSARINI", unitsPerBulk: 14, price: 19076.99, cost: 0, stock: 0, images: ["https://www.tyna.com.ar/archivos/imagenes_productos/1010140124.jpg"], description: "MASSARINI" },
  ];
  const products = await Promise.all(productData.map((p) => prisma.product.create({
    data: { ...p, price: new Prisma.Decimal(p.price), cost: new Prisma.Decimal(p.cost) },
  })));

  // ---- Clientes ----
  const stages = ['NUEVO_LEAD', 'CONTACTADO', 'INTERESADO', 'NEGOCIANDO', 'ESPERANDO_RESPUESTA', 'VENTA_CERRADA', 'VENTA_PERDIDA'] as const;
  const provincias = [
    ['Rosario', 'Santa Fe'], ['Córdoba', 'Córdoba'], ['CABA', 'Buenos Aires'],
    ['La Plata', 'Buenos Aires'], ['Mendoza', 'Mendoza'], ['Mar del Plata', 'Buenos Aires'],
    ['San Miguel de Tucumán', 'Tucumán'], ['Santa Fe', 'Santa Fe'],
  ];
  const nombres = [
    ['Martín', 'Gómez'], ['Lucía', 'Fernández'], ['Joaquín', 'Pérez'], ['Camila', 'Rodríguez'],
    ['Tomás', 'López'], ['Sofía', 'Díaz'], ['Mateo', 'Martínez'], ['Valentina', 'Sánchez'],
    ['Benjamín', 'Romero'], ['Julieta', 'Torres'], ['Nicolás', 'Ruiz'], ['Catalina', 'Flores'],
    ['Agustín', 'Acosta'], ['Renata', 'Benítez'], ['Santiago', 'Medina'], ['Emma', 'Suárez'],
    ['Bautista', 'Herrera'], ['Mía', 'Aguirre'], ['Thiago', 'Castro'], ['Olivia', 'Rojas'],
  ];

  const intents = ['ALTA', 'MEDIA', 'BAJA'] as const;
  const sentiments = ['POSITIVO', 'NEUTRO', 'NEGATIVO'] as const;

  // Datos fiscales (facturación)
  const ivaConditions = ['RESPONSABLE_INSCRIPTO', 'MONOTRIBUTO', 'CONSUMIDOR_FINAL', 'RESPONSABLE_INSCRIPTO'] as const;
  const streets = ['Florida 300', 'San Martín 158', 'Simón Bolívar 2212', 'Roullón 3323', 'Corrientes 1450', 'Mitre 890', 'Belgrano 210', 'Urquiza 1120', 'Sarmiento 675', 'Rivadavia 940'];

  const clients: Client[] = [];
  for (let i = 0; i < nombres.length; i++) {
    const [firstName, lastName] = nombres[i];
    const [city, province] = provincias[i % provincias.length];
    const stage = stages[i % stages.length];
    const product = products[i % products.length];
    const meta = metaCampaigns[i % metaCampaigns.length];
    const score = stage === 'VENTA_CERRADA' ? 90 + (i % 10)
      : stage === 'NEGOCIANDO' ? 70 + (i % 20)
      : stage === 'INTERESADO' ? 50 + (i % 20)
      : stage === 'VENTA_PERDIDA' ? 10 + (i % 15)
      : 25 + (i % 30);
    const daysAgo = (i % 12) + 1;
    const lastInbound = new Date(Date.now() - daysAgo * 86_400_000 - (i % 20) * 3600_000);

    const client = await prisma.client.create({
      data: {
        firstName, lastName,
        phone: `+54934115${String(10000 + i).slice(-5)}`,
        email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@mail.com`,
        city, province,
        ivaCondition: ivaConditions[i % ivaConditions.length],
        cuit: `20${String(30000000 + i * 137931).slice(0, 8)}${(i % 9) + 1}`,
        address: streets[i % streets.length],
        postalCode: String(1000 + i * 137).slice(0, 4),
        clientCode: `C${String(29000 + i * 113).padStart(6, '0')}`,
        condicionVenta: 'Contado',
        stage,
        source: i % 3 === 0 ? 'META_ADS' : 'WHATSAPP',
        interestedProductId: product.id,
        metaCampaignId: meta.id,
        metaAdSetId: `adset_${(i % 4) + 1}`,
        metaAdId: `ad_${(i % 8) + 1}`,
        leadScore: Math.min(100, score),
        buyingIntent: intents[i % intents.length],
        sentiment: sentiments[i % sentiments.length],
        assignedSellerId: [admin.id, supervisor.id, vendedor.id][i % 3],
        aiSummary: `Cliente interesado en ${product.name}. ${stage === 'NEGOCIANDO' ? 'Negociando precio por cantidad.' : 'Consultó disponibilidad y envío.'}`,
        lastObjection: i % 4 === 0 ? 'PRECIO' : i % 4 === 1 ? 'ENVIO' : 'NINGUNA',
        lastInboundAt: lastInbound,
        lastContactAt: lastInbound,
        createdAt: new Date(Date.now() - (daysAgo + 2) * 86_400_000),
      },
    });
    clients.push(client);

    // Etiqueta
    await prisma.clientTag.create({ data: { clientId: client.id, tagId: tags[i % tags.length].id } });

    // Conversación + mensajes
    const conv = await prisma.conversation.create({
      data: {
        clientId: client.id,
        unreadCount: i % 3 === 0 ? (i % 4) + 1 : 0,
        lastMessageAt: lastInbound,
        lastMessagePreview: '¿Hacés envíos a mi ciudad?',
      },
    });
    const msgs: Prisma.MessageCreateManyInput[] = [
      { conversationId: conv.id, direction: 'ENTRANTE', author: 'CLIENTE', content: `Hola! Vi el anuncio de ${product.name} 👀`, createdAt: new Date(lastInbound.getTime() - 3600_000) },
      { conversationId: conv.id, direction: 'SALIENTE', author: 'AUTOMATIZACION', content: '¡Hola! 👋 Gracias por escribirnos. ¿Qué producto estás buscando?', createdAt: new Date(lastInbound.getTime() - 3500_000) },
      { conversationId: conv.id, direction: 'ENTRANTE', author: 'CLIENTE', content: '¿Cuánto sale? ¿Tenés stock?', createdAt: new Date(lastInbound.getTime() - 1800_000) },
      { conversationId: conv.id, direction: 'SALIENTE', author: 'VENDEDOR', content: `¡Sí! Tenemos stock 📦 Sale $${product.price.toString()}. ¿Te lo reservo?`, sellerId: vendedor.id, createdAt: new Date(lastInbound.getTime() - 900_000) },
      { conversationId: conv.id, direction: 'ENTRANTE', author: 'CLIENTE', content: '¿Hacés envíos a mi ciudad?', createdAt: lastInbound },
    ];
    await prisma.message.createMany({ data: msgs });

    // Análisis IA (registro)
    await prisma.aIAnalysis.create({
      data: {
        clientId: client.id,
        buyingIntent: client.buyingIntent,
        leadScore: client.leadScore,
        sentiment: client.sentiment,
        objection: client.lastObjection,
        nextAction: client.buyingIntent === 'ALTA' ? 'Cerrar venta y pedir datos' : 'Enviar catálogo y precio',
        summary: client.aiSummary!,
        suggestions: [
          'Te confirmo stock y te reservo uno hoy 📦',
          'Si confirmás ahora, despacho en el día. ¿Te paso medios de pago?',
          '¿Querés que coordinemos el envío a tu domicilio? 🚚',
        ],
        usedAI: i % 2 === 0,
        model: i % 2 === 0 ? 'claude-sonnet-4-6' : null,
        inputTokens: i % 2 === 0 ? 420 : null,
        outputTokens: i % 2 === 0 ? 180 : null,
      },
    });

    // Seguimiento pendiente para algunos
    if (['CONTACTADO', 'INTERESADO', 'ESPERANDO_RESPUESTA'].includes(stage)) {
      await prisma.followUp.create({
        data: {
          clientId: client.id,
          assignedToId: client.assignedSellerId,
          title: 'Reactivar conversación',
          dueAt: new Date(Date.now() + 86_400_000),
        },
      });
    }
  }

  // ---- Ventas (para clientes cerrados) ----
  const wonClients = clients.filter((c) => c.stage === 'VENTA_CERRADA');
  for (const c of wonClients) {
    const product = products[Math.floor(Math.random() * products.length)];
    const qty = 1 + Math.floor(Math.random() * 3);
    await prisma.sale.create({
      data: {
        clientId: c.id,
        sellerId: c.assignedSellerId,
        total: new Prisma.Decimal(Number(product.price) * qty),
        status: 'PAGADA',
        metaCampaignId: c.metaCampaignId,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10) * 86_400_000),
        items: { create: [{ productId: product.id, quantity: qty, unitPrice: product.price }] },
      },
    });
  }

  // ---- Campañas ----
  const interesados = clients.filter((c) => c.stage === 'INTERESADO');
  const camp = await prisma.campaign.create({
    data: {
      name: 'Promo Fundas iPhone -20%',
      message: '¡Hola! 📱 Esta semana 20% OFF en fundas iPhone. ¿Te interesa? Quedan pocas unidades 🔥',
      status: 'COMPLETADA',
      filters: { stage: 'INTERESADO' },
      createdById: admin.id,
      totalRecipients: interesados.length,
      sentCount: interesados.length,
      deliveredCount: interesados.length,
      readCount: Math.floor(interesados.length * 0.7),
      repliedCount: Math.floor(interesados.length * 0.3),
      sentAt: new Date(Date.now() - 2 * 86_400_000),
      recipients: { create: interesados.map((c) => ({ clientId: c.id, status: 'LEIDO' as const })) },
    },
  });

  // ---- Automatizaciones de ejemplo ----
  await prisma.automation.createMany({
    data: [
      { name: 'Seguimiento sin respuesta 48h', trigger: 'SIN_RESPUESTA_HORAS', triggerConfig: { hours: 48 }, actionType: 'ENVIAR_MENSAJE', actionConfig: { useAI: true, daysSilent: 2 } },
      { name: 'Promo a inactivos 7 días', trigger: 'SIN_RESPUESTA_DIAS', triggerConfig: { days: 7 }, actionType: 'ENVIAR_MENSAJE', actionConfig: { message: '¡Volvé a aprovechar! 🎉 Tenemos nuevas ofertas esta semana.' } },
      { name: 'Crear seguimiento a interesados', trigger: 'SIN_RESPUESTA_HORAS', triggerConfig: { hours: 24 }, actionType: 'CREAR_SEGUIMIENTO', actionConfig: { title: 'Llamar al cliente' }, isActive: false },
    ],
  });

  console.log(`✅ Listo: ${clients.length} clientes, ${products.length} productos, ${wonClients.length} ventas, 1 campaña (${camp.name}).`);
  console.log('👤 Login demo: admin@crm.com / admin1234');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
