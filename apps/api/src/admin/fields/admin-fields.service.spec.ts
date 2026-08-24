import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { StorageService } from '../../storage/storage.service.js';
import { AdminFieldsService } from './admin-fields.service.js';

describe('AdminFieldsService', () => {
  const createService = () => {
    const findUniqueFieldType = jest.fn();
    const findUniqueField = jest.fn();
    const findFirstField = jest.fn();
    const createField = jest.fn();
    const createManyOperatingHours = jest.fn();
    const createManyPriceRules = jest.fn();
    const findManyFieldImages = jest.fn();
    const createFieldImage = jest.fn();

    const txMock = {
      fields: {
        create: createField,
        findUnique: findUniqueField,
      },
      field_operating_hours: {
        createMany: createManyOperatingHours,
      },
      price_rules: {
        createMany: createManyPriceRules,
      },
    };

    const transaction = jest.fn((callback: (tx: typeof txMock) => unknown) =>
      callback(txMock),
    );

    const prisma = {
      field_types: {
        findUnique: findUniqueFieldType,
      },
      fields: {
        findUnique: findUniqueField,
        findFirst: findFirstField,
      },
      field_images: {
        findMany: findManyFieldImages,
        create: createFieldImage,
      },
      $transaction: transaction,
    } as unknown as PrismaService;

    const uploadFieldImage = jest.fn();
    const storage = {
      uploadFieldImage,
    } as unknown as StorageService;

    const service = new AdminFieldsService(prisma, storage);

    return {
      service,
      prisma,
      storage,
      findUniqueFieldType,
      findUniqueField,
      findFirstField,
      createField,
      createManyOperatingHours,
      createManyPriceRules,
      findManyFieldImages,
      createFieldImage,
      uploadFieldImage,
    };
  };

  describe('createField', () => {
    it('throws BadRequestException if basePricePerHour is not divisible by 2', async () => {
      const { service } = createService();

      await expect(
        service.createField({
          name: 'Sân 5 Chảo Lửa',
          fieldTypeId: 'ft-5',
          address: '30 Phan Thúc Duyện',
          city: 'Hồ Chí Minh',
          district: 'Tân Bình',
          basePricePerHour: 250001, // odd number
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('throws NotFoundException if fieldTypeId does not exist', async () => {
      const { service, findUniqueFieldType } = createService();
      findUniqueFieldType.mockResolvedValue(null);

      await expect(
        service.createField({
          name: 'Sân 5 Chảo Lửa',
          fieldTypeId: 'invalid-type',
          address: '30 Phan Thúc Duyện',
          city: 'Hồ Chí Minh',
          district: 'Tân Bình',
          basePricePerHour: 250000,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('successfully creates field with operating hours and price rules', async () => {
      const { service, findUniqueFieldType, findUniqueField, createField } =
        createService();

      findUniqueFieldType.mockResolvedValue({ id: 'ft-5', name: '5-a-side' });
      findUniqueField.mockResolvedValueOnce(null); // slug check
      createField.mockResolvedValue({ id: 'field-1', name: 'Sân 5 Chảo Lửa' });
      findUniqueField.mockResolvedValueOnce({
        id: 'field-1',
        name: 'Sân 5 Chảo Lửa',
        field_types: { name: '5-a-side' },
      });

      const result = await service.createField({
        name: 'Sân 5 Chảo Lửa',
        fieldTypeId: 'ft-5',
        address: '30 Phan Thúc Duyện',
        city: 'Hồ Chí Minh',
        district: 'Tân Bình',
        basePricePerHour: 250000,
        priceRules: [
          {
            name: 'Giờ vàng',
            startTime: '17:00',
            endTime: '22:00',
            pricePerHour: 300000,
          },
        ],
      });

      expect(result).toBeDefined();
      expect(createField).toHaveBeenCalled();
    });
  });

  describe('uploadFieldImages', () => {
    it('throws NotFoundException if field does not exist', async () => {
      const { service, findFirstField } = createService();
      findFirstField.mockResolvedValue(null);

      await expect(
        service.uploadFieldImages('non-existent-field', [
          {
            originalname: 'pitch.jpg',
            mimetype: 'image/jpeg',
            size: 1024,
            buffer: Buffer.from('test'),
          } as Express.Multer.File,
        ]),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException for invalid MIME type', async () => {
      const { service, findFirstField } = createService();
      findFirstField.mockResolvedValue({ id: 'f-1', name: 'Sân Chảo Lửa' });

      await expect(
        service.uploadFieldImages('f-1', [
          {
            originalname: 'script.pdf',
            mimetype: 'application/pdf',
            size: 1024,
            buffer: Buffer.from('test'),
          } as Express.Multer.File,
        ]),
      ).rejects.toThrow(BadRequestException);
    });

    it('uploads images and saves to database', async () => {
      const {
        service,
        findFirstField,
        findManyFieldImages,
        uploadFieldImage,
        createFieldImage,
      } = createService();

      findFirstField.mockResolvedValue({ id: 'f-1', name: 'Sân Chảo Lửa' });
      findManyFieldImages.mockResolvedValue([]);
      uploadFieldImage.mockResolvedValue({
        storagePath: 'https://example.com/pitch.jpg',
        publicUrl: 'https://example.com/pitch.jpg',
      });
      createFieldImage.mockResolvedValue({
        id: 'img-1',
        field_id: 'f-1',
        storage_path: 'https://example.com/pitch.jpg',
        is_primary: true,
      });

      const result = await service.uploadFieldImages('f-1', [
        {
          originalname: 'pitch.jpg',
          mimetype: 'image/jpeg',
          size: 1024,
          buffer: Buffer.from('test'),
        } as Express.Multer.File,
      ]);

      expect(result).toHaveLength(1);
      expect(uploadFieldImage).toHaveBeenCalled();
      expect(createFieldImage).toHaveBeenCalledWith({
        data: {
          field_id: 'f-1',
          storage_path: 'https://example.com/pitch.jpg',
          alt_text: 'Sân Chảo Lửa',
          sort_order: 0,
          is_primary: true,
        },
      });
    });
  });
});
