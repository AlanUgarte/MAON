import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsBoolean, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateProductDto {
  @ApiProperty() @IsString() name: string;
  @ApiProperty() @IsString() sku: string;
  @ApiPropertyOptional() @IsOptional() @IsString() category?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() brand?: string;
  @ApiPropertyOptional({ description: 'Unidades por bulto' }) @IsOptional() @IsInt() unitsPerBulk?: number;
  @ApiPropertyOptional({ description: 'Margen de ganancia % del artículo' }) @IsOptional() @IsNumber() marginPct?: number;
  @ApiProperty() @IsNumber() price: number;
  @ApiPropertyOptional() @IsOptional() @IsNumber() cost?: number;
  @ApiPropertyOptional({ default: 0 }) @IsOptional() @IsInt() @Min(0) stock?: number;
  @ApiPropertyOptional() @IsOptional() @IsString() description?: string;
  @ApiPropertyOptional({ type: [String] }) @IsOptional() @IsArray() images?: string[];
  @ApiPropertyOptional({ default: true }) @IsOptional() @IsBoolean() isActive?: boolean;
}
