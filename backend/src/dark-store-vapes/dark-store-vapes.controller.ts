import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { DarkStoreVapesService } from './dark-store-vapes.service';
import { CreateDarkStoreVapeDto } from './dto/create-dark-store-vape.dto';
import { UpdateDarkStoreVapeDto } from './dto/update-dark-store-vape.dto';

// Vapeadores es administrado a mano (no viene del maestro del proveedor) — el catálogo
// público es de solo lectura y sin login; el CRUD queda atrás de auth como el resto de
// Productos.
@ApiTags('Dark Store · Vapeadores')
@Controller('dark-store-vapes')
export class DarkStoreVapesController {
  constructor(private readonly vapes: DarkStoreVapesService) {}

  @Get('public') findPublic() { return this.vapes.findPublic(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Get() findAll() { return this.vapes.findAll(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Get(':id') findOne(@Param('id') id: string) { return this.vapes.findOne(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Post() create(@Body() dto: CreateDarkStoreVapeDto) { return this.vapes.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateDarkStoreVapeDto) { return this.vapes.update(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Delete(':id') remove(@Param('id') id: string) { return this.vapes.remove(id); }
}
