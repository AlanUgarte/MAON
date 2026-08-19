import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { InsumosSettingsService } from './insumos-settings.service';
import { UpdateInsumosSettingsDto } from './dto/update-insumos-settings.dto';

@ApiTags('Insumos')
@Controller('insumos-settings')
export class InsumosSettingsController {
  constructor(private readonly settings: InsumosSettingsService) {}

  // Pública: la tienda online necesita costo de envío/alias/textos sin login.
  @Get('public') getPublic() {
    return this.settings.getPublic();
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard)
  @Get() get() {
    return this.settings.get();
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch() update(@Body() dto: UpdateInsumosSettingsDto) {
    return this.settings.update(dto);
  }
}
