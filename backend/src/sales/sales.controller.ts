import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SalesService } from './sales.service';
import { CreateSaleDto, CreateStorefrontSaleDto } from './dto/create-sale.dto';

@ApiTags('Ventas / Pedidos')
@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get() findAll() { return this.sales.findAll(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('units-by-product') units() { return this.sales.unitsByProduct(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Post() create(@Body() dto: CreateSaleDto) { return this.sales.create(dto); }

  // Pública: la tienda online no tiene sesión. Identifica productos por SKU.
  // Límite propio (8/min por IP) porque es el único endpoint de escritura sin login.
  @UseGuards(ThrottlerGuard) @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post('storefront') createStorefront(@Body() dto: CreateStorefrontSaleDto) {
    return this.sales.createFromStorefront(dto);
  }
}
