import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

// PAGO_VERIFICADO tiene su propio endpoint dedicado (aprobarPago) que además graba
// quién y cuándo aprobó — acá van el resto de las transiciones manuales del admin.
export const VYNO_ADMIN_STATUSES = [
  'LISTO_PARA_DESPACHAR', 'DESPACHADO', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO',
] as const;

export class SetVynoOrderStatusDto {
  @ApiProperty({ enum: VYNO_ADMIN_STATUSES })
  @IsIn(VYNO_ADMIN_STATUSES)
  status: (typeof VYNO_ADMIN_STATUSES)[number];

  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) trackingNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) carrier?: string;
}
