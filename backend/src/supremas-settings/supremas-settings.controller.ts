import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SupremasSettingsService } from './supremas-settings.service';
import { UpdateSupremasSettingsDto } from './dto/update-supremas-settings.dto';

@ApiTags('Supremas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('supremas-settings')
export class SupremasSettingsController {
  constructor(private readonly settings: SupremasSettingsService) {}

  // Cualquier rol autenticado: el form de Nueva Venta necesita los precios por tramo.
  @Get() get() {
    return this.settings.get();
  }

  // Editar precios/costos/rendimiento es solo admin/supervisor (punto 24 del pedido).
  @UseGuards(RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch() update(@Body() dto: UpdateSupremasSettingsDto) {
    return this.settings.update(dto);
  }
}
