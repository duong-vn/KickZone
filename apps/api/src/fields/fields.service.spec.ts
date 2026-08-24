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
  const createService = (
    mockFields: Partial<MockDbField>[] = [],
    mockTotal = 0,
  ) => {
    const findMany = jest.fn().mockResolvedValue(mockFields);
    const count = jest.fn().mockResolvedValue(mockTotal);
    const prisma = {
      fields: { count, findMany },
    } as unknown as PrismaService;

    return { count, findMany, service: new FieldsService(prisma) };
  };

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
      field_types: { id: 'type-1', name: 'Sân 7', description: 'Sân 7 người' },
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
      type: 'Sân 7',
      types: ['Sân 7'],
      rating: 4.5,
      rating_avg: 4.5,
      reviews_count: 2,
      primary_image_url: 'https://example.com/field.jpg',
      image: 'https://example.com/field.jpg',
    });
  });
});
