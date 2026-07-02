import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, IsInt } from 'class-validator';
import { Type } from 'class-transformer';
import { ClientStage } from '@prisma/client';

export class QueryClientsDto {
  @ApiPropertyOptional() @IsOptional() @IsString() search?: string;
  @ApiPropertyOptional({ enum: ClientStage }) @IsOptional() @IsEnum(ClientStage) stage?: ClientStage;
  @ApiPropertyOptional() @IsOptional() @IsString() tag?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() city?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() province?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() productId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() sellerId?: string;
  @ApiPropertyOptional({ description: 'Días sin contacto (ej: 7, 30)' })
  @IsOptional() @Type(() => Number) @IsInt() silentDays?: number;
  @ApiPropertyOptional({ default: 1 }) @IsOptional() @Type(() => Number) @IsInt() page?: number;
  @ApiPropertyOptional({ default: 25 }) @IsOptional() @Type(() => Number) @IsInt() pageSize?: number;
}
