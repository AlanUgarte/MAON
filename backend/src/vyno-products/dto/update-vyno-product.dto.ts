import { PartialType } from '@nestjs/mapped-types';
import { CreateVynoProductDto } from './create-vyno-product.dto';

export class UpdateVynoProductDto extends PartialType(CreateVynoProductDto) {}
