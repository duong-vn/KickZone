import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { UsersController } from './users.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [AuthService, AuthGuard, RolesGuard, PrismaService],
  exports: [AuthService, AuthGuard, RolesGuard],
})
export class AuthModule {}

