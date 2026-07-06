import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Railway mete la request por varios saltos de proxy internos (cantidad no documentada/
  // estable) antes de llegar acá — con un número fijo de saltos, cada request puede terminar
  // "confiando" en un hop distinto y el rate-limit por IP nunca ve la misma IP dos veces.
  // 'true' confía en toda la cadena y toma el primer valor de X-Forwarded-For (el cliente real).
  app.getHttpAdapter().getInstance().set('trust proxy', true);

  app.setGlobalPrefix('api');
  app.enableCors({
    origin: (process.env.CORS_ORIGIN || 'http://localhost:3000').split(','),
    credentials: true,
  });
  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
  );

  const config = new DocumentBuilder()
    .setTitle('CRM Comercial API')
    .setDescription('WhatsApp Business + Meta Ads + IA (Claude)')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`🚀 API lista en http://localhost:${port}/api  ·  Docs: /docs`);
}
bootstrap();
