import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../../storage/storage.service.js';
import { AdminUsersService } from './admin-users.service.js';

describe('AdminUsersService', () => {
  const createService = () => {
    const findFirstProfile = jest.fn();
    const createProfile = jest.fn();

    const prisma = {
      profiles: {
        findFirst: findFirstProfile,
        create: createProfile,
      },
    } as unknown as PrismaService;

    const storageService = {} as unknown as StorageService;

    const createUserInAuth = jest.fn();
    const supabaseMock = {
      auth: {
        admin: {
          createUser: createUserInAuth,
        },
      },
    };

    const service = new AdminUsersService(prisma, storageService);
    // Inject mock supabase
    (service as unknown as { supabase: typeof supabaseMock }).supabase =
      supabaseMock;

    return {
      service,
      findFirstProfile,
      createProfile,
      createUserInAuth,
    };
  };

  describe('createUser', () => {
    it('throws ConflictException if email already exists in profiles', async () => {
      const { service, findFirstProfile } = createService();
      findFirstProfile.mockResolvedValue({
        id: 'user-1',
        email: 'test@example.com',
      });

      await expect(
        service.createUser({
          email: 'test@example.com',
          password: 'Password@123',
          fullName: 'Test User',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('creates user in Supabase Auth and persists profile in database', async () => {
      const { service, findFirstProfile, createUserInAuth, createProfile } =
        createService();

      findFirstProfile.mockResolvedValue(null);
      createUserInAuth.mockResolvedValue({
        data: { user: { id: 'auth-user-123' } },
        error: null,
      });

      const mockDate = new Date('2026-08-24T07:00:00.000Z');
      createProfile.mockResolvedValue({
        id: 'profile-123',
        auth_user_id: 'auth-user-123',
        email: 'newuser@example.com',
        full_name: 'Nguyễn Văn A',
        phone: '0901234567',
        role: 'USER',
        status: 'ACTIVE',
        created_at: mockDate,
        updated_at: mockDate,
      });

      const result = await service.createUser({
        email: 'newuser@example.com',
        password: 'Password@123',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        role: 'USER',
        status: 'ACTIVE',
      });

      expect(result).toBeDefined();
      expect(result.id).toBe('profile-123');
      expect(result.email).toBe('newuser@example.com');
      expect(createUserInAuth).toHaveBeenCalledWith({
        email: 'newuser@example.com',
        password: 'Password@123',
        email_confirm: true,
        user_metadata: {
          full_name: 'Nguyễn Văn A',
          name: 'Nguyễn Văn A',
          phone: '0901234567',
        },
      });
      expect(createProfile).toHaveBeenCalledWith({
        data: {
          auth_user_id: 'auth-user-123',
          email: 'newuser@example.com',
          full_name: 'Nguyễn Văn A',
          phone: '0901234567',
          avatar_path: null,
          role: 'USER',
          status: 'ACTIVE',
        },
      });
    });
  });
});
