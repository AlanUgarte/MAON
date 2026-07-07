import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UploadedFile, UseGuards, UseInterceptors, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

const MAX_IMPORT_BYTES = 10 * 1024 * 1024; // 10MB, cómodo para una lista de precios completa

// Productos trae cost/marginPct (margen real del negocio) — no es para vendedores,
// que tampoco ven esta pantalla en el frontend (fuera de VENDEDOR_ALLOWED).
@ApiTags('Productos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR', 'SUPERVISOR')
@Controller('products')
export class ProductsController {
  constructor(private readonly products: ProductsService) {}

  @Get() findAll(@Query('search') search?: string) { return this.products.findAll(search); }
  @Get(':id') findOne(@Param('id') id: string) { return this.products.findOne(id); }
  @Post() create(@Body() dto: CreateProductDto) { return this.products.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateProductDto) { return this.products.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.products.remove(id); }

  // Actualiza el costo de los artículos existentes desde la lista de precios del
  // proveedor (Excel). Solo ADMINISTRADOR/SUPERVISOR (mismo Roles que el resto de este
  // controller) — es una escritura masiva sobre datos reales de costo.
  @ApiConsumes('multipart/form-data')
  @Post('import-prices')
  @UseInterceptors(FileInterceptor('file'))
  importPrices(@UploadedFile() file: Express.Multer.File, @Query('dryRun') dryRun?: string) {
    if (!file) throw new BadRequestException('Falta el archivo');
    if (file.size > MAX_IMPORT_BYTES) throw new BadRequestException('El archivo no puede pesar más de 10MB');
    return this.products.importPricesFromExcel(file.buffer, dryRun === 'true');
  }
}
