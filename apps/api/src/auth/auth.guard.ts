import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';
import { AuthService } from './auth.service';
import type { profiles } from '../generated/prisma/client';
import type { User } from '@supabase/supabase-js';

export interface AuthenticatedRequest extends Request {
  user?: profiles;
  authUser?: User;
}

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException(
        'Vui lòng đăng nhập để thực hiện chức năng này',
      );
    }

    const token = authHeader.substring(7).trim();
    if (!token) {
      throw new UnauthorizedException(
        'Vui lòng đăng nhập để thực hiện chức năng này',
      );
    }

    const authUser = await this.authService.validateToken(token);
    const profile = await this.authService.resolveProfile(authUser);

    request.user = profile;
    request.authUser = authUser;

    return true;
  }
}
