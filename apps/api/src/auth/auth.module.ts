import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { RolesGuard } from './roles.guard';
import { SupabaseAuthService } from './supabase-auth.service';
import { SupabaseAuthGuard } from './supabase-auth.guard';
import { UsersController } from './users.controller';
import { AuthController } from './auth.controller';
import { PasswordResetService } from './password-reset.service';
import { OAuthService } from './oauth.service';
import { EmailService } from '../email/email.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [UsersController, AuthController],
  providers: [
    AuthService,
    PasswordResetService,
    OAuthService,
    EmailService,
    AuthGuard,
    RolesGuard,
    SupabaseAuthService,
    SupabaseAuthGuard,
    PrismaService,
  ],
  exports: [
    AuthService,
    PasswordResetService,
    OAuthService,
    AuthGuard,
    RolesGuard,
    SupabaseAuthService,
    SupabaseAuthGuard,
  ],
})
export class AuthModule {}
