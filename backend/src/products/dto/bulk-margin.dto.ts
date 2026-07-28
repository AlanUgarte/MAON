import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class BulkMarginDto {
  @ApiProperty({ description: 'Margen de ganancia % a aplicar' })
  @IsNumber()
  marginPct: number;

  @ApiPropertyOptional({ description: 'Si se pasa, solo aplica a esta marca' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ description: 'Si se pasa, solo aplica a esta categoría' })
  @IsOptional()
  @IsString()
  category?: string;
}
