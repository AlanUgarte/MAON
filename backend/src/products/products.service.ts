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

  /**
   * Sincroniza el catálogo real desde la lista de precios del proveedor (Excel "SAP
   * Movil"). Formato esperado: hoja con columnas Categoría, Código, Nombre, Marca,
   * Línea, ..., BRUTO BULTO, BRUTO UNIDAD, ...
   * Matchea por sku/Código: si el producto ya existe, actualiza precio/nombre/categoría/
   * marca/unidades por bulto; si no existe, lo crea. La base solo tenía ~100 productos de
   * prueba (sku "TOP1".."TOP100") — sin esto, el catálogo real (10.000+ artículos que ve
   * el cliente en /tienda) nunca tuvo su fila real acá, y el checkout fallaba siempre
   * ("ningún SKU reconocido") para cualquier producto fuera de esos 100 de prueba.
   */
  async importPricesFromExcel(buffer: Buffer, dryRun: boolean) {
    const wb = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames.includes('BULTO') ? 'BULTO' : wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    if (!sheet) throw new BadRequestException('El archivo no tiene hojas para leer');
    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    // Fila de encabezado: "Categoría","Código","Nombre del Artículo",...,"BRUTO BULTO",...
    // Se busca por nombre en vez de asumir siempre la misma posición, por si el proveedor
    // reordena columnas en una lista futura.
    const headerIdx = rows.findIndex((r) => r.some((c) => String(c).trim() === 'Código'));
    if (headerIdx === -1) throw new BadRequestException('No se encontró la fila de encabezado (columna "Código")');
    const header = rows[headerIdx].map((c) => String(c).trim());
    const col = (name: string) => header.indexOf(name);
    const skuCol = col('Código'), nameCol = col('Nombre del Artículo'), catCol = col('Categoría'),
      brandCol = col('Marca'), unitsCol = col('Cant. Bulto'), priceCol = col('BRUTO BULTO');
    if (skuCol === -1 || priceCol === -1) {
      throw new BadRequestException('Faltan las columnas "Código" y/o "BRUTO BULTO" en el archivo');
    }

    const items: { sku: string; name: string; category: string; brand: string; units: number; price: number }[] = [];
    let skippedNoSku = 0, skippedBadPrice = 0;
    const seenSku = new Set<string>();
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const sku = String(row[skuCol] ?? '').trim();
      if (!sku || seenSku.has(sku)) { skippedNoSku++; continue; } // filas de encabezado de rubro, sin código (o duplicado)
      const raw = row[priceCol];
      const price = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
      if (!isFinite(price) || price <= 0) { skippedBadPrice++; continue; }
      seenSku.add(sku);
      items.push({
        sku,
        name: String(row[nameCol] ?? '').trim(),
        category: String(row[catCol] ?? '').trim(),
        brand: String(row[brandCol] ?? '').trim(),
        units: Number(row[unitsCol]) || 1,
        price: Math.round(price * 100) / 100,
      });
    }
    if (!items.length) throw new BadRequestException('No se encontró ningún artículo con código y precio válidos');

    const skus = items.map((i) => i.sku);
    const existing = await this.prisma.product.findMany({ where: { sku: { in: skus } }, select: { sku: true, name: true, price: true } });
    const existingBySku = new Map(existing.map((p) => [p.sku, p]));
    const toCreate = items.filter((i) => !existingBySku.has(i.sku));
    const toUpdate = items.filter((i) => existingBySku.has(i.sku));

    // Muestra de cambios (antes/después) para poder revisar antes de confirmar — sobre
    // todo útil en dryRun, donde todavía no se tocó nada en la base.
    const sample = toUpdate.slice(0, 30).map((it) => {
      const current = existingBySku.get(it.sku)!;
      return { sku: it.sku, name: current.name, oldPrice: Number(current.price), newPrice: it.price };
    });

    if (!dryRun && items.length) {
      // En chunks: una sola sentencia con las 10.000+ filas se pasa del límite de
      // parámetros de Postgres (65535).
      const CHUNK = 1000;
      for (let i = 0; i < items.length; i += CHUNK) {
        const chunk = items.slice(i, i + CHUNK);
        const values = Prisma.join(
          chunk.map((it) => Prisma.sql`(${`prod_${it.sku}`}, ${it.name}, ${it.sku}, ${it.category}, ${it.brand}, ${it.units}, ${it.price}::numeric)`),
          ',',
        );
        await this.prisma.$executeRaw`
          INSERT INTO "Product" (id, name, sku, category, brand, "unitsPerBulk", price, stock, "isActive", "createdAt", "updatedAt")
          SELECT id, name, sku, category, brand, "unitsPerBulk", price, 0, true, now(), now()
          FROM (VALUES ${values}) AS v(id, name, sku, category, brand, "unitsPerBulk", price)
          ON CONFLICT (sku) DO UPDATE SET
            price = EXCLUDED.price,
            name = EXCLUDED.name,
            category = EXCLUDED.category,
            brand = EXCLUDED.brand,
            "unitsPerBulk" = EXCLUDED."unitsPerBulk",
            "updatedAt" = now()
        `;
      }
    }

    return {
      dryRun,
      created: toCreate.length,
      updated: toUpdate.length,
      requested: items.length,
      sample,
      skippedNoSku,
      skippedBadPrice,
    };
  }
}
