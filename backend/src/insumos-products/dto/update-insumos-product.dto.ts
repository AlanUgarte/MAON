import { PartialType } from '@nestjs/mapped-types';
import { CreateInsumosProductDto } from './create-insumos-product.dto';

export class UpdateInsumosProductDto extends PartialType(CreateInsumosProductDto) {}
