import { Global, Module } from '@nestjs/common';
import { CartsModule } from '../carts/carts.module';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';

@Global()
@Module({
  imports: [CartsModule],
  providers: [AIService],
  controllers: [AIController],
  exports: [AIService],
})
export class AIModule {}
