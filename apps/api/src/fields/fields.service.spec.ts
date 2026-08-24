import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { FieldsService } from './fields.service';

type MockDbField = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string;
  city: string;
  district: string;
  latitude: string | null;
  longitude: string | null;
  base_price_per_hour: number;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: Date;
  updated_at: Date;
  field_type_id: string;
  field_types: { id: string; name: string; description: string | null };
  field_images: {
    id: string;
    storage_path: string;
    alt_text: string | null;
    is_primary: boolean;
  } | null;
  reviews: { rating: number }[];
};

describe('FieldsService', () => {
  const VALID_UUID = '11111111-2222-3333-4444-555555555555';

  const createService = (
    mockFields: Partial<MockDbField>[] = [],
    mockTotal = 0,
    options?: {
      fieldFindFirst?: any;
      fieldImagesFindMany?: any[];
      reviewsFindMany?: any[];
      reviewsCount?: number;
      allFieldReviews?: any[];
    },
  ) => {
    const findMany = jest.fn().mockResolvedValue(mockFields);
    const count = jest.fn().mockResolvedValue(mockTotal);
    const findFirst = jest
      .fn()
      .mockResolvedValue(
        options?.fieldFindFirst !== undefined
          ? options.fieldFindFirst
          : mockFields[0] || null,
      );

    const fieldImagesFindMany = jest.fn().mockResolvedValue(
      options?.fieldImagesFindMany !== undefined
        ? options.fieldImagesFindMany
        : mockFields.map((f) => ({
            id: 'img-1',
            field_id: f.id,
            storage_path: 'https://example.com/field.jpg',
            alt_text: 'Ảnh sân',
            is_primary: true,
          })),
    );

    const reviewsFindMany = jest
      .fn()
      .mockImplementation((args?: { select?: { rating?: boolean } }) => {
        if (args?.select?.rating) {
          return Promise.resolve(options?.allFieldReviews || []);
        }
        return Promise.resolve(options?.reviewsFindMany || []);
      });

    const reviewsCount = jest
      .fn()
      .mockResolvedValue(
        options?.reviewsCount !== undefined ? options.reviewsCount : 0,
      );

    const prisma = {
      fields: { count, findMany, findFirst },
      field_images: { findMany: fieldImagesFindMany },
      reviews: { findMany: reviewsFindMany, count: reviewsCount },
    } as unknown as PrismaService;

    return {
      count,
      findMany,
      findFirst,
      fieldImagesFindMany,
      reviewsFindMany,
      reviewsCount,
      service: new FieldsService(prisma),
    };
  };

  describe('findAll', () => {
    it('returns an empty result with ACTIVE and non-deleted filter by default', async () => {
      const { count, findMany, service } = createService();

      await expect(service.findAll({})).resolves.toEqual({
        data: [],
        meta: { limit: 9, page: 1, total: 0, totalPages: 0 },
      });

      const expectedWhere = {
        status: 'ACTIVE',
        deleted_at: null,
      };

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { created_at: 'desc' },
          skip: 0,
          take: 9,
          where: expectedWhere,
        }),
      );
      expect(count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('correctly filters by search, district, type, price range, and sort', async () => {
      const { count, findMany, service } = createService();

      await service.findAll({
        search: 'Chảo Lửa',
        district: 'Tân Bình',
        type: 'Sân 5,Sân 7',
        minPrice: 200000,
        maxPrice: 500000,
        sortBy: 'price-asc',
        page: 2,
        limit: 10,
      });

      const expectedWhere = {
        status: 'ACTIVE',
        deleted_at: null,
        OR: [
          { name: { contains: 'Chảo Lửa', mode: 'insensitive' } },
          { address: { contains: 'Chảo Lửa', mode: 'insensitive' } },
          { description: { contains: 'Chảo Lửa', mode: 'insensitive' } },
        ],
        district: { equals: 'Tân Bình', mode: 'insensitive' },
        field_types: {
          name: {
            in: ['Sân 5', '5-a-side', '5', 'Sân 7', '7-a-side', '7'],
            mode: 'insensitive',
          },
        },
        base_price_per_hour: {
          gte: 200000,
          lte: 500000,
        },
      };

      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { base_price_per_hour: 'asc' },
          skip: 10,
          take: 10,
          where: expectedWhere,
        }),
      );
      expect(count).toHaveBeenCalledWith({ where: expectedWhere });
    });

    it('maps relation data, primary image and calculates average rating', async () => {
      const mockDbField: MockDbField = {
        id: 'field-1',
        name: 'Sân Bóng A',
        slug: 'san-bong-a',
        description: 'Sân cỏ nhân tạo chất lượng',
        address: '123 Đường Số 1',
        city: 'TP.HCM',
        district: 'Quận 1',
        latitude: '10.776889',
        longitude: '106.700806',
        base_price_per_hour: 300000,
        status: 'ACTIVE',
        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-01'),
        field_type_id: 'type-1',
        field_types: {
          id: 'type-1',
          name: 'Sân 7',
          description: 'Sân 7 người',
        },
        field_images: {
          id: 'img-1',
          storage_path: 'https://example.com/field.jpg',
          alt_text: 'Sân bóng A',
          is_primary: true,
        },
        reviews: [{ rating: 4 }, { rating: 5 }],
      };

      const { service } = createService([mockDbField], 1);

      const result = await service.findAll({});
      expect(result.meta).toEqual({
        total: 1,
        page: 1,
        limit: 9,
        totalPages: 1,
      });
      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toMatchObject({
        id: 'field-1',
        name: 'Sân Bóng A',
        location: '123 Đường Số 1',
        pricePerHour: 300000,
        type: 'Sân 7 người',
        types: ['Sân 7 người'],
        rating: 4.5,
        rating_avg: 4.5,
        reviews_count: 2,
        primary_image_url: 'https://example.com/field.jpg',
        image: 'https://example.com/field.jpg',
      });
    });
  });

  describe('findOne', () => {
    it('throws NotFoundException if ID is invalid format', async () => {
      const { service } = createService();
      await expect(service.findOne('invalid-uuid')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws NotFoundException if field does not exist', async () => {
      const { service } = createService([], 0, { fieldFindFirst: null });
      await expect(service.findOne(VALID_UUID)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns formatted field detail with images and relations', async () => {
      const mockField = {
        id: VALID_UUID,
        name: 'Sân Chảo Lửa',
        slug: 'san-chao-lua',
        description: 'Sân chuẩn FIFA',
        address: '30 Phan Thúc Duyện',
        city: 'TP.HCM',
        district: 'Tân Bình',
        latitude: '10.799',
        longitude: '106.666',
        base_price_per_hour: 250000,
        status: 'ACTIVE',
        created_at: new Date('2026-01-01'),
        updated_at: new Date('2026-01-01'),
        field_type_id: 'type-uuid',
        field_types: { id: 'type-uuid', name: 'Sân 5' },
        field_operating_hours: [
          {
            id: 'h-1',
            day_of_week: 1,
            open_time: new Date('1970-01-01T06:00:00.000Z'),
            close_time: new Date('1970-01-01T23:00:00.000Z'),
            is_closed: false,
          },
        ],
        price_rules: [],
        reviews: [
          {
            id: 'rev-1',
            user_id: 'user-1',
            rating: 5,
            content: 'Sân rất tốt',
            created_at: new Date('2026-01-02'),
            profiles: {
              id: 'user-1',
              full_name: 'Nguyễn Văn A',
              avatar_path: null,
              role: 'USER',
            },
            bookings: {
              id: 'bk-1',
              code: 'KZ-123456',
              start_time: new Date('2026-01-02T08:00:00.000Z'),
              end_time: new Date('2026-01-02T09:30:00.000Z'),
            },
          },
        ],
      };

      const mockImages = [
        {
          id: 'img-1',
          field_id: VALID_UUID,
          storage_path: 'https://example.com/img1.jpg',
          alt_text: 'Ảnh chính',
          sort_order: 0,
          is_primary: true,
          created_at: new Date('2026-01-01'),
        },
      ];

      const { service } = createService([], 0, {
        fieldFindFirst: mockField,
        fieldImagesFindMany: mockImages,
      });

      const result = await service.findOne(VALID_UUID);

      expect(result.id).toEqual(VALID_UUID);
      expect(result.name).toEqual('Sân Chảo Lửa');
      expect(result.pricePerHour).toEqual(250000);
      expect(result.rating_avg).toEqual(5.0);
      expect(result.reviews_count).toEqual(1);
      expect(result.images).toContain('https://example.com/img1.jpg');
      expect(result.subPitches).toBeDefined();
      expect(result.amenities).toBeDefined();
      expect(result.rules).toBeDefined();
      expect(result.reviews[0].author).toEqual('Nguyễn Văn A');
    });
  });

  describe('findReviews', () => {
    it('throws NotFoundException if field does not exist', async () => {
      const { service } = createService([], 0, { fieldFindFirst: null });
      await expect(
        service.findReviews(VALID_UUID, { page: 1, limit: 10 }),
      ).rejects.toThrow(NotFoundException);
    });

    it('returns paginated reviews and summary breakdown', async () => {
      const mockReviews = [
        {
          id: 'rev-1',
          user_id: 'user-1',
          field_id: VALID_UUID,
          booking_id: 'bk-1',
          rating: 5,
          content: 'Quá đỉnh!',
          created_at: new Date('2026-01-01'),
          profiles: {
            id: 'user-1',
            full_name: 'Trần Bình',
            avatar_path: null,
            role: 'USER',
          },
          bookings: {
            id: 'bk-1',
            code: 'KZ-999',
            start_time: new Date('2026-01-01T10:00:00.000Z'),
            end_time: new Date('2026-01-01T11:00:00.000Z'),
          },
        },
      ];

      const { service } = createService([], 0, {
        fieldFindFirst: {
          id: VALID_UUID,
          name: 'Sân K34',
          field_types: { name: 'Sân 7' },
        },
        reviewsFindMany: mockReviews,
        reviewsCount: 1,
        allFieldReviews: [{ rating: 5 }],
      });

      const result = await service.findReviews(VALID_UUID, {
        page: 1,
        limit: 10,
      });

      expect(result.data).toHaveLength(1);
      expect(result.meta.total).toEqual(1);
      expect(result.summary.averageRating).toEqual(5.0);
      expect(result.summary.totalReviews).toEqual(1);
      expect(result.summary.breakdown).toEqual(
        expect.arrayContaining([
          { star: 5, count: 1, percentage: 100 },
          { star: 4, count: 0, percentage: 0 },
        ]),
      );
    });
  });
});
