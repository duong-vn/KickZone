import {
  Body,
  Controller,
  Get,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from './current-user.decorator';
import { GetActivitiesQueryDto } from './dto/get-activities-query.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import type { profiles } from '../generated/prisma/client';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly authService: AuthService) {}

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

  @Patch('me')
  @ApiOperation({ summary: 'Update current logged-in user profile' })
  async updateMe(
    @Body() dto: UpdateProfileDto,
    @CurrentUser() profile: profiles,
  ) {
    const updated = await this.authService.updateProfile(profile.id, dto);
    return {
      id: updated.id,
      authUserId: updated.auth_user_id,
      email: updated.email,
      fullName: updated.full_name,
      phone: updated.phone,
      avatarUrl: updated.avatar_path,
      role: updated.role,
      status: updated.status,
      createdAt: updated.created_at,
      updatedAt: updated.updated_at,
    };
  }

  @Get('me/activities')
  @ApiOperation({ summary: 'Get current user activity timeline' })
  getActivities(
    @Query() query: GetActivitiesQueryDto,
    @CurrentUser() profile: profiles,
  ) {
    return this.authService.getUserActivities(profile.id, query);
  }
}

