import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { TiendaSettingsService } from './tienda-settings.service';
import { UpdateTiendaSettingsDto } from './dto/update-tienda-settings.dto';

@ApiTags('Tienda (config pública)')
@Controller('tienda-settings')
export class TiendaSettingsController {
  constructor(private readonly settings: TiendaSettingsService) {}

  // Pública: la tienda online (/tienda) lee esto sin login.
  @Get() get() {
    return this.settings.get();
  }

  // Editar la config es desde tienda-config, que ya es una pantalla a la que
  // acceden todos los roles logueados (igual que Clientes/Bandeja) — mismo criterio.
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch() update(@Body() dto: UpdateTiendaSettingsDto) {
    return this.settings.update(dto);
  }
}
