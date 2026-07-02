import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CampaignsService } from './campaigns.service';
import { CreateCampaignDto } from './dto/create-campaign.dto';

@ApiTags('Campañas')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('campaigns')
export class CampaignsController {
  constructor(private readonly campaigns: CampaignsService) {}

  @Get() findAll() { return this.campaigns.findAll(); }
  @Get(':id') findOne(@Param('id') id: string) { return this.campaigns.findOne(id); }

  @Post('preview')
  preview(@Body('filters') filters: any, @Body('mode') mode?: 'ACTIVE_WINDOW' | 'TEMPLATE') {
    return this.campaigns.previewSegment(filters, mode);
  }

  @Post()
  create(@Body() dto: CreateCampaignDto, @CurrentUser('id') userId: string) {
    return this.campaigns.create(dto, userId);
  }

  @UseGuards(RolesGuard)
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Post(':id/send')
  send(@Param('id') id: string) {
    return this.campaigns.send(id);
  }
}
