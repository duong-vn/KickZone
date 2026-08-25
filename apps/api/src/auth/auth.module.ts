import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { UsersController } from './users.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UsersController],
  providers: [
    AuthService,
    AuthGuard,
    RolesGuard,
    SupabaseAuthService,
    SupabaseAuthGuard,
    PrismaService,
  ],
  exports: [
    AuthService,
    AuthGuard,
    RolesGuard,
    SupabaseAuthService,
    SupabaseAuthGuard,
  ],
})
export class AuthModule {}
