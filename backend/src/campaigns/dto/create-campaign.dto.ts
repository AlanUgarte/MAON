import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';

export class CreateCampaignDto {
  @ApiProperty({ example: 'Promo Fundas iPhone' })
  @IsString() name: string;

  @ApiProperty({ example: '¡Hola {nombre}! Esta semana 20% off en fundas 📱' })
  @IsString() message: string;

  @ApiPropertyOptional({
    description: 'ACTIVE_WINDOW = gratis (solo conversaciones abiertas) · TEMPLATE = plantilla paga',
    enum: ['ACTIVE_WINDOW', 'TEMPLATE'], default: 'ACTIVE_WINDOW',
  })
  @IsOptional() @IsIn(['ACTIVE_WINDOW', 'TEMPLATE']) mode?: 'ACTIVE_WINDOW' | 'TEMPLATE';

  @ApiPropertyOptional({ description: 'URL de imagen de catálogo (solo modo gratis)' })
  @IsOptional() @IsString() imageUrl?: string;

  @ApiPropertyOptional({ description: 'Plantilla de WhatsApp aprobada (solo modo TEMPLATE)' })
  @IsOptional() @IsString() templateName?: string;

  @ApiPropertyOptional({
    description: 'Filtros de segmento: stage, tag, city, province, productId, silentDays',
    example: { stage: 'INTERESADO' },
  })
  @IsOptional() @IsObject() filters?: Record<string, any>;
}
