import { Module } from '@nestjs/common';
import { JwtModule, JwtSignOptions } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        if (!secret) throw new Error('JWT_SECRET no está configurado — no se puede iniciar el servidor sin él.');
        return {
          secret,
          signOptions: {
            // @nestjs/jwt 11 tipa expiresIn como StringValue (formato "7d"/"24h", no string
            // genérico) — JWT_EXPIRES_IN sigue siendo config libre en texto, se castea acá.
            expiresIn: (config.get<string>('JWT_EXPIRES_IN') || '7d') as JwtSignOptions['expiresIn'],
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
