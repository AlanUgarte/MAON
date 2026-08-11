import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsOptional, IsString, Min, MaxLength } from 'class-validator';

export class CreateSupremasBatchDto {
  @ApiPropertyOptional() @IsOptional() @IsDateString() fecha?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(40) lote?: string;
  @ApiProperty() @IsNumber() @Min(0.001) kgProducidos: number;
  @ApiProperty() @IsNumber() @Min(0) costoTotal: number;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) observaciones?: string;
}
