import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { VynoProductsService } from './vyno-products.service';
import { CreateVynoProductDto } from './dto/create-vyno-product.dto';
import { UpdateVynoProductDto } from './dto/update-vyno-product.dto';

@ApiTags('Vyno')
@Controller('vyno-products')
export class VynoProductsController {
  constructor(private readonly products: VynoProductsService) {}

  @Get('public') findPublic() { return this.products.findPublic(); }
  @Get('public/:slug') findPublicBySlug(@Param('slug') slug: string) { return this.products.findPublicBySlug(slug); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Get() findAll() { return this.products.findAll(); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Get(':id') findOne(@Param('id') id: string) { return this.products.findOne(id); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Post() create(@Body() dto: CreateVynoProductDto) { return this.products.create(dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateVynoProductDto) { return this.products.update(id, dto); }

  @ApiBearerAuth() @UseGuards(JwtAuthGuard, RolesGuard) @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Delete(':id') remove(@Param('id') id: string) { return this.products.remove(id); }
}
