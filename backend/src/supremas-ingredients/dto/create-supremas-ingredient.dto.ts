import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateSupremasIngredientDto {
  @ApiProperty() @IsString() @MaxLength(80) name: string;
  @ApiProperty() @IsNumber() @Min(0.001) purchaseQty: number;
  @ApiProperty() @IsString() @MaxLength(20) unit: string;
  @ApiProperty() @IsNumber() @Min(0) purchasePrice: number;
  @ApiProperty() @IsNumber() @Min(0) usedQty: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(80) supplier?: string;
}
