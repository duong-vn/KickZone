import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { OAuthService } from './oauth.service';
import { PrismaService } from '../prisma/prisma.service';

describe('OAuthService', () => {
  let service: OAuthService;
  let prisma: {
    profiles: {
      findFirst: jest.Mock;
      create: jest.Mock;
      update: jest.Mock;
    };
  };

  beforeEach(async () => {
    prisma = {
      profiles: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [OAuthService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loginWithGoogle', () => {
    it('throws BadRequestException if no credentials are provided', async () => {
      await expect(service.loginWithGoogle({})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws UnauthorizedException if Google verification fails', async () => {
      // Mock global fetch to return 401
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(
        service.loginWithGoogle({ idToken: 'invalid-google-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('creates new profile when email does not exist', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            email: 'newuser@gmail.com',
            name: 'New Google User',
            picture: 'https://avatar.url/pic.jpg',
            sub: 'google-sub-123',
          }),
      } as Response);

      prisma.profiles.findFirst.mockResolvedValue(null);
      prisma.profiles.create.mockResolvedValue({
        id: 'new-profile-uuid',
        auth_user_id: 'auth-uuid',
        email: 'newuser@gmail.com',
        full_name: 'New Google User',
        avatar_path: 'https://avatar.url/pic.jpg',
        role: 'USER',
        status: 'ACTIVE',
      });

      const res = await service.loginWithGoogle({
        idToken: 'valid-google-token',
      });

      expect(res.user.email).toBe('newuser@gmail.com');
      expect(res.user.fullName).toBe('New Google User');
      expect(prisma.profiles.create).toHaveBeenCalled();
    });

    it('logs in existing profile and throws ForbiddenException if INACTIVE', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            email: 'banned@gmail.com',
            name: 'Banned User',
            sub: 'google-sub-456',
          }),
      } as Response);

      prisma.profiles.findFirst.mockResolvedValue({
        id: 'banned-profile-uuid',
        auth_user_id: 'auth-uuid',
        email: 'banned@gmail.com',
        full_name: 'Banned User',
        avatar_path: null,
        role: 'USER',
        status: 'INACTIVE',
      });

      await expect(
        service.loginWithGoogle({ idToken: 'valid-google-token' }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('logs in existing active profile without creating duplicates', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            email: 'existing@gmail.com',
            name: 'Existing User',
            picture: 'https://avatar.url/pic.jpg',
            sub: 'google-sub-789',
          }),
      } as Response);

      prisma.profiles.findFirst.mockResolvedValue({
        id: 'existing-profile-uuid',
        auth_user_id: 'auth-uuid',
        email: 'existing@gmail.com',
        full_name: 'Existing User',
        avatar_path: 'https://avatar.url/pic.jpg',
        role: 'USER',
        status: 'ACTIVE',
      });

      const res = await service.loginWithGoogle({
        idToken: 'valid-google-token',
      });

      expect(res.user.id).toBe('existing-profile-uuid');
      expect(prisma.profiles.create).not.toHaveBeenCalled();
    });
  });

  describe('loginWithFacebook', () => {
    it('throws BadRequestException if no token is provided', async () => {
      await expect(service.loginWithFacebook({})).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws UnauthorizedException if Facebook verification fails', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({}),
      } as Response);

      await expect(
        service.loginWithFacebook({ accessToken: 'invalid-fb-token' }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('creates or logs in user with Facebook profile', async () => {
      jest.spyOn(global, 'fetch').mockResolvedValueOnce({
        ok: true,
        json: () =>
          Promise.resolve({
            id: 'fb-id-12345',
            name: 'Facebook User',
            email: 'fbuser@facebook.com',
            picture: { data: { url: 'https://fb.url/pic.jpg' } },
          }),
      } as Response);

      prisma.profiles.findFirst.mockResolvedValue(null);
      prisma.profiles.create.mockResolvedValue({
        id: 'fb-profile-uuid',
        auth_user_id: 'auth-fb-uuid',
        email: 'fbuser@facebook.com',
        full_name: 'Facebook User',
        avatar_path: 'https://fb.url/pic.jpg',
        role: 'USER',
        status: 'ACTIVE',
      });

      const res = await service.loginWithFacebook({
        accessToken: 'valid-fb-token',
      });

      expect(res.user.email).toBe('fbuser@facebook.com');
      expect(prisma.profiles.create).toHaveBeenCalled();
    });
  });
});
