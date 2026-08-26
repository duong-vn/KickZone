import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FavoritesService } from './favorites.service';

describe('FavoritesService', () => {
  const createService = () => {
    const findFirstField = jest.fn();
    const findUniqueFavorite = jest.fn();
    const createFavorite = jest.fn();
    const deleteFavorite = jest.fn();
    const findManyFavorites = jest.fn();
    const countFavorites = jest.fn();

    const prisma = {
      fields: {
        findFirst: findFirstField,
      },
      favorites: {
        findUnique: findUniqueFavorite,
        create: createFavorite,
        delete: deleteFavorite,
        findMany: findManyFavorites,
        count: countFavorites,
      },
    } as unknown as PrismaService;

    const service = new FavoritesService(prisma);

    return {
      service,
      findFirstField,
      findUniqueFavorite,
      createFavorite,
      deleteFavorite,
      findManyFavorites,
      countFavorites,
    };
  };

  describe('toggleFavorite', () => {
    it('throws NotFoundException when field does not exist', async () => {
      const { service, findFirstField } = createService();
      findFirstField.mockResolvedValue(null);

      await expect(
        service.toggleFavorite('user-1', 'invalid-field'),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates favorite when not currently favorited', async () => {
      const { service, findFirstField, findUniqueFavorite, createFavorite } =
        createService();

      findFirstField.mockResolvedValue({ id: 'f-1', name: 'Sân Chảo Lửa' });
      findUniqueFavorite.mockResolvedValue(null);
      createFavorite.mockResolvedValue({
        id: 'fav-1',
        user_id: 'user-1',
        field_id: 'f-1',
      });

      const result = await service.toggleFavorite('user-1', 'f-1');

      expect(result).toEqual({
        is_favorite: true,
        message: 'Đã thêm sân vào danh sách yêu thích',
      });
      expect(createFavorite).toHaveBeenCalledWith({
        data: {
          user_id: 'user-1',
          field_id: 'f-1',
        },
      });
    });

    it('deletes favorite when currently favorited', async () => {
      const { service, findFirstField, findUniqueFavorite, deleteFavorite } =
        createService();

      findFirstField.mockResolvedValue({ id: 'f-1', name: 'Sân Chảo Lửa' });
      findUniqueFavorite.mockResolvedValue({
        id: 'fav-1',
        user_id: 'user-1',
        field_id: 'f-1',
      });
      deleteFavorite.mockResolvedValue({ id: 'fav-1' });

      const result = await service.toggleFavorite('user-1', 'f-1');

      expect(result).toEqual({
        is_favorite: false,
        message: 'Đã xóa sân khỏi danh sách yêu thích',
      });
      expect(deleteFavorite).toHaveBeenCalledWith({
        where: {
          user_id_field_id: {
            user_id: 'user-1',
            field_id: 'f-1',
          },
        },
      });
    });
  });

  describe('getFavoriteStatus', () => {
    it('returns true when favorite exists', async () => {
      const { service, findUniqueFavorite } = createService();
      findUniqueFavorite.mockResolvedValue({ id: 'fav-1' });

      const result = await service.getFavoriteStatus('user-1', 'f-1');
      expect(result).toEqual({ is_favorite: true });
    });

    it('returns false when favorite does not exist', async () => {
      const { service, findUniqueFavorite } = createService();
      findUniqueFavorite.mockResolvedValue(null);

      const result = await service.getFavoriteStatus('user-1', 'f-1');
      expect(result).toEqual({ is_favorite: false });
    });
  });

  describe('getUserFavorites', () => {
    it('returns paginated user favorites with mapped fields and primary image', async () => {
      const { service, findManyFavorites, countFavorites } = createService();

      const mockDate = new Date('2023-10-15T10:00:00.000Z');
      const mockImages = [
        {
          id: 'img-1',
          storage_path: 'https://example.com/primary.jpg',
          alt_text: 'Primary Image',
          is_primary: true,
          sort_order: 0,
        },
        {
          id: 'img-2',
          storage_path: 'https://example.com/secondary.jpg',
          alt_text: 'Secondary Image',
          is_primary: false,
          sort_order: 1,
        },
      ];

      findManyFavorites.mockResolvedValue([
        {
          id: 'fav-1',
          user_id: 'user-1',
          field_id: 'f-1',
          created_at: mockDate,
          fields: {
            id: 'f-1',
            name: 'Sân Chảo Lửa',
            slug: 'san-chao-lua',
            description: 'Mô tả',
            address: '30 Phan Thúc Duyện',
            city: 'Hồ Chí Minh',
            district: 'Tân Bình',
            base_price_per_hour: 250000,
            status: 'ACTIVE',
            field_types: { name: '5-a-side' },
            field_type_id: 'ft-5',
            field_images: mockImages,
            reviews: [{ rating: 5 }, { rating: 4 }],
          },
        },
      ]);
      countFavorites.mockResolvedValue(1);

      const result = await service.getUserFavorites('user-1', {
        page: '1',
        limit: '10',
      });

      expect(result).toEqual({
        data: [
          {
            id: 'fav-1',
            user_id: 'user-1',
            field_id: 'f-1',
            created_at: mockDate.toISOString(),
            field: {
              id: 'f-1',
              name: 'Sân Chảo Lửa',
              slug: 'san-chao-lua',
              description: 'Mô tả',
              address: '30 Phan Thúc Duyện',
              location: '30 Phan Thúc Duyện',
              city: 'Hồ Chí Minh',
              district: 'Tân Bình',
              base_price_per_hour: 250000,
              basePricePerHour: 250000,
              pricePerHour: 250000,
              status: 'ACTIVE',
              field_type: '5-a-side',
              field_types: { name: '5-a-side' },
              field_type_id: 'ft-5',
              type: 'Sân 5 người',
              types: ['Sân 5 người'],
              image: 'https://example.com/primary.jpg',
              primary_image_url: 'https://example.com/primary.jpg',
              image_url: 'https://example.com/primary.jpg',
              field_images: mockImages,
              rating: 4.5,
              rating_avg: 4.5,
              reviews_count: 2,
              available: true,
              is_available_today: true,
            },
          },
        ],
        meta: {
          total: 1,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });
  });
});
