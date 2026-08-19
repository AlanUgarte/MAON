import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

/** El cliente solo puede "informar" que transfirió — nunca marca el pedido como
 * pagado. Esto mueve el pedido a COMPROBANTE_RECIBIDO, a la espera de que un admin
 * lo verifique a mano. El comprobante es opcional a pedido de Alan: con el nombre
 * del titular alcanza para poder continuar. */
export class ReportPaymentDto {
  @ApiPropertyOptional() @IsOptional() @IsString() @MaxLength(2000) imageUrl?: string;
  @ApiProperty() @IsString() @MaxLength(120) holderName: string;
}
