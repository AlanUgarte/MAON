import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { SupremasBatchesService } from './supremas-batches.service';
import { CreateSupremasBatchDto } from './dto/create-supremas-batch.dto';

@ApiTags('Supremas')
@Controller('supremas-batches')
export class SupremasBatchesController {
  constructor(private readonly batches: SupremasBatchesService) {}

  // Pública: solo el número de stock, sin detalle de costos — la necesitan tanto el
  // form de venta interno (avisar "sin stock" a un vendedor) como la tienda online
  // pública (avisar disponibilidad a un cliente sin login).
  @Get('stock') stock() { return this.batches.stock(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Get() findAll() { return this.batches.findAll(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Get(':id') findOne(@Param('id') id: string) { return this.batches.findOne(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Post() create(@Body() dto: CreateSupremasBatchDto, @CurrentUser('id') userId: string) {
    return this.batches.create(dto, userId);
  }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Delete(':id') remove(@Param('id') id: string) { return this.batches.remove(id); }
}
