import { PartialType } from '@nestjs/mapped-types';
import { CreateDarkStoreVapeDto } from './create-dark-store-vape.dto';
export class UpdateDarkStoreVapeDto extends PartialType(CreateDarkStoreVapeDto) {}
