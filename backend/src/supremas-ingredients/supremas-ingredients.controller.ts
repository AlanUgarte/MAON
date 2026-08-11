import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { SupremasIngredientsService } from './supremas-ingredients.service';
import { CreateSupremasIngredientDto } from './dto/create-supremas-ingredient.dto';
import { UpdateSupremasIngredientDto } from './dto/update-supremas-ingredient.dto';

// Trae costos reales de compra — igual que Productos, no es para vendedores
// (tampoco lo ven en el frontend: no entra en VENDEDOR_ALLOWED).
@ApiTags('Supremas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMINISTRADOR', 'SUPERVISOR')
@Controller('supremas-ingredients')
export class SupremasIngredientsController {
  constructor(private readonly ingredients: SupremasIngredientsService) {}

  @Get() findAll() { return this.ingredients.findAll(); }
  @Get('costeo') costeo() { return this.ingredients.costeo(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.ingredients.findOne(id); }
  @Post() create(@Body() dto: CreateSupremasIngredientDto) { return this.ingredients.create(dto); }
  @Patch(':id') update(@Param('id') id: string, @Body() dto: UpdateSupremasIngredientDto) { return this.ingredients.update(id, dto); }
  @Delete(':id') remove(@Param('id') id: string) { return this.ingredients.remove(id); }
}
