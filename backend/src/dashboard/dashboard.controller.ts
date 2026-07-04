import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  // Un vendedor solo ve sus propios números; admin/supervisor ven el negocio completo.
  @Get('overview')
  overview(@CurrentUser() user: any) {
    return this.dashboard.overview(user.role === 'VENDEDOR' ? user.id : undefined);
  }

  @Get('follow-ups') followUps() { return this.dashboard.followUpsBoard(); }
}
