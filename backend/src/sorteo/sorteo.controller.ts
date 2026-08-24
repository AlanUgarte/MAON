import {
  Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, Put, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SorteoService } from './sorteo.service';
import {
  AttachReceiptDto, CreateSorteoOrderDto, CreateSorteoWinnerDto, ReplaceSorteoPackagesDto,
  UpdateSorteoSettingsDto,
} from './dto/sorteo.dto';

@ApiTags('Sorteo')
@Controller('sorteo')
export class SorteoController {
  constructor(private readonly sorteo: SorteoService) {}

  // ------------------------- público -------------------------

  // La landing entera (premio, paquetes, progreso, números bendecidos, ganadores).
  @Get('public') publicView() { return this.sorteo.publicView(); }

  // Compra sin login. Límite propio por IP, mismo criterio que el resto de los storefronts.
  @UseGuards(ThrottlerGuard) @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post('orders') createOrder(@Body() dto: CreateSorteoOrderDto) { return this.sorteo.createOrder(dto); }

  // El comprador adjunta el comprobante ya subido a Blob, con el id de su compra.
  @UseGuards(ThrottlerGuard) @Throttle({ default: { ttl: 60_000, limit: 8 } })
  @Post('orders/:id/receipt') attachReceipt(@Param('id') id: string, @Body() dto: AttachReceiptDto) {
    return this.sorteo.attachReceipt(id, dto);
  }

  // Comprobante de compra — el id (cuid) funciona como token de acceso.
  @Get('orders/:id/public') orderPublic(@Param('id') id: string) { return this.sorteo.orderPublic(id); }

  // "¿Cuáles son mis números?" — coincidencia exacta por email o teléfono.
  @UseGuards(ThrottlerGuard) @Throttle({ default: { ttl: 60_000, limit: 12 } })
  @Get('lookup') lookup(@Query('q') q: string) { return this.sorteo.lookup(q); }

  // ------------------------- admin -------------------------

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('settings') settings() { return this.sorteo.settings(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch('settings') updateSettings(@Body() dto: UpdateSorteoSettingsDto) {
    return this.sorteo.updateSettings(dto);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR')
  @Post('settings/next-edition') nextEdition() { return this.sorteo.nextEdition(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get('packages') packages() { return this.sorteo.packages(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Put('packages') replacePackages(@Body() dto: ReplaceSorteoPackagesDto) {
    return this.sorteo.replacePackages(dto);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Get('orders') orders(@Query('status') status?: string, @Query('q') q?: string) {
    return this.sorteo.findOrders(status, q);
  }

  // Aprobar la transferencia es SIEMPRE una acción de admin: es el único momento en
  // que se asignan los números, nunca se confía en que el comprador diga "ya pagué".
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch('orders/:id/approve') approve(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.sorteo.approveOrder(id, userId);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch('orders/:id/reject') reject(@Param('id') id: string) { return this.sorteo.rejectOrder(id); }

  // El día del sorteo: número de la quiniela -> comprador.
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Get('numbers/:number') whoOwns(@Param('number', ParseIntPipe) number: number) {
    return this.sorteo.whoOwns(number);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Post('winners') createWinner(@Body() dto: CreateSorteoWinnerDto) { return this.sorteo.createWinner(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Delete('winners/:id') deleteWinner(@Param('id') id: string) { return this.sorteo.deleteWinner(id); }
}
