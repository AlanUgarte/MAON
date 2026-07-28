import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CotillonSettingsService } from './cotillon-settings.service';
import { UpdateCotillonSettingsDto } from './dto/update-cotillon-settings.dto';

@ApiTags('Cotillón (config pública)')
@Controller('cotillon-settings')
export class CotillonSettingsController {
  constructor(private readonly settings: CotillonSettingsService) {}

  // Pública: la tienda online (/cotillon) lee esto sin login.
  @Get() get() {
    return this.settings.get();
  }

  // Editar la config es desde cotillon-config, pantalla logueada (mismo criterio que tienda-config).
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch() update(@Body() dto: UpdateCotillonSettingsDto) {
    return this.settings.update(dto);
  }
}
