import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { ComprobantesService } from './comprobantes.service';
import { CreateComprobanteDto } from './dto/create-comprobante.dto';

@ApiTags('Comprobantes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('comprobantes')
export class ComprobantesController {
  constructor(private readonly comprobantes: ComprobantesService) {}

  @Get()
  @ApiOperation({ summary: 'Lista de comprobantes (opcional: por cliente)' })
  findAll(@Query('clientId') clientId?: string) {
    return this.comprobantes.findAll(clientId);
  }

  @Get('libro')
  @ApiOperation({ summary: 'Libro contable con saldo corriente (opcional: por cliente)' })
  libro(@Query('clientId') clientId?: string) {
    return this.comprobantes.libro(clientId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.comprobantes.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Emitir factura, remito o nota de crédito (incluye N/C en blanco)' })
  create(@Body() dto: CreateComprobanteDto) {
    return this.comprobantes.create(dto);
  }
}
