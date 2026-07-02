import { Body, Controller, Delete, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { AutomationsService } from './automations.service';

@ApiTags('Automatizaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('automations')
export class AutomationsController {
  constructor(private readonly automations: AutomationsService) {}

  @Get() findAll() { return this.automations.findAll(); }

  @UseGuards(RolesGuard)
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Post() create(@Body() body: any) { return this.automations.create(body); }

  @UseGuards(RolesGuard)
  @Roles('ADMINISTRADOR', 'SUPERVISOR')
  @Patch(':id') update(@Param('id') id: string, @Body() body: any) { return this.automations.update(id, body); }

  @Patch(':id/toggle') toggle(@Param('id') id: string) { return this.automations.toggle(id); }

  @UseGuards(RolesGuard)
  @Roles('ADMINISTRADOR')
  @Delete(':id') remove(@Param('id') id: string) { return this.automations.remove(id); }
}
