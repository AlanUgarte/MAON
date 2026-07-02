import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';

@ApiTags('Ventas / Pedidos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('sales')
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get() findAll() { return this.sales.findAll(); }
  @Get('units-by-product') units() { return this.sales.unitsByProduct(); }
  @Post() create(@Body() dto: CreateSaleDto) { return this.sales.create(dto); }
}
