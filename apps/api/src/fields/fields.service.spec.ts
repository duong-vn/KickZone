import { PrismaService } from '../../prisma/prisma.service.js';
import { FieldsService } from './fields.service.js';

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
    expect(findMany).toHaveBeenCalled();
    expect(count).toHaveBeenCalled();
  });

  it('applies validated filters and pagination', async () => {
    const { count, findMany, service } = createService();
    await service.findAll({
      district: 'Quận 1',
      limit: 100,
      maxPrice: 500000,
      minPrice: 0,
      page: 2,
      search: 'Sân 7',
    });
    expect(findMany).toHaveBeenCalled();
    expect(count).toHaveBeenCalled();
  });
});
