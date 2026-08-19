import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { InsumosProductsService } from './insumos-products.service';
import { CreateInsumosProductDto } from './dto/create-insumos-product.dto';
import { UpdateInsumosProductDto } from './dto/update-insumos-product.dto';

@ApiTags('Insumos')
@Controller('insumos-products')
export class InsumosProductsController {
  constructor(private readonly products: InsumosProductsService) {}

  @Get('public') findPublic() { return this.products.findPublic(); }
  @Get('public/:slug') findPublicBySlug(@Param('slug') slug: string) { return this.products.findPublicBySlug(slug); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Get() findAll() { return this.products.findAll(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Get(':id') findOne(@Param('id') id: string) { return this.products.findOne(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Post() create(@Body() dto: CreateInsumosProductDto) { return this.products.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateInsumosProductDto) { return this.products.update(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Delete(':id') remove(@Param('id') id: string) { return this.products.remove(id); }
}
