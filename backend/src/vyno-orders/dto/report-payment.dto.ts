import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, MaxLength } from 'class-validator';

/** El cliente solo puede "informar" que transfirió — nunca marca el pedido como
 * pagado. Esto únicamente sube el comprobante y mueve el pedido a
 * COMPROBANTE_RECIBIDO, a la espera de que un admin lo verifique a mano. */
export class ReportPaymentDto {
  @ApiProperty() @IsString() @MaxLength(2000) imageUrl: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(60) operationNumber?: string;
  @ApiPropertyOptional() @IsOptional() @IsDateString() transferredAt?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(120) holderName?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(500) comment?: string;
}
