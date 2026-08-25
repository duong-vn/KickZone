import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { createHmac, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

export function validatePasswordStrength(password: string): boolean {
  if (!password || password.length < 8) return false;
  const categories = [
    /[a-z]/.test(password),
    /[A-Z]/.test(password),
    /\d/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ].filter(Boolean).length;
  return categories >= 3;
}

interface ResetTokenRecord {
  authUserId: string;
  email: string;
  expiresAt: number;
  used: boolean;
}

interface RateLimitRecord {
  lastRequestedAt: number;
  requestCount: number;
  windowStartedAt: number;
}

const TOKEN_EXPIRATION_MS = 15 * 60 * 1000; // 15 minutes
const RESEND_COOLDOWN_MS = 60 * 1000; // 60 seconds
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

@Injectable()
export class PasswordResetService {
  private readonly logger = new Logger(PasswordResetService.name);
  private supabase: SupabaseClient | null = null;
  private readonly tokenStore = new Map<string, ResetTokenRecord>();
  private readonly rateLimits = new Map<string, RateLimitRecord>();
  private readonly revokedTokenSignatures = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {
    const supabaseUrl = process.env.SUPABASE_URL;
    const supabaseKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseKey) {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
    }
  }

  async handleForgotPassword(emailInput: string): Promise<{ message: string }> {
    const email = emailInput.trim().toLowerCase();
    this.checkRateLimit(email);

    // Look up profile in database
    const profile = await this.prisma.profiles.findFirst({
      where: {
        email: {
          equals: email,
          mode: 'insensitive',
        },
      },
    });

    if (!profile) {
      // Return generic message to prevent email enumeration, but do not send email
      this.logger.warn(
        `Forgot password requested for non-existing email: ${email}`,
      );
      return {
        message:
          'Nếu email tồn tại trong hệ thống, hướng dẫn khôi phục mật khẩu sẽ được gửi đến hòm thư của bạn.',
      };
    }

    if (profile.status === 'INACTIVE') {
      throw new BadRequestException(
        'Tài khoản này đã bị vô hiệu hóa. Vui lòng liên hệ quản trị viên.',
      );
    }

    // Generate single-use token (valid for 15 minutes)
    const token = this.generateToken(profile.auth_user_id, profile.email);

    // Build reset URL
    const webUrl =
      process.env.FRONTEND_URL ||
      process.env.APP_URL ||
      process.env.NEXT_PUBLIC_APP_URL ||
      'http://localhost:3000';
    const resetUrl = `${webUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`;

    // Send recovery email
    try {
      await this.emailService.sendPasswordResetEmail(profile.email, resetUrl);
    } catch (error) {
      this.logger.error(
        `Failed to send password reset email to ${profile.email}: ${error instanceof Error ? error.message : String(error)}`,
      );
      throw new ServiceUnavailableException(
        'Không thể gửi email lúc này. Vui lòng thử lại sau.',
      );
    }

    return {
      message:
        'Liên kết khôi phục mật khẩu đã được gửi đến email của bạn. Vui lòng kiểm tra hộp thư.',
    };
  }

  async handleResetPassword(
    token: string,
    newPassword: string,
  ): Promise<{ message: string }> {
    if (!token || typeof token !== 'string') {
      throw new BadRequestException('Mã xác thực không hợp lệ.');
    }

    // Validate password strength
    if (!validatePasswordStrength(newPassword)) {
      throw new BadRequestException(
        'Mật khẩu mới phải có tối thiểu 8 ký tự và chứa ít nhất 3 trong 4 nhóm ký tự (chữ hoa, chữ thường, số, ký tự đặc biệt).',
      );
    }

    // Verify token
    const tokenData = this.verifyAndConsumeToken(token);
    if (!tokenData) {
      throw new BadRequestException(
        'Mã xác thực không hợp lệ, đã được sử dụng hoặc đã hết hạn (quá 15 phút).',
      );
    }

    if (!this.supabase) {
      this.logger.error('Supabase client is not configured');
      throw new ServiceUnavailableException(
        'Hệ thống xác thực tạm thời không khả dụng.',
      );
    }

    // Update password in Supabase Auth
    const { error } = await this.supabase.auth.admin.updateUserById(
      tokenData.authUserId,
      {
        password: newPassword,
      },
    );

    if (error) {
      this.logger.error(
        `Failed to update password for authUserId ${tokenData.authUserId}: ${error.message}`,
      );
      throw new BadRequestException(
        'Không thể cập nhật mật khẩu. Vui lòng thử lại hoặc yêu cầu mã khôi phục mới.',
      );
    }

    this.logger.log(
      `Password successfully reset for user ${tokenData.email} (${tokenData.authUserId})`,
    );

    return {
      message:
        'Mật khẩu của bạn đã được cập nhật thành công. Vui lòng đăng nhập với mật khẩu mới.',
    };
  }

  private checkRateLimit(email: string): void {
    const now = Date.now();
    const record = this.rateLimits.get(email);

    if (record) {
      // Check 60-second cooldown between requests
      const elapsedSinceLast = now - record.lastRequestedAt;
      if (elapsedSinceLast < RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil(
          (RESEND_COOLDOWN_MS - elapsedSinceLast) / 1000,
        );
        throw new HttpException(
          `Vui lòng chờ ${waitSeconds} giây trước khi yêu cầu gửi lại email.`,
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      // Check rolling 15-minute window count
      if (now - record.windowStartedAt < RATE_LIMIT_WINDOW_MS) {
        if (record.requestCount >= MAX_REQUESTS_PER_WINDOW) {
          throw new HttpException(
            'Bạn đã vượt quá số lần yêu cầu cho phép trong 15 phút. Vui lòng thử lại sau.',
            HttpStatus.TOO_MANY_REQUESTS,
          );
        }
        record.requestCount += 1;
        record.lastRequestedAt = now;
      } else {
        // Reset window
        record.windowStartedAt = now;
        record.requestCount = 1;
        record.lastRequestedAt = now;
      }
    } else {
      this.rateLimits.set(email, {
        windowStartedAt: now,
        requestCount: 1,
        lastRequestedAt: now,
      });
    }

    // Clean up old rate limit records periodically
    if (this.rateLimits.size > 1000) {
      for (const [key, val] of this.rateLimits.entries()) {
        if (now - val.windowStartedAt > RATE_LIMIT_WINDOW_MS * 2) {
          this.rateLimits.delete(key);
        }
      }
    }
  }

  private generateToken(authUserId: string, email: string): string {
    const now = Date.now();
    const expiresAt = now + TOKEN_EXPIRATION_MS;
    const randomNonce = randomBytes(16).toString('hex');
    const secret =
      process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.JWT_SECRET ||
      'kickzone-default-secret-key';

    const payload = `${authUserId}:${email}:${expiresAt}:${randomNonce}`;
    const signature = createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    const token = `${Buffer.from(payload).toString('base64url')}.${signature}`;

    this.tokenStore.set(token, {
      authUserId,
      email,
      expiresAt,
      used: false,
    });

    // Cleanup expired tokens from store
    this.cleanupTokenStore();

    return token;
  }

  private verifyAndConsumeToken(token: string): ResetTokenRecord | null {
    const now = Date.now();

    // First check in-memory store
    const stored = this.tokenStore.get(token);
    if (stored) {
      if (stored.used || now > stored.expiresAt) {
        this.tokenStore.delete(token);
        return null;
      }
      // Mark as used and remove
      stored.used = true;
      this.tokenStore.delete(token);
      return stored;
    }

    // Fallback: Verify cryptographic signature (in case of server restart)
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [encodedPayload, signature] = parts;
    if (this.revokedTokenSignatures.has(signature)) {
      return null;
    }

    try {
      const payload = Buffer.from(encodedPayload, 'base64url').toString('utf8');
      const secret =
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        process.env.JWT_SECRET ||
        'kickzone-default-secret-key';

      const expectedSignature = createHmac('sha256', secret)
        .update(payload)
        .digest('hex');

      if (signature !== expectedSignature) {
        return null;
      }

      const [authUserId, email, expiresAtStr] = payload.split(':');
      const expiresAt = Number.parseInt(expiresAtStr, 10);

      if (Number.isNaN(expiresAt) || now > expiresAt) {
        return null;
      }

      // Mark signature as revoked to prevent replay
      this.revokedTokenSignatures.add(signature);

      return {
        authUserId,
        email,
        expiresAt,
        used: true,
      };
    } catch {
      return null;
    }
  }

  private cleanupTokenStore(): void {
    const now = Date.now();
    for (const [key, val] of this.tokenStore.entries()) {
      if (now > val.expiresAt || val.used) {
        this.tokenStore.delete(key);
      }
    }
  }
}
