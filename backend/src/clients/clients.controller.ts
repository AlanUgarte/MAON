import {
  Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ClientsService } from './clients.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientsDto } from './dto/query-clients.dto';

@ApiTags('Clientes (CRM)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('clients')
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  findAll(@Query() q: QueryClientsDto) {
    return this.clients.findAll(q);
  }

  @Get('pipeline')
  pipeline() {
    return this.clients.pipeline();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.clients.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateClientDto) {
    return this.clients.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateClientDto) {
    return this.clients.update(id, dto);
  }

  @Patch(':id/stage')
  updateStage(@Param('id') id: string, @Body('stage') stage: string) {
    return this.clients.updateStage(id, stage);
  }

  @Post(':id/notes')
  addNote(
    @Param('id') id: string,
    @Body('content') content: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.clients.addNote(id, content, userId);
  }

  @Patch(':id/tags')
  setTags(@Param('id') id: string, @Body('tagIds') tagIds: string[]) {
    return this.clients.setTags(id, tagIds);
  }

  // Borrar un cliente arrastra en cascada sus conversaciones/mensajes/notas — solo admin.
  @UseGuards(RolesGuard) @Roles('ADMINISTRADOR')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.clients.remove(id);
  }
}
