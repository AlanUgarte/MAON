import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { EstufaSettingsService } from './estufa-settings.service';
import { UpdateEstufaSettingsDto } from './dto/update-estufa-settings.dto';

@ApiTags('Estufa (config pública)')
@Controller('estufa-settings')
export class EstufaSettingsController {
  constructor(private readonly settings: EstufaSettingsService) {}

  // Pública: la landing (/estufa) lee esto sin login.
  @Get() get() {
    return this.settings.get();
  }

  // Editar la config es desde /estufa-config, pantalla logueada (mismo criterio que tienda-config).
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch() update(@Body() dto: UpdateEstufaSettingsDto) {
    return this.settings.update(dto);
  }
}
