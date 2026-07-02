import {
  Body, Controller, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ConversationsService } from './conversations.service';

@ApiTags('Bandeja / Conversaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class ConversationsController {
  constructor(private readonly conversations: ConversationsService) {}

  @Get()
  list(
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('stage') stage?: string,
  ) {
    return this.conversations.list({ search, status, stage });
  }

  @Get(':id/messages')
  messages(@Param('id') id: string) {
    return this.conversations.messages(id);
  }

  @Post(':id/messages')
  send(
    @Param('id') id: string,
    @Body('content') content: string,
    @CurrentUser('id') sellerId: string,
  ) {
    return this.conversations.sendMessage(id, content, 'VENDEDOR', sellerId);
  }

  @Patch(':id/assign')
  assign(@Param('id') clientId: string, @Body('sellerId') sellerId: string) {
    return this.conversations.assignSeller(clientId, sellerId);
  }
}
