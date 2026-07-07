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
   * Actualiza el costo (price) de los artículos existentes a partir de una lista de
   * precios del proveedor (Excel "SAP Movil"). Formato esperado: hoja con columnas
   * Categoría, Código, Nombre, Marca, Línea, ..., BRUTO BULTO, BRUTO UNIDAD, ...
   * Solo actualiza `price` de productos que ya existen (matcheados por sku/Código);
   * no crea productos nuevos ni toca nombre/stock/categoría.
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
    const skuCol = header.indexOf('Código');
    const priceCol = header.indexOf('BRUTO BULTO');
    if (skuCol === -1 || priceCol === -1) {
      throw new BadRequestException('Faltan las columnas "Código" y/o "BRUTO BULTO" en el archivo');
    }

    const items: { sku: string; price: number }[] = [];
    let skippedNoSku = 0, skippedBadPrice = 0;
    for (let i = headerIdx + 1; i < rows.length; i++) {
      const row = rows[i];
      const sku = String(row[skuCol] ?? '').trim();
      if (!sku) { skippedNoSku++; continue; } // filas de encabezado de rubro, sin código
      const raw = row[priceCol];
      const price = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
      if (!isFinite(price) || price <= 0) { skippedBadPrice++; continue; }
      items.push({ sku, price: Math.round(price * 100) / 100 });
    }
    if (!items.length) throw new BadRequestException('No se encontró ningún artículo con código y precio válidos');

    const skus = items.map((i) => i.sku);
    const existing = await this.prisma.product.findMany({ where: { sku: { in: skus } }, select: { sku: true, name: true, price: true } });
    const existingBySku = new Map(existing.map((p) => [p.sku, p]));
    const notFound = items.filter((i) => !existingBySku.has(i.sku));
    const toUpdate = items.filter((i) => existingBySku.has(i.sku));

    // Muestra de cambios (antes/después) para poder revisar antes de confirmar — sobre
    // todo útil en dryRun, donde todavía no se tocó nada en la base.
    const sample = toUpdate.slice(0, 30).map((it) => {
      const current = existingBySku.get(it.sku)!;
      return { sku: it.sku, name: current.name, oldPrice: Number(current.price), newPrice: it.price };
    });

    let updated = 0;
    if (!dryRun && toUpdate.length) {
      const values = Prisma.join(
        toUpdate.map((it) => Prisma.sql`(${it.sku}, ${it.price}::numeric)`),
        ',',
      );
      updated = await this.prisma.$executeRaw`
        UPDATE "Product" AS p SET price = v.price, "updatedAt" = now()
        FROM (VALUES ${values}) AS v(sku, price)
        WHERE p.sku = v.sku
      `;
    }

    return {
      dryRun,
      updated,
      toUpdateCount: toUpdate.length,
      requested: items.length,
      notFoundCount: notFound.length,
      notFoundSample: notFound.slice(0, 30).map((i) => ({ sku: i.sku })),
      sample,
      skippedNoSku,
      skippedBadPrice,
    };
  }
}
