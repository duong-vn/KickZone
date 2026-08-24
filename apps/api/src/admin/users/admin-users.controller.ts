import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../auth/auth.guard';
import { Roles } from '../../auth/roles.decorator';
import { RolesGuard } from '../../auth/roles.guard';
import { AdminUsersService } from './admin-users.service';
import { CreateUserDto } from './dto/create-user.dto';

@ApiTags('Admin Users')
@ApiBearerAuth()
@Controller('admin/users')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @Get()
  @ApiOperation({ summary: 'Admin: Get list of users with filters' })
  findAll(
    @Query('search') search?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminUsersService.findAll({
      search,
      role,
      status,
      page,
      limit,
    });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Admin: Get user details by ID' })
  findOne(@Param('id') id: string) {
    return this.adminUsersService.findOne(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Admin: Create a new user in Supabase Auth and database',
  })
  createUser(@Body() dto: CreateUserDto) {
    return this.adminUsersService.createUser(dto);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Admin: Update user active/inactive status' })
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: 'ACTIVE' | 'INACTIVE' },
  ) {
    return this.adminUsersService.updateStatus(id, body.status);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Admin: Update user profile' })
  updateUser(
    @Param('id') id: string,
    @Body()
    body: {
      fullName?: string;
      phone?: string;
      role?: 'USER' | 'ADMIN';
      status?: 'ACTIVE' | 'INACTIVE';
    },
  ) {
    return this.adminUsersService.updateUser(id, body);
  }
}
