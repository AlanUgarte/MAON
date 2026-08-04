import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as XLSX from 'xlsx';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll(search?: string) {
    return this.prisma.product.findMany({
      where: search
        ? { OR: [
            { name: { contains: search, mode: 'insensitive' } },
            { sku: { contains: search, mode: 'insensitive' } },
            { category: { contains: search, mode: 'insensitive' } },
          ] }
        : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Catálogo público (Tienda/Cotillón/FastCotillón): sin cost/marginPct (no son datos
   * para mostrar a clientes), en vivo desde la DB — reemplaza al JSON estático que había
   * que regenerar y redeployar a mano cada vez que cambiaba un precio o el stock.
   */
  async findPublicCatalog() {
    const products = await this.prisma.product.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { sku: true, name: true, category: true, line: true, brand: true, unitsPerBulk: true, images: true, price: true, stock: true, marginPct: true },
    });
    return products.map((p) => ({
      id: `t${p.sku}`,
      name: p.name,
      sku: p.sku,
      category: p.category ?? '',
      brand: p.brand ?? '-',
      units: p.unitsPerBulk ?? 0,
      img: p.images?.[0] ?? '',
      price: Number(p.price),
      stock: p.stock ?? 0,
      active: true,
      line: p.line ?? undefined,
      // Margen propio del artículo (puesto desde Productos > "Aplicar a la marca/categoría
      // filtrada") — si no tiene, la tienda usa el margen general de sus settings.
      marginPct: p.marginPct ?? undefined,
    }));
  }

  async findOne(id: string) {
    const p = await this.prisma.product.findUnique({ where: { id } });
    if (!p) throw new NotFoundException('Producto no encontrado');
    return p;
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: dto });
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id);
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.product.delete({ where: { id } });
  }

  // Margen masivo: a todos, o filtrado por marca/categoría (mismo alcance que los
  // botones "Aplicar a todos / A la marca filtrada / A la categoría filtrada" de Productos).
  async bulkSetMargin(marginPct: number, brand?: string, category?: string) {
    const where: Prisma.ProductWhereInput = {};
    if (brand) where.brand = brand;
    if (category) where.category = category;
    const res = await this.prisma.product.updateMany({ where, data: { marginPct } });
    return { updated: res.count };
  }

  /**
   * Sincroniza el catálogo real desde la lista de precios del proveedor (Excel "SAP
   * Movil"). Formato esperado: hoja con columnas Código, BRUTO BULTO, BRUTO UNIDAD
   * (y opcionalmente Categoría, Nombre del Artículo, Marca, Cant. Bulto si el archivo
   * las trae). Precio = BRUTO BULTO; si falta, cae a BRUTO UNIDAD.
   * Matchea por sku/Código: si el producto ya existe, actualiza precio siempre, y
   * nombre/categoría/marca/unidades por bulto solo si el archivo trae ese dato (si no,
   * se preserva lo que ya había — este archivo no trae esas columnas). Si no existe y el
   * archivo no trae nombre, no se puede crear (falta un dato obligatorio), se cuenta
   * aparte. La base solo tenía ~100 productos de prueba (sku "TOP1".."TOP100") — sin
   * esto, el catálogo real (10.000+ artículos que ve el cliente en /tienda) nunca tuvo su
   * fila real acá, y el checkout fallaba siempre ("ningún SKU reconocido") para cualquier
   * producto fuera de esos 100 de prueba.
   */
  async importPricesFromExcel(buffer: Buffer, dryRun: boolean) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames.includes('BULTO') ? 'BULTO' : wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    if (!sheet) throw new BadRequestException('El archivo no tiene hojas para leer');
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // Fila de encabezado: se busca por nombre en vez de asumir siempre la misma posición,
    // por si el proveedor reordena o saca columnas en una lista futura.
    const headerIdx = rows.findIndex((r) => r.some((c) => String(c).trim() === 'Código'));
    if (headerIdx === -1) throw new BadRequestException('No se encontró la fila de encabezado (columna "Código")');
    const header = rows[headerIdx].map((c) => String(c).trim());
    const col = (name: string) => header.indexOf(name);
    const skuCol = col('Código'), nameCol = col('Nombre del Artículo'), catCol = col('Categoría'),
      brandCol = col('Marca'), unitsCol = col('Cant. Bulto'), bultoCol = col('BRUTO BULTO'), unidadCol = col('BRUTO UNIDAD');
    if (skuCol === -1 || (bultoCol === -1 && unidadCol === -1)) {
      throw new BadRequestException('Faltan las columnas "Código" y/o "BRUTO BULTO"/"BRUTO UNIDAD" en el archivo');
    }

    const parseNum = (v: any): number | null => {
      const n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
      return isFinite(n) && n > 0 ? n : null;
    };

    const items: { sku: string; name: string | null; category: string | null; brand: string | null; units: number | null; price: number }[] = [];
    let skippedNoSku = 0, skippedBadPrice = 0;
    const seenSku = new Set<string>();
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const sku = String(row[skuCol] ?? '').trim();
      if (!sku || seenSku.has(sku)) { skippedNoSku++; continue; } // filas de encabezado de rubro, sin código (o duplicado)
      const bulto = bultoCol !== -1 ? parseNum(row[bultoCol]) : null;
      const unidad = unidadCol !== -1 ? parseNum(row[unidadCol]) : null;
      const price = bulto ?? unidad;
      if (price === null) { skippedBadPrice++; continue; }
      seenSku.add(sku);
      items.push({
        sku,
        name: nameCol !== -1 ? (String(row[nameCol] ?? '').trim() || null) : null,
        category: catCol !== -1 ? (String(row[catCol] ?? '').trim() || null) : null,
        brand: brandCol !== -1 ? (String(row[brandCol] ?? '').trim() || null) : null,
        units: unitsCol !== -1 ? (Number(row[unitsCol]) || null) : null,
        price: Math.round(price * 100) / 100,
      });
    }
    if (!items.length) throw new BadRequestException('No se encontró ningún artículo con código y precio válidos');

    const skus = items.map((i) => i.sku);
    const existing = await this.prisma.product.findMany({ where: { sku: { in: skus } }, select: { sku: true, name: true, price: true } });
    const existingBySku = new Map(existing.map((p) => [p.sku, p]));
    const toCreate = items.filter((i) => !existingBySku.has(i.sku) && i.name);
    const toUpdate = items.filter((i) => existingBySku.has(i.sku));
    const skippedUnknownSku = items.filter((i) => !existingBySku.has(i.sku) && !i.name).length;

    // Muestra de cambios reales (antes/después/%) para poder revisar antes de confirmar —
    // sobre todo útil en dryRun, donde todavía no se tocó nada en la base. Solo artículos
    // cuyo precio realmente cambió (toUpdate trae también los que quedan igual).
    const changed = toUpdate
      .map((it) => {
        const current = existingBySku.get(it.sku)!;
        const oldPrice = Number(current.price);
        return { sku: it.sku, name: current.name, oldPrice, newPrice: it.price, pctChange: oldPrice > 0 ? ((it.price - oldPrice) / oldPrice) * 100 : 0 };
      })
      .filter((c) => c.oldPrice !== c.newPrice)
      .sort((a, b) => Math.abs(b.pctChange) - Math.abs(a.pctChange));
    const sample = changed.slice(0, 30);

    if (!dryRun) {
      // En chunks: una sola sentencia con las 10.000+ filas se pasa del límite de
      // parámetros de Postgres (65535).
      const CHUNK = 1000;
      // toCreate siempre trae name (filtrado más arriba) — INSERT normal, sin conflicto posible.
      for (let i = 0; i < toCreate.length; i += CHUNK) {
        const chunk = toCreate.slice(i, i + CHUNK);
        const values = Prisma.join(
          chunk.map((it) => Prisma.sql`(${`prod_${it.sku}`}, ${it.name}::text, ${it.sku}, ${it.category}::text, ${it.brand}::text, ${it.units}::int, ${it.price}::numeric)`),
          ',',
        );
        await this.prisma.$executeRaw`
          INSERT INTO "Product" (id, name, sku, category, brand, "unitsPerBulk", price, stock, "isActive", "createdAt", "updatedAt")
          SELECT id, name, sku, category, brand, "unitsPerBulk", price, 0, true, now(), now()
          FROM (VALUES ${values}) AS v(id, name, sku, category, brand, "unitsPerBulk", price)
        `;
      }
      // toUpdate puede traer name/category/brand/units en null (archivo sin esas
      // columnas) — un UPDATE plano no valida NOT NULL sobre columnas que no toca,
      // a diferencia de INSERT ... ON CONFLICT DO UPDATE (que sí evalúa NOT NULL
      // sobre la fila del INSERT aunque termine resolviéndose por el conflicto).
      for (let i = 0; i < toUpdate.length; i += CHUNK) {
        const chunk = toUpdate.slice(i, i + CHUNK);
        const values = Prisma.join(
          chunk.map((it) => Prisma.sql`(${it.sku}, ${it.name}::text, ${it.category}::text, ${it.brand}::text, ${it.units}::int, ${it.price}::numeric)`),
          ',',
        );
        await this.prisma.$executeRaw`
          UPDATE "Product" AS p SET
            price = v.price,
            name = COALESCE(v.name, p.name),
            category = COALESCE(v.category, p.category),
            brand = COALESCE(v.brand, p.brand),
            "unitsPerBulk" = COALESCE(v.units, p."unitsPerBulk"),
            "updatedAt" = now()
          FROM (VALUES ${values}) AS v(sku, name, category, brand, units, price)
          WHERE p.sku = v.sku
        `;
      }
    }

    return {
      dryRun,
      created: toCreate.length,
      updated: toUpdate.length,
      changed: changed.length,
      requested: items.length,
      sample,
      skippedNoSku,
      skippedBadPrice,
      skippedUnknownSku,
    };
  }
}
