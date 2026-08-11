import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupremasSalesService } from './supremas-sales.service';
import { CreateSupremasSaleDto } from './dto/create-supremas-sale.dto';

// Cualquier rol autenticado puede crear/consultar ventas (punto 24: vendedor sí puede
// vender) — el frontend oculta costo/ganancia/margen para VENDEDOR, mismo patrón que
// ya usa tienda-config para ocultar "Facturar".
@ApiTags('Supremas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('supremas-sales')
export class SupremasSalesController {
  constructor(private readonly sales: SupremasSalesService) {}

  @Get() findAll() { return this.sales.findAll(); }
  @Get('cliente/:clientId') findByClient(@Param('clientId') clientId: string) { return this.sales.findByClient(clientId); }

  @Post()
  create(@Body() dto: CreateSupremasSaleDto, @CurrentUser() user: { id: string; role: string }) {
    const canOverridePrice = user.role === 'ADMINISTRADOR' || user.role === 'SUPERVISOR';
    return this.sales.create(dto, user.id, canOverridePrice);
  }

  // Borrar una venta cargada mal es una corrección administrativa, no una operación de venta.
  @UseGuards(RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Delete(':id') remove(@Param('id') id: string) { return this.sales.remove(id); }
}
