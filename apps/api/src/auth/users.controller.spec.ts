import { UsersController } from './users.controller';
import { AuthService } from './auth.service';
import type { profiles } from '../generated/prisma/client';

describe('UsersController', () => {
  let controller: UsersController;
  let authService: jest.Mocked<Partial<AuthService>>;

  const mockProfile: profiles = {
    id: 'user-uuid-1',
    auth_user_id: 'auth-uuid-1',
    email: 'test@kickzone.vn',
    full_name: 'Nguyễn Văn A',
    phone: '0901234567',
    avatar_path: 'https://example.com/avatar.jpg',
    role: 'USER',
    status: 'ACTIVE',
    created_at: new Date('2026-01-01T00:00:00Z'),
    updated_at: new Date('2026-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    authService = {
      updateProfile: jest.fn(),
      getUserActivities: jest.fn(),
    };
    controller = new UsersController(authService as unknown as AuthService);
  });

  describe('getMe', () => {
    it('returns current user profile shape', () => {
      const res = controller.getMe(mockProfile);
      expect(res).toEqual({
        id: 'user-uuid-1',
        authUserId: 'auth-uuid-1',
        email: 'test@kickzone.vn',
        fullName: 'Nguyễn Văn A',
        phone: '0901234567',
        avatarUrl: 'https://example.com/avatar.jpg',
        role: 'USER',
        status: 'ACTIVE',
        createdAt: mockProfile.created_at,
        updatedAt: mockProfile.updated_at,
      });
    });
  });

  describe('updateMe', () => {
    it('calls authService.updateProfile and returns mapped profile', async () => {
      const updatedProfile: profiles = {
        ...mockProfile,
        full_name: 'Nguyễn Văn Mới',
        phone: '0988888888',
      };
      (authService.updateProfile as jest.Mock).mockResolvedValue(updatedProfile);

      const res = await controller.updateMe(
        { fullName: 'Nguyễn Văn Mới', phone: '0988888888' },
        mockProfile,
      );

      expect(authService.updateProfile).toHaveBeenCalledWith('user-uuid-1', {
        fullName: 'Nguyễn Văn Mới',
        phone: '0988888888',
      });
      expect(res.fullName).toBe('Nguyễn Văn Mới');
      expect(res.phone).toBe('0988888888');
    });
  });

  describe('getActivities', () => {
    it('calls authService.getUserActivities with query params', async () => {
      const mockResult = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
      };
      (authService.getUserActivities as jest.Mock).mockResolvedValue(mockResult);

      const res = await controller.getActivities(
        { page: '1', limit: '10' },
        mockProfile,
      );

      expect(authService.getUserActivities).toHaveBeenCalledWith('user-uuid-1', {
        page: '1',
        limit: '10',
      });
      expect(res).toEqual(mockResult);
    });
  });
});
