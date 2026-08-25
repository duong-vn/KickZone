import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';

describe('AuthService - Profile & Activities', () => {
  const createService = () => {
    const updateProfile = jest.fn();
    const findManyBookings = jest.fn();
    const findManyReviews = jest.fn();
    const findManyFavorites = jest.fn();
    const countBookings = jest.fn();
    const countReviews = jest.fn();
    const countFavorites = jest.fn();

    const prisma = {
      profiles: {
        update: updateProfile,
      },
      bookings: {
        findMany: findManyBookings,
        count: countBookings,
      },
      reviews: {
        findMany: findManyReviews,
        count: countReviews,
      },
      favorites: {
        findMany: findManyFavorites,
        count: countFavorites,
      },
    } as unknown as PrismaService;

    const service = new AuthService(prisma);

    return {
      service,
      updateProfile,
      findManyBookings,
      findManyReviews,
      findManyFavorites,
      countBookings,
      countReviews,
      countFavorites,
    };
  };

  describe('updateProfile', () => {
    it('updates full_name and phone correctly', async () => {
      const { service, updateProfile } = createService();
      const mockResult = {
        id: 'user-1',
        full_name: 'Nguyễn Văn B',
        phone: '0987654321',
      };
      updateProfile.mockResolvedValue(mockResult);

      const result = await service.updateProfile('user-1', {
        fullName: '  Nguyễn Văn B  ',
        phone: '  0987654321  ',
      });

      expect(updateProfile).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          full_name: 'Nguyễn Văn B',
          phone: '0987654321',
        },
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('getUserActivities', () => {
    it('aggregates bookings, reviews, favorites and returns sorted activities', async () => {
      const {
        service,
        findManyBookings,
        findManyReviews,
        findManyFavorites,
        countBookings,
        countReviews,
        countFavorites,
      } = createService();

      findManyBookings.mockResolvedValue([
        {
          id: 'b-1',
          code: 'KZ-1234',
          status: 'CONFIRMED',
          created_at: new Date('2026-08-25T10:00:00.000Z'),
          fields: { id: 'f-1', name: 'Sân Chảo Lửa', slug: 'san-chao-lua' },
        },
      ]);
      findManyReviews.mockResolvedValue([
        {
          id: 'r-1',
          rating: 5,
          content: 'Mặt cỏ rất đẹp!',
          created_at: new Date('2026-08-25T11:00:00.000Z'),
          fields: { id: 'f-2', name: 'Sân K34', slug: 'san-k34' },
          field_id: 'f-2',
        },
      ]);
      findManyFavorites.mockResolvedValue([
        {
          id: 'fav-1',
          created_at: new Date('2026-08-25T09:00:00.000Z'),
          fields: { id: 'f-3', name: 'Sân ĐH Tôn Đức Thắng', slug: 'san-tdt' },
          field_id: 'f-3',
        },
      ]);

      countBookings.mockResolvedValue(1);
      countReviews.mockResolvedValue(1);
      countFavorites.mockResolvedValue(1);

      const result = await service.getUserActivities('user-1', {
        page: '1',
        limit: '10',
      });

      expect(result.meta.total).toBe(3);
      expect(result.data).toHaveLength(3);
      // Newest first: review (11:00) -> booking (10:00) -> favorite (09:00)
      expect(result.data[0].type).toBe('REVIEW');
      expect(result.data[1].type).toBe('BOOKING_CONFIRMED');
      expect(result.data[2].type).toBe('FAVORITE');
    });

    it('handles empty activity lists cleanly', async () => {
      const {
        service,
        findManyBookings,
        findManyReviews,
        findManyFavorites,
        countBookings,
        countReviews,
        countFavorites,
      } = createService();

      findManyBookings.mockResolvedValue([]);
      findManyReviews.mockResolvedValue([]);
      findManyFavorites.mockResolvedValue([]);
      countBookings.mockResolvedValue(0);
      countReviews.mockResolvedValue(0);
      countFavorites.mockResolvedValue(0);

      const result = await service.getUserActivities('user-1', {
        page: '1',
        limit: '20',
      });

      expect(result.meta.total).toBe(0);
      expect(result.data).toEqual([]);
    });
  });
});
