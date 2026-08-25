import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus, BadRequestException } from '@nestjs/common';
import {
  PasswordResetService,
  validatePasswordStrength,
} from './password-reset.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let prisma: {
    profiles: {
      findFirst: jest.Mock;
    };
  };
  let emailService: {
    sendPasswordResetEmail: jest.Mock;
  };

  beforeEach(async () => {
    prisma = {
      profiles: {
        findFirst: jest.fn(),
      },
    };
    emailService = {
      sendPasswordResetEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        { provide: PrismaService, useValue: prisma },
        { provide: EmailService, useValue: emailService },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
  });

  describe('validatePasswordStrength', () => {
    it('rejects passwords shorter than 8 characters', () => {
      expect(validatePasswordStrength('Ab1!')).toBe(false);
      expect(validatePasswordStrength('Aa1@457')).toBe(false);
    });

    it('rejects passwords that do not have at least 3 character classes', () => {
      expect(validatePasswordStrength('abcdefghijk')).toBe(false); // only lowercase
      expect(validatePasswordStrength('ABCDEFGHIJK')).toBe(false); // only uppercase
      expect(validatePasswordStrength('1234567890')).toBe(false); // only digits
      expect(validatePasswordStrength('abcdefgh123')).toBe(false); // 2 categories: lower + digit
      expect(validatePasswordStrength('ABCDEFGH123')).toBe(false); // 2 categories: upper + digit
    });

    it('accepts passwords meeting 3 of 4 categories and min length 8', () => {
      expect(validatePasswordStrength('Password123')).toBe(true); // upper + lower + digit
      expect(validatePasswordStrength('Pass@word!')).toBe(true); // upper + lower + symbol
      expect(validatePasswordStrength('Admin@12345')).toBe(true); // upper + lower + digit + symbol
      expect(validatePasswordStrength('KICKzone!2026')).toBe(true);
    });
  });

  describe('handleForgotPassword', () => {
    it('returns generic message when email does not exist without error', async () => {
      prisma.profiles.findFirst.mockResolvedValue(null);

      const result = await service.handleForgotPassword('unknown@test.com');
      expect(result.message).toContain('hướng dẫn khôi phục');
      expect(emailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });

    it('throws BadRequestException if user profile is INACTIVE', async () => {
      prisma.profiles.findFirst.mockResolvedValue({
        id: '1',
        auth_user_id: 'auth-1',
        email: 'inactive@test.com',
        status: 'INACTIVE',
      });

      await expect(
        service.handleForgotPassword('inactive@test.com'),
      ).rejects.toThrow(BadRequestException);
    });

    it('generates token and sends email for active user', async () => {
      prisma.profiles.findFirst.mockResolvedValue({
        id: '1',
        auth_user_id: 'auth-1',
        email: 'active@test.com',
        status: 'ACTIVE',
      });

      const result = await service.handleForgotPassword('active@test.com');
      expect(result.message).toContain('Liên kết khôi phục');
      expect(emailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'active@test.com',
        expect.stringContaining('/reset-password?token='),
      );
    });

    it('enforces 60-second rate limit cooldown for consecutive requests', async () => {
      prisma.profiles.findFirst.mockResolvedValue({
        id: '1',
        auth_user_id: 'auth-1',
        email: 'ratelimit@test.com',
        status: 'ACTIVE',
      });

      await service.handleForgotPassword('ratelimit@test.com');

      await expect(
        service.handleForgotPassword('ratelimit@test.com'),
      ).rejects.toThrow(HttpException);
    });
  });

  describe('handleResetPassword', () => {
    it('rejects invalid password strength', async () => {
      await expect(
        service.handleResetPassword('dummy-token', 'short'),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects invalid or forged token', async () => {
      await expect(
        service.handleResetPassword('fake.invalid.token', 'StrongPass123!'),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
