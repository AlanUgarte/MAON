import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString, ValidateNested, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SaleItemDto {
  @ApiProperty() @IsString() productId: string;
  @ApiProperty() @IsInt() @Min(1) quantity: number;
}

export class CreateSaleDto {
  @ApiProperty() @IsString() clientId: string;
  @ApiProperty({ type: [SaleItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => SaleItemDto)
  items: SaleItemDto[];
  @ApiProperty({ required: false }) @IsOptional() @IsString() sellerId?: string;
}
