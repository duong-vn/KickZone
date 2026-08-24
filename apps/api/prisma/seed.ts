import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool, type PoolConfig } from 'pg';
import { PrismaClient } from '../src/generated/prisma/client';

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }

  const caCertPath = process.env.DATABASE_CA_CERT_PATH;
  const databaseUrl = new URL(connectionString);
  const poolConfig: PoolConfig = {
    ...(caCertPath
      ? {
          database: databaseUrl.pathname.slice(1),
          host: databaseUrl.hostname,
          password: decodeURIComponent(databaseUrl.password),
          port: Number(databaseUrl.port) || 5432,
          user: decodeURIComponent(databaseUrl.username),
          ssl: {
            ca: readFileSync(resolve(caCertPath), 'utf8'),
            rejectUnauthorized: true,
          },
        }
      : { connectionString }),
    max: 2,
    idleTimeoutMillis: 5000,
  };

  return new PrismaClient({ adapter: new PrismaPg(new Pool(poolConfig)) });
}

const prisma = createPrismaClient();

const SAMPLE_GALLERIES = [
  [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80',
  ],
  [
    'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80',
  ],
];

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Seed Field Types
  const type5 = await prisma.field_types.upsert({
    where: { name: '5-a-side' },
    update: { description: 'Sân bóng mini dành cho 5 người mỗi đội' },
    create: {
      name: '5-a-side',
      description: 'Sân bóng mini dành cho 5 người mỗi đội',
    },
  });

  const type7 = await prisma.field_types.upsert({
    where: { name: '7-a-side' },
    update: { description: 'Sân bóng tiêu chuẩn dành cho 7 người mỗi đội' },
    create: {
      name: '7-a-side',
      description: 'Sân bóng tiêu chuẩn dành cho 7 người mỗi đội',
    },
  });

  const type11 = await prisma.field_types.upsert({
    where: { name: '11-a-side' },
    update: { description: 'Sân bóng lớn 11 người đạt chuẩn thi đấu' },
    create: {
      name: '11-a-side',
      description: 'Sân bóng lớn 11 người đạt chuẩn thi đấu',
    },
  });

  console.log('✅ Field types checked/created.');

  // 2. Seed Vouchers
  const VOUCHERS_DATA = [
    {
      code: 'KICKZONE50',
      discount_type: 'FIXED' as const,
      value: 50000,
      min_order_value: 200000,
      usage_limit: 500,
      is_active: true,
    },
    {
      code: 'KZ50',
      discount_type: 'FIXED' as const,
      value: 50000,
      min_order_value: 200000,
      usage_limit: 500,
      is_active: true,
    },
    {
      code: 'KZ10',
      discount_type: 'PERCENT' as const,
      value: 10,
      max_discount: 50000,
      min_order_value: 150000,
      usage_limit: 1000,
      is_active: true,
    },
    {
      code: 'KZPRO10',
      discount_type: 'PERCENT' as const,
      value: 10,
      max_discount: 100000,
      min_order_value: 300000,
      usage_limit: 1000,
      is_active: true,
    },
    {
      code: 'KICKZONE100',
      discount_type: 'FIXED' as const,
      value: 100000,
      min_order_value: 500000,
      usage_limit: 200,
      is_active: true,
    },
  ];

  for (const v of VOUCHERS_DATA) {
    await prisma.vouchers.upsert({
      where: { code: v.code },
      update: {
        discount_type: v.discount_type,
        value: v.value,
        max_discount: v.max_discount ?? null,
        min_order_value: v.min_order_value,
        usage_limit: v.usage_limit,
        is_active: v.is_active,
      },
      create: {
        code: v.code,
        discount_type: v.discount_type,
        value: v.value,
        max_discount: v.max_discount ?? null,
        min_order_value: v.min_order_value,
        usage_limit: v.usage_limit,
        is_active: v.is_active,
      },
    });
  }
  console.log('✅ Vouchers checked/created.');

  // 3. Sample Fields List
  const FIELDS_DATA = [
    {
      name: 'Sân bóng Futsal Chảo Lửa',
      slug: 'san-futsal-chao-lua-tan-binh',
      description:
        'Cụm sân cỏ nhân tạo và sàn futsal cao cấp, có khán đài và đèn chiếu sáng hiện đại.',
      address: '30 Phan Thúc Duyện, Phường 4',
      city: 'TP.HCM',
      district: 'Tân Bình',
      base_price_per_hour: 260000,
      field_type_id: type5.id,
    },
    {
      name: 'Sân bóng đá K34',
      slug: 'san-bong-da-k34-quan-1',
      description:
        'Sân bóng trung tâm Quận 1, mặt cỏ êm ái, bãi giữ xe rộng rãi, phục vụ nước uống và áo tập.',
      address: 'Nguyễn Thị Minh Khai, Phường Bến Nghé',
      city: 'TP.HCM',
      district: 'Quận 1',
      base_price_per_hour: 380000,
      field_type_id: type7.id,
    },
    {
      name: 'Sân vận động Thảo Điền',
      slug: 'san-van-dong-thao-dien-thu-duc',
      description:
        'Khu liên hợp thể thao Thảo Điền với không gian thoáng mát, mặt sân 7 người đạt chuẩn FIFA.',
      address: '28 Quốc Hương, Thảo Điền',
      city: 'TP.HCM',
      district: 'TP. Thủ Đức',
      base_price_per_hour: 450000,
      field_type_id: type7.id,
    },
    {
      name: 'Sân bóng Tôn Đức Thắng Stadium',
      slug: 'san-ton-duc-thang-quan-7',
      description:
        'Sân bóng 11 người mặt cỏ tự nhiên kết hợp nhân tạo chuẩn quốc tế, có đường chạy pitch.',
      address: '19 Nguyễn Hữu Thọ, Tân Phong',
      city: 'TP.HCM',
      district: 'Quận 7',
      base_price_per_hour: 800000,
      field_type_id: type11.id,
    },
    {
      name: 'Sân bóng mini Lan Anh',
      slug: 'san-mini-lan-anh-quan-10',
      description:
        'Sân bóng cỏ nhân tạo mới thay mặt cỏ 2026, thoát nước cực tốt khi trời mưa.',
      address: '291 Cách Mạng Tháng 8, Phường 12',
      city: 'TP.HCM',
      district: 'Quận 10',
      base_price_per_hour: 300000,
      field_type_id: type5.id,
    },
    {
      name: 'Sân bóng Gia Định Park',
      slug: 'san-gia-dinh-park-go-vap',
      description:
        'Nằm cạnh công viên Gia Định nhiều cây xanh trong lành, hệ thống chiếu sáng LED chống chói.',
      address: 'Hoàng Minh Giám, Phường 3',
      city: 'TP.HCM',
      district: 'Gò Vấp',
      base_price_per_hour: 320000,
      field_type_id: type7.id,
    },
    {
      name: 'Sân bóng đá Chu Văn An',
      slug: 'san-bong-da-chu-van-an-binh-thanh',
      description:
        'Sân bóng 5 người cỏ mềm, phù hợp cho các trận giao lưu công ty và sinh viên.',
      address: 'Đường Chu Văn An, Phường 26',
      city: 'TP.HCM',
      district: 'Bình Thạnh',
      base_price_per_hour: 280000,
      field_type_id: type5.id,
    },
    {
      name: 'Sân bóng thể thao Kỳ Hòa',
      slug: 'san-the-thao-ky-hoa-quan-10',
      description:
        'Cụm sân 7 người nằm trong khuôn viên khách sạn Kỳ Hòa, an ninh tốt, tiện ích đầy đủ.',
      address: 'Sư Vạn Hạnh nối dài, Phường 12',
      city: 'TP.HCM',
      district: 'Quận 10',
      base_price_per_hour: 400000,
      field_type_id: type7.id,
    },
    {
      name: 'Sân bóng Rạch Miễu',
      slug: 'san-bong-rach-mieu-phu-nhuan',
      description:
        'Sân bóng 5 người tại trung tâm Phú Nhuận, vị trí đắc địa, dễ di chuyển từ các quận.',
      address: 'Hoa Phượng, Phường 2',
      city: 'TP.HCM',
      district: 'Phú Nhuận',
      base_price_per_hour: 300000,
      field_type_id: type5.id,
    },
    {
      name: 'Sân bóng đá HAGL Sport Complex',
      slug: 'san-hagl-sport-complex-quan-7',
      description:
        'Sân bóng 7 người cao cấp tại Nam Sài Gòn, phòng thay đồ máy lạnh và vòi tắm hoa sen.',
      address: 'Nguyễn Thị Thập, Tân Phú',
      city: 'TP.HCM',
      district: 'Quận 7',
      base_price_per_hour: 480000,
      field_type_id: type7.id,
    },
    {
      name: 'Sân vận động Bách Khoa',
      slug: 'san-van-dong-bach-khoa-quan-10',
      description:
        'Sân 11 người rộng rãi, bề mặt cỏ đạt chuẩn, phù hợp tổ chức các giải đấu phong trào.',
      address: '268 Lý Thường Kiệt, Phường 14',
      city: 'TP.HCM',
      district: 'Quận 10',
      base_price_per_hour: 700000,
      field_type_id: type11.id,
    },
    {
      name: 'Sân bóng đá Celadon City',
      slug: 'san-bong-celadon-city-tan-phu',
      description:
        'Khu sân bóng đẳng cấp trong đô thị Celadon, mặt cỏ nhập khẩu, có khu canteen hiện đại.',
      address: 'N1 Bờ Bao Tân Thắng, Sơn Kỳ',
      city: 'TP.HCM',
      district: 'Tân Bình',
      base_price_per_hour: 360000,
      field_type_id: type7.id,
    },
  ];

  let fieldIndex = 0;
  for (const item of FIELDS_DATA) {
    const existingField = await prisma.fields.findUnique({
      where: { slug: item.slug },
    });

    let fieldId: string;

    if (existingField) {
      fieldId = existingField.id;
      console.log(`ℹ️ Field already exists: ${item.name}`);
    } else {
      const created = await prisma.fields.create({
        data: {
          name: item.name,
          slug: item.slug,
          description: item.description,
          address: item.address,
          city: item.city,
          district: item.district,
          base_price_per_hour: item.base_price_per_hour,
          status: 'ACTIVE',
          field_type_id: item.field_type_id,
        },
      });
      fieldId = created.id;
      console.log(`➕ Created field: ${item.name}`);

      // Add default 7 days operating hours (06:00 to 23:00)
      const operatingHoursData = Array.from({ length: 7 }, (_, dayOfWeek) => ({
        field_id: fieldId,
        day_of_week: dayOfWeek,
        is_closed: false,
        open_time: new Date('1970-01-01T06:00:00.000Z'),
        close_time: new Date('1970-01-01T23:00:00.000Z'),
      }));

      await prisma.field_operating_hours.createMany({
        data: operatingHoursData,
        skipDuplicates: true,
      });
    }

    // Add/Update gallery images for each field
    const gallery = SAMPLE_GALLERIES[fieldIndex % SAMPLE_GALLERIES.length];

    // Check existing images
    const existingImages = await prisma.field_images.findMany({
      where: { field_id: fieldId },
    });

    if (existingImages.length <= 1) {
      // Clean up single image if needed or add supplementary images
      if (existingImages.length === 0) {
        await prisma.field_images.create({
          data: {
            field_id: fieldId,
            storage_path: gallery[0],
            alt_text: item.name,
            is_primary: true,
            sort_order: 0,
          },
        });
      }

      // Add non-primary images
      for (let i = 1; i < gallery.length; i++) {
        await prisma.field_images.create({
          data: {
            field_id: fieldId,
            storage_path: gallery[i],
            alt_text: `${item.name} - Ảnh ${i + 1}`,
            is_primary: false,
            sort_order: i,
          },
        });
      }
    }

    fieldIndex++;
  }

  console.log('🎉 Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
