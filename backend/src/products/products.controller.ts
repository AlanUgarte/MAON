import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiTags('Productos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get() findAll(@Query('search') search?: string) { return this.products.findAll(search); }
  @Get(':id') findOne(@Param('id') id: string) { return this.products.findOne(id); }
  @Post() create(@Body() dto: CreateProductDto) { return this.products.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateProductDto) { return this.products.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.products.remove(id); }
}
