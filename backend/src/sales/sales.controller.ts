import { Body, Controller, Get, Param, Patch, Post, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SalesService } from './sales.service';
import { CreateSaleDto, CreateStorefrontSaleDto, MarkInvoicedDto, SetSaleStatusDto } from './dto/create-sale.dto';

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

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch(':id/invoice')
  markInvoiced(@Param('id') id: string, @Body() dto: MarkInvoicedDto) {
    return this.sales.markInvoiced(id, dto.comprobanteNumero);
  }

  // El vendedor confirma a mano que la transferencia llegó a la cuenta real.
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch(':id/payment/confirm')
  confirmPayment(@Param('id') id: string) {
    return this.sales.confirmPayment(id);
  }

  // Dark Store: marca el pedido "en camino" y le avisa al cliente por WhatsApp.
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch(':id/ship')
  markShipped(@Param('id') id: string) {
    return this.sales.markShipped(id);
  }

  // Dark Store: marca el pedido como entregado y le avisa al cliente por WhatsApp.
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch(':id/deliver')
  markDelivered(@Param('id') id: string) {
    return this.sales.markDelivered(id);
  }

  // Dark Store: cambio de estado libre (Preparando/En camino/Entregado) desde el
  // desplegable de Pedidos — a diferencia de /ship y /deliver, puede ir para cualquier lado.
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  setStatus(@Param('id') id: string, @Body() dto: SetSaleStatusDto) {
    return this.sales.setStatus(id, dto.status);
  }

  // Pública: la pantalla de confirmación de Dark Store no tiene sesión — el id de venta
  // (cuid) no es adivinable, así que sirve como token de acceso al remito de ese pedido.
  @Get(':id/remito')
  async remito(@Param('id') id: string, @Res() res: Response) {
    const { filename, pdf } = await this.sales.getRemitoPdf(id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${filename}"`);
    res.send(pdf);
  }

  // Pública: alimenta la barra de seguimiento del pedido en la pantalla de confirmación.
  @Get(':id/status')
  status(@Param('id') id: string) {
    return this.sales.getStatus(id);
  }
}
