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

export class StorefrontSaleItemDto {
  @ApiProperty() @IsString() sku: string;
  @ApiProperty() @IsInt() @Min(1) quantity: number;
}

/** Pedido armado en la tienda pública (sin login): identifica productos por SKU, no por id. */
export class CreateStorefrontSaleDto {
  @ApiProperty() @IsString() customerName: string;
  @ApiProperty() @IsString() customerPhone: string;
  @ApiProperty({ required: false }) @IsOptional() @IsString() sellerName?: string;
  @ApiProperty({ type: [StorefrontSaleItemDto] })
  @IsArray() @ValidateNested({ each: true }) @Type(() => StorefrontSaleItemDto)
  items: StorefrontSaleItemDto[];
}
