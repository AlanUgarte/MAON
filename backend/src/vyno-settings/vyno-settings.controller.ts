import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { VynoSettingsService } from './vyno-settings.service';
import { UpdateVynoSettingsDto } from './dto/update-vyno-settings.dto';

@ApiTags('Vyno')
@Controller('vyno-settings')
export class VynoSettingsController {
  constructor(private readonly settings: VynoSettingsService) {}

  // Pública: la tienda online necesita costo de envío/alias/textos sin login.
  @Get('public') getPublic() {
    return this.settings.getPublic();
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get() get() {
    return this.settings.get();
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch() update(@Body() dto: UpdateVynoSettingsDto) {
    return this.settings.update(dto);
  }
}
