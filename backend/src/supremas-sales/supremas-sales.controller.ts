import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupremasSalesService } from './supremas-sales.service';
import { CreateSupremasSaleDto } from './dto/create-supremas-sale.dto';
import { CreateSupremasStorefrontSaleDto } from './dto/create-supremas-storefront-sale.dto';

// Cualquier rol autenticado puede crear/consultar ventas (punto 24: vendedor sí puede
// vender) — el frontend oculta costo/ganancia/margen para VENDEDOR, mismo patrón que
// ya usa tienda-config para ocultar "Facturar". La ruta 'storefront' es la única pública
// (tienda online sin login), igual que /sales/storefront.
@ApiTags('Supremas')
@Controller('supremas-sales')
export class SupremasSalesController {
  constructor(private readonly sales: SupremasSalesService) {}

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get() findAll() { return this.sales.findAll(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('cliente/:clientId') findByClient(@Param('clientId') clientId: string) { return this.sales.findByClient(clientId); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateSupremasSaleDto, @CurrentUser() user: { id: string; role: string }) {
    const canOverridePrice = user.role === 'ADMINISTRADOR' || user.role === 'SUPERVISOR';
    return this.sales.create(dto, user.id, canOverridePrice);
  }

  // Pública: la tienda online de Supremas no tiene sesión. Límite propio (8/min por IP),
  // igual que /sales/storefront — es el único endpoint de escritura sin login acá.
  @UseGuards(ThrottlerGuard) @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post('storefront')
  createStorefront(@Body() dto: CreateSupremasStorefrontSaleDto) {
    return this.sales.createFromStorefront(dto);
  }

  // Borrar una venta cargada mal es una corrección administrativa, no una operación de venta.
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Delete(':id') remove(@Param('id') id: string) { return this.sales.remove(id); }
}
