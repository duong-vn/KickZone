import { PrismaService } from '../../prisma/prisma.service';
import { FieldsService } from './fields.service';

describe('FieldsService', () => {
  const createService = () => {
    const findMany = jest.fn().mockResolvedValue([]);
    const count = jest.fn().mockResolvedValue(0);
    const prisma = {
      fields: { count, findMany },
    } as unknown as PrismaService;

    return { count, findMany, service: new FieldsService(prisma) };
  };

  it('returns an empty result through the fields delegate', async () => {
    const { count, findMany, service } = createService();

    await expect(service.findAll({})).resolves.toEqual({
      data: [],
      meta: { limit: 9, page: 1, total: 0, totalPages: 0 },
    });
    expect(findMany).toHaveBeenCalledWith({
      where: {
        deleted_at: null,
        status: 'ACTIVE',
      },
      include: {
        field_types: true,
        field_images: true,
      },
      skip: 0,
      take: 9,
      orderBy: { created_at: 'desc' },
    });
    expect(count).toHaveBeenCalledWith({
      where: {
        deleted_at: null,
        status: 'ACTIVE',
      },
    });
  });

  it('uses schema field names and ignores invalid numeric filters', async () => {
    const { count, findMany, service } = createService();

    await service.findAll({
      district: 'Quận 1',
      limit: '500',
      maxPrice: '500000',
      minPrice: 'not-a-number',
      page: '-1',
      search: 'Sân 7',
    });

    const where = {
      deleted_at: null,
      status: 'ACTIVE',
      OR: [
        { name: { contains: 'Sân 7', mode: 'insensitive' } },
        { address: { contains: 'Sân 7', mode: 'insensitive' } },
      ],
      district: { equals: 'Quận 1', mode: 'insensitive' },
      base_price_per_hour: { lte: 500000 },
    };

    expect(findMany).toHaveBeenCalledWith({
      where,
      include: {
        field_types: true,
        field_images: true,
      },
      skip: 0,
      take: 100,
      orderBy: { created_at: 'desc' },
    });
    expect(count).toHaveBeenCalledWith({ where });
  });
});
