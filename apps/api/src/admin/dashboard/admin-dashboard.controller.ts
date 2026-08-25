import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { user_role } from '../../generated/prisma/client';
import { AdminDashboardService } from './admin-dashboard.service';

@ApiTags('Admin Dashboard')
@ApiBearerAuth()
@Controller('admin/dashboard')
@UseGuards(AuthGuard, RolesGuard)
@Roles(user_role.ADMIN)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Admin: Get dashboard key performance metrics' })
  getStats() {
    return this.dashboardService.getStats();
  }
}
