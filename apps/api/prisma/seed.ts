import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { Pool, type PoolConfig } from 'pg';

function createPool() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured');
  }

  const caCertPath = process.env.DATABASE_CA_CERT_PATH;
  const databaseUrl = new URL(connectionString);
  let poolConfig: PoolConfig;

  if (caCertPath) {
    poolConfig = {
      database: databaseUrl.pathname.slice(1),
      host: databaseUrl.hostname,
      password: decodeURIComponent(databaseUrl.password),
      port: Number(databaseUrl.port) || 5432,
      user: decodeURIComponent(databaseUrl.username),
      ssl: {
        ca: readFileSync(resolve(caCertPath), 'utf8'),
        rejectUnauthorized: true,
      },
    };
  } else if (databaseUrl.searchParams.get('sslmode') === 'require') {
    // Supabase shared/session pooler encrypts the connection. For strict CA
    // verification, configure DATABASE_CA_CERT_PATH instead.
    databaseUrl.searchParams.delete('sslmode');
    poolConfig = {
      connectionString: databaseUrl.toString(),
      ssl: { rejectUnauthorized: false },
    };
  } else {
    poolConfig = { connectionString };
  }

  return new Pool(poolConfig);
}

const pool = createPool();

async function main() {
  const seedPath = resolve(__dirname, '../../../database/seed.sql');
  const seedSql = readFileSync(seedPath, 'utf8');

  console.log(`Đang chạy dữ liệu mẫu từ ${seedPath}...`);
  await pool.query(seedSql);
  console.log('Đã seed dữ liệu mẫu lên Supabase thành công.');

  const summary = await pool.query<{
    bookings: number;
    favorites: number;
    fields: number;
    profiles: number;
    reviews: number;
    server_encoding: string;
    utf8_verified: boolean;
    vouchers: number;
  }>(`
    select
      (
        select count(*)::int
        from public.profiles
        where email like '%@demo.kickzone.vn'
      ) as profiles,
      (
        select count(*)::int
        from public.fields
        where slug in (
          'san-futsal-chao-lua-tan-binh',
          'san-bong-da-k34-quan-1',
          'san-van-dong-thao-dien-thu-duc',
          'san-ton-duc-thang-quan-7',
          'san-mini-lan-anh-quan-10',
          'san-gia-dinh-park-go-vap',
          'san-bong-da-chu-van-an-binh-thanh',
          'san-the-thao-ky-hoa-quan-10',
          'san-bong-rach-mieu-phu-nhuan',
          'san-hagl-sport-complex-quan-7',
          'san-van-dong-bach-khoa-quan-10',
          'san-bong-celadon-city-tan-phu'
        )
      ) as fields,
      (
        select count(*)::int
        from public.vouchers
        where code in ('CHAOMUNG', 'GIAM50K', 'CUOITUAN15', 'HETHAN')
      ) as vouchers,
      (
        select count(*)::int
        from public.bookings
        where code like 'KZ-DEMO%'
      ) as bookings,
      (
        select count(*)::int
        from public.reviews
        join public.bookings on bookings.id = reviews.booking_id
        where bookings.code like 'KZ-DEMO%'
      ) as reviews,
      (
        select count(*)::int
        from public.favorites
        join public.profiles on profiles.id = favorites.user_id
        where profiles.email like '%@demo.kickzone.vn'
      ) as favorites,
      current_setting('server_encoding') as server_encoding,
      exists (
        select 1
        from public.profiles
        where full_name = 'Nguyễn Hoàng An'
      ) and exists (
        select 1
        from public.fields
        where name = 'Sân thể thao Kỳ Hòa'
      ) as utf8_verified
  `);

  console.table(summary.rows);
}

main()
  .catch((e) => {
    console.error('Seed dữ liệu thất bại:', e);
    process.exit(1);
  })
  .finally(async () => {
    await pool.end();
  });
