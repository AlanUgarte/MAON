import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { InsumosOrdersService } from './insumos-orders.service';
import { CreateInsumosOrderDto } from './dto/create-insumos-order.dto';
import { ReportPaymentDto } from './dto/report-payment.dto';
import { SetInsumosOrderStatusDto } from './dto/set-order-status.dto';

@ApiTags('Insumos')
@Controller('insumos-orders')
export class InsumosOrdersController {
  constructor(private readonly orders: InsumosOrdersService) {}

  // Pública: checkout sin login. Límite propio (8/min por IP), mismo criterio que
  // el resto de los storefronts — es el único endpoint de escritura sin login acá.
  @UseGuards(ThrottlerGuard) @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post() create(@Body() dto: CreateInsumosOrderDto) { return this.orders.create(dto); }

  // Pública: el cliente informa la transferencia y sube el comprobante ya subido a Blob.
  @UseGuards(ThrottlerGuard) @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post(':id/payment') reportPayment(@Param('id') id: string, @Body() dto: ReportPaymentDto) {
    return this.orders.reportPayment(id, dto);
  }

  // Pública: pantalla de confirmación/seguimiento — el id (cuid) funciona como token.
  @Get(':id/public') findPublic(@Param('id') id: string) { return this.orders.findPublic(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Get() findAll(@Query('status') status?: string) { return this.orders.findAll(status); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Get(':id') findOne(@Param('id') id: string) { return this.orders.findOne(id); }

  // Aprobar el pago es SIEMPRE una acción de admin — nunca se confía en el frontend
  // ni en que el cliente diga "ya pagué" para marcar el pedido como pagado de verdad.
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch(':id/approve') approve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.orders.approvePayment(id, userId);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch(':id/status') setStatus(@Param('id') id: string, @Body() dto: SetInsumosOrderStatusDto) {
    return this.orders.setStatus(id, dto);
  }
}
