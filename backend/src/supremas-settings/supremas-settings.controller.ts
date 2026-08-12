import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SupremasSettingsService } from './supremas-settings.service';
import { UpdateSupremasSettingsDto } from './dto/update-supremas-settings.dto';

@ApiTags('Supremas')
@Controller('supremas-settings')
export class SupremasSettingsController {
  constructor(private readonly settings: SupremasSettingsService) {}

  // Pública: la tienda online necesita mostrar precio/mínimo mayorista sin login,
  // pero sin exponer costo de envase ni rendimiento (de ahí se deduce el margen real).
  @Get('public') getPublic() {
    return this.settings.getPublic();
  }

  // Cualquier rol autenticado: el form de Nueva Venta interno necesita todo (precios,
  // costo de envase, rendimiento) para calcular costo/kg.
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get() get() {
    return this.settings.get();
  }

  // Editar precios/costos/rendimiento es solo admin/supervisor (punto 24 del pedido).
  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch() update(@Body() dto: UpdateSupremasSettingsDto) {
    return this.settings.update(dto);
  }
}
