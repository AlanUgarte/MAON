import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateDarkStoreVapeDto {
  @ApiProperty() @IsString() name: string;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
  @ApiProperty({ description: 'Precio de venta final, sin margen (lo pone el admin directo)' }) @IsNumber() price: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) stock?: number;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() images?: string[];
  @ApiPropertyOptional({ type: [String], description: 'Sabores/variantes — si hay más de uno, el detalle muestra un desplegable' })
  @IsOptional() @IsArray() @IsString({ each: true }) flavors?: string[];
  @ApiPropertyOptional({ default: false }) @IsOptional() @IsBoolean() featured?: boolean;
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}
