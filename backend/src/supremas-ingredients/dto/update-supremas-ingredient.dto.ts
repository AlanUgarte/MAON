import { PartialType } from '@nestjs/mapped-types';
import { CreateSupremasIngredientDto } from './create-supremas-ingredient.dto';

export class UpdateSupremasIngredientDto extends PartialType(CreateSupremasIngredientDto) {}
