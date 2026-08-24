import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import type { profiles } from '../generated/prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  @Get('me')
  @ApiOperation({ summary: 'Get current logged-in user profile' })
  getMe(@CurrentUser() profile: profiles) {
    return {
      id: profile.id,
      authUserId: profile.auth_user_id,
      email: profile.email,
      fullName: profile.full_name,
      phone: profile.phone,
      avatarUrl: profile.avatar_path,
      role: profile.role,
      status: profile.status,
      createdAt: profile.created_at,
      updatedAt: profile.updated_at,
    };
  }
}
