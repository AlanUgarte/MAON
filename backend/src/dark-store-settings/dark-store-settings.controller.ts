import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { DarkStoreSettingsService } from './dark-store-settings.service';
import { UpdateDarkStoreSettingsDto } from './dto/update-dark-store-settings.dto';

@ApiTags('Dark Store (config pública)')
@Controller('dark-store-settings')
export class DarkStoreSettingsController {
  constructor(private readonly settings: DarkStoreSettingsService) {}

  // Pública: la tienda online (/dark-store) lee esto sin login.
  @Get() get() {
    return this.settings.get();
  }

  // Editar la config es desde el panel admin, pantalla logueada.
  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Patch() update(@Body() dto: UpdateDarkStoreSettingsDto) {
    return this.settings.update(dto);
  }
}
