import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class GoogleLoginDto {
  @ApiProperty({ description: 'ID token que devuelve Google Identity Services en el frontend' })
  @IsString()
  idToken: string;
}
