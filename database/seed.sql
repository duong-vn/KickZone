-- KickZone demo data for the shared Supabase development database
-- Encoding: UTF-8 (save this file as UTF-8 without converting Vietnamese text)
-- Prerequisite: run database/init.sql before this file.
-- Safe to rerun: records are upserted by stable IDs or natural unique keys.

begin;

set local client_encoding = 'UTF8';

-- ---------------------------------------------------------------------------
-- Field types
-- ---------------------------------------------------------------------------

insert into public.field_types (name, description)
values
  ('5-a-side', 'Sân bóng dành cho đội hình 5 người, phù hợp đá mini và futsal.'),
  ('7-a-side', 'Sân bóng dành cho đội hình 7 người, phổ biến với các đội phong trào.'),
  ('11-a-side', 'Sân bóng kích thước lớn dành cho đội hình 11 người và tổ chức giải đấu.')
on conflict (name) do update
set description = excluded.description;

-- ---------------------------------------------------------------------------
-- Demo profiles
-- These profiles do not create users in Supabase Auth and cannot be used to
-- sign in. Real profiles are provisioned from a verified Supabase Auth user.
-- ---------------------------------------------------------------------------

insert into public.profiles (
  id,
  auth_user_id,
  email,
  full_name,
  phone,
  role,
  status
)
values
  (
    'a0000000-0000-4000-8000-000000000001',
    'b0000000-0000-4000-8000-000000000001',
    'an.nguyen@demo.kickzone.vn',
    'Nguyễn Hoàng An',
    '0901234567',
    'USER',
    'ACTIVE'
  ),
  (
    'a0000000-0000-4000-8000-000000000002',
    'b0000000-0000-4000-8000-000000000002',
    'binh.tran@demo.kickzone.vn',
    'Trần Gia Bình',
    '0912345678',
    'USER',
    'ACTIVE'
  ),
  (
    'a0000000-0000-4000-8000-000000000003',
    'b0000000-0000-4000-8000-000000000003',
    'chau.le@demo.kickzone.vn',
    'Lê Minh Châu',
    '0923456789',
    'USER',
    'ACTIVE'
  ),
  (
    'a0000000-0000-4000-8000-000000000004',
    'b0000000-0000-4000-8000-000000000004',
    'quantri@demo.kickzone.vn',
    'Quản trị viên KickZone',
    '0934567890',
    'ADMIN',
    'ACTIVE'
  )
on conflict (auth_user_id) do update
set
  email = excluded.email,
  full_name = excluded.full_name,
  phone = excluded.phone,
  role = excluded.role,
  status = excluded.status;

-- ---------------------------------------------------------------------------
-- Soccer fields
-- ---------------------------------------------------------------------------

with field_seed (
  field_type_name,
  name,
  slug,
  description,
  address,
  city,
  district,
  latitude,
  longitude,
  base_price_per_hour
) as (
  values
    ('5-a-side', 'Sân bóng Futsal Chảo Lửa', 'san-futsal-chao-lua-tan-binh', 'Cụm sân cỏ nhân tạo cao cấp, có khán đài nhỏ, phòng thay đồ và hệ thống đèn LED chống chói.', '30 Phan Thúc Duyện, Phường 4', 'Thành phố Hồ Chí Minh', 'Tân Bình', 10.801657::numeric, 106.662062::numeric, 260000),
    ('7-a-side', 'Sân bóng đá K34', 'san-bong-da-k34-quan-1', 'Sân bóng ở vị trí trung tâm, mặt cỏ êm, bãi giữ xe rộng và có dịch vụ cho thuê áo tập.', '18B Nguyễn Thị Minh Khai, Phường Đa Kao', 'Thành phố Hồ Chí Minh', 'Quận 1', 10.787294::numeric, 106.700706::numeric, 380000),
    ('7-a-side', 'Sân vận động Thảo Điền', 'san-van-dong-thao-dien-thu-duc', 'Không gian thoáng mát, mặt sân đạt chuẩn và có khu vực nghỉ dành cho đội bóng.', '28 Quốc Hương, Phường Thảo Điền', 'Thành phố Hồ Chí Minh', 'Thành phố Thủ Đức', 10.806909::numeric, 106.731661::numeric, 450000),
    ('11-a-side', 'Sân bóng Tôn Đức Thắng', 'san-ton-duc-thang-quan-7', 'Sân 11 người rộng rãi, phù hợp tổ chức giải đấu sinh viên và các trận giao hữu doanh nghiệp.', '19 Nguyễn Hữu Thọ, Phường Tân Phong', 'Thành phố Hồ Chí Minh', 'Quận 7', 10.732681::numeric, 106.699439::numeric, 800000),
    ('5-a-side', 'Sân bóng mini Lan Anh', 'san-mini-lan-anh-quan-10', 'Mặt cỏ mới, hệ thống thoát nước tốt và có căng tin phục vụ nước uống sau trận.', '291 Cách Mạng Tháng Tám, Phường 12', 'Thành phố Hồ Chí Minh', 'Quận 10', 10.778318::numeric, 106.679500::numeric, 300000),
    ('7-a-side', 'Sân bóng Công viên Gia Định', 'san-gia-dinh-park-go-vap', 'Cụm sân nhiều cây xanh, không khí thoáng và hệ thống chiếu sáng phù hợp thi đấu buổi tối.', 'Hoàng Minh Giám, Phường 3', 'Thành phố Hồ Chí Minh', 'Gò Vấp', 10.813390::numeric, 106.674541::numeric, 320000),
    ('5-a-side', 'Sân bóng Chu Văn An', 'san-bong-da-chu-van-an-binh-thanh', 'Sân cỏ mềm, phù hợp cho các trận giao lưu công ty, nhóm bạn và sinh viên.', '17 Chu Văn An, Phường 26', 'Thành phố Hồ Chí Minh', 'Bình Thạnh', 10.810062::numeric, 106.709829::numeric, 280000),
    ('7-a-side', 'Sân thể thao Kỳ Hòa', 'san-the-thao-ky-hoa-quan-10', 'Cụm sân nằm trong khu vực an ninh tốt, có bãi đỗ xe, phòng thay đồ và khu vực nghỉ.', '238 Đường 3 Tháng 2, Phường 12', 'Thành phố Hồ Chí Minh', 'Quận 10', 10.775583::numeric, 106.675117::numeric, 400000),
    ('5-a-side', 'Sân bóng Rạch Miễu', 'san-bong-rach-mieu-phu-nhuan', 'Sân bóng mini tại trung tâm Phú Nhuận, thuận tiện di chuyển từ nhiều quận lân cận.', '1 Hoa Phượng, Phường 2', 'Thành phố Hồ Chí Minh', 'Phú Nhuận', 10.797978::numeric, 106.691476::numeric, 300000),
    ('7-a-side', 'Sân bóng Nam Sài Gòn', 'san-hagl-sport-complex-quan-7', 'Sân bóng cao cấp có phòng thay đồ, vòi tắm và khu vực chờ dành cho cổ động viên.', '88 Nguyễn Thị Thập, Phường Tân Phú', 'Thành phố Hồ Chí Minh', 'Quận 7', 10.739296::numeric, 106.719324::numeric, 480000),
    ('11-a-side', 'Sân vận động Bách Khoa', 'san-van-dong-bach-khoa-quan-10', 'Sân lớn có mặt cỏ đạt chuẩn, phù hợp tổ chức giải đấu phong trào và sự kiện thể thao.', '268 Lý Thường Kiệt, Phường 14', 'Thành phố Hồ Chí Minh', 'Quận 10', 10.772149::numeric, 106.657958::numeric, 700000),
    ('7-a-side', 'Sân bóng Celadon City', 'san-bong-celadon-city-tan-phu', 'Khu sân hiện đại trong khu đô thị, mặt cỏ chất lượng cao và có căng tin phục vụ đội bóng.', 'N1 Bờ Bao Tân Thắng, Phường Sơn Kỳ', 'Thành phố Hồ Chí Minh', 'Tân Phú', 10.801925::numeric, 106.616682::numeric, 360000)
)
insert into public.fields (
  field_type_id,
  name,
  slug,
  description,
  address,
  city,
  district,
  latitude,
  longitude,
  base_price_per_hour,
  status,
  deleted_at
)
select
  field_types.id,
  field_seed.name,
  field_seed.slug,
  field_seed.description,
  field_seed.address,
  field_seed.city,
  field_seed.district,
  field_seed.latitude,
  field_seed.longitude,
  field_seed.base_price_per_hour,
  'ACTIVE'::public.field_status,
  null
from field_seed
join public.field_types on field_types.name = field_seed.field_type_name
on conflict (slug) do update
set
  field_type_id = excluded.field_type_id,
  name = excluded.name,
  description = excluded.description,
  address = excluded.address,
  city = excluded.city,
  district = excluded.district,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  base_price_per_hour = excluded.base_price_per_hour,
  status = excluded.status,
  deleted_at = null;

-- One primary image per field. The application currently accepts a public URL
-- in storage_path; these demo URLs can later be replaced by Supabase Storage paths.
with image_seed (slug, storage_path) as (
  values
    ('san-futsal-chao-lua-tan-binh', 'https://images.unsplash.com/photo-1529900240051-5120302b7405?auto=format&fit=crop&w=1200&q=80'),
    ('san-bong-da-k34-quan-1', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80'),
    ('san-van-dong-thao-dien-thu-duc', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80'),
    ('san-ton-duc-thang-quan-7', 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80'),
    ('san-mini-lan-anh-quan-10', 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&w=1200&q=80'),
    ('san-gia-dinh-park-go-vap', 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&w=1200&q=80'),
    ('san-bong-da-chu-van-an-binh-thanh', 'https://images.unsplash.com/photo-1518091043644-c1d4457512c6?auto=format&fit=crop&w=1200&q=80'),
    ('san-the-thao-ky-hoa-quan-10', 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&q=80'),
    ('san-bong-rach-mieu-phu-nhuan', 'https://images.unsplash.com/photo-1529900240051-5120302b7405?auto=format&fit=crop&w=1200&q=80'),
    ('san-hagl-sport-complex-quan-7', 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=1200&q=80'),
    ('san-van-dong-bach-khoa-quan-10', 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=1200&q=80'),
    ('san-bong-celadon-city-tan-phu', 'https://images.unsplash.com/photo-1551958219-acbc608c6377?auto=format&fit=crop&w=1200&q=80')
)
insert into public.field_images (
  field_id,
  storage_path,
  alt_text,
  sort_order,
  is_primary
)
select fields.id, image_seed.storage_path, 'Ảnh đại diện ' || fields.name, 0, true
from image_seed
join public.fields on fields.slug = image_seed.slug
on conflict (field_id) where is_primary = true do update
set
  storage_path = excluded.storage_path,
  alt_text = excluded.alt_text,
  sort_order = excluded.sort_order;

-- Monday-Saturday: 06:00-23:00, Sunday: 07:00-22:00.
insert into public.field_operating_hours (
  field_id,
  day_of_week,
  open_time,
  close_time,
  is_closed
)
select
  fields.id,
  weekdays.day_of_week,
  case when weekdays.day_of_week = 0 then time '07:00' else time '06:00' end,
  case when weekdays.day_of_week = 0 then time '22:00' else time '23:00' end,
  false
from public.fields
cross join generate_series(0, 6) as weekdays(day_of_week)
where fields.slug in (
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
on conflict (field_id, day_of_week) do update
set
  open_time = excluded.open_time,
  close_time = excluded.close_time,
  is_closed = excluded.is_closed;

-- ---------------------------------------------------------------------------
-- Peak-hour pricing rules
-- ---------------------------------------------------------------------------

with rule_seed (id, slug, name, day_of_week, start_time, end_time, price, priority) as (
  values
    ('c0000000-0000-4000-8000-000000000001'::uuid, 'san-futsal-chao-lua-tan-binh', 'Giờ cao điểm buổi tối', null::smallint, time '18:00', time '22:00', 320000, 10),
    ('c0000000-0000-4000-8000-000000000002'::uuid, 'san-bong-da-k34-quan-1', 'Giờ cao điểm buổi tối', null::smallint, time '18:00', time '22:00', 460000, 10),
    ('c0000000-0000-4000-8000-000000000003'::uuid, 'san-van-dong-thao-dien-thu-duc', 'Giờ cao điểm buổi tối', null::smallint, time '18:00', time '22:00', 540000, 10),
    ('c0000000-0000-4000-8000-000000000004'::uuid, 'san-ton-duc-thang-quan-7', 'Giá cuối tuần', 0::smallint, time '07:00', time '22:00', 900000, 20),
    ('c0000000-0000-4000-8000-000000000005'::uuid, 'san-mini-lan-anh-quan-10', 'Giờ cao điểm buổi tối', null::smallint, time '18:00', time '22:00', 360000, 10),
    ('c0000000-0000-4000-8000-000000000006'::uuid, 'san-gia-dinh-park-go-vap', 'Giờ cao điểm buổi tối', null::smallint, time '18:00', time '22:00', 400000, 10),
    ('c0000000-0000-4000-8000-000000000007'::uuid, 'san-hagl-sport-complex-quan-7', 'Giờ cao điểm buổi tối', null::smallint, time '18:00', time '22:00', 580000, 10),
    ('c0000000-0000-4000-8000-000000000008'::uuid, 'san-van-dong-bach-khoa-quan-10', 'Giá cuối tuần', 0::smallint, time '07:00', time '22:00', 820000, 20)
)
insert into public.price_rules (
  id,
  field_id,
  name,
  day_of_week,
  start_time,
  end_time,
  price_per_hour,
  priority,
  is_active
)
select
  rule_seed.id,
  fields.id,
  rule_seed.name,
  rule_seed.day_of_week,
  rule_seed.start_time,
  rule_seed.end_time,
  rule_seed.price,
  rule_seed.priority,
  true
from rule_seed
join public.fields on fields.slug = rule_seed.slug
on conflict (id) do update
set
  field_id = excluded.field_id,
  name = excluded.name,
  day_of_week = excluded.day_of_week,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  price_per_hour = excluded.price_per_hour,
  priority = excluded.priority,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- Vouchers
-- ---------------------------------------------------------------------------

insert into public.vouchers (
  code,
  discount_type,
  value,
  max_discount,
  min_order_value,
  start_at,
  end_at,
  usage_limit,
  per_user_limit,
  is_active
)
values
  ('CHAOMUNG', 'PERCENT', 10, 100000, 200000, now() - interval '30 days', now() + interval '365 days', 500, 1, true),
  ('GIAM50K', 'FIXED', 50000, null, 300000, now() - interval '30 days', now() + interval '365 days', 300, 2, true),
  ('CUOITUAN15', 'PERCENT', 15, 150000, 500000, now() - interval '30 days', now() + interval '365 days', 200, 1, true),
  ('HETHAN', 'FIXED', 30000, null, 200000, now() - interval '90 days', now() - interval '30 days', 50, 1, false)
on conflict (code) do update
set
  discount_type = excluded.discount_type,
  value = excluded.value,
  max_discount = excluded.max_discount,
  min_order_value = excluded.min_order_value,
  start_at = excluded.start_at,
  end_at = excluded.end_at,
  usage_limit = excluded.usage_limit,
  per_user_limit = excluded.per_user_limit,
  is_active = excluded.is_active;

-- ---------------------------------------------------------------------------
-- Bookings in several statuses. Dates are relative to the day seed.sql runs,
-- using the KickZone business timezone Asia/Ho_Chi_Minh.
-- ---------------------------------------------------------------------------

with booking_seed (
  code,
  user_email,
  field_slug,
  voucher_code,
  start_local,
  end_local,
  status,
  original_price,
  discount_amount,
  cancellation_reason,
  rejection_reason
) as (
  values
    ('KZ-DEMO0001', 'an.nguyen@demo.kickzone.vn', 'san-futsal-chao-lua-tan-binh', 'CHAOMUNG', (timezone('Asia/Ho_Chi_Minh', now())::date - 14) + time '18:00', (timezone('Asia/Ho_Chi_Minh', now())::date - 14) + time '20:00', 'COMPLETED'::public.booking_status, 640000, 64000, null::text, null::text),
    ('KZ-DEMO0002', 'binh.tran@demo.kickzone.vn', 'san-bong-da-k34-quan-1', null, (timezone('Asia/Ho_Chi_Minh', now())::date - 10) + time '19:00', (timezone('Asia/Ho_Chi_Minh', now())::date - 10) + time '21:00', 'COMPLETED'::public.booking_status, 920000, 0, null::text, null::text),
    ('KZ-DEMO0003', 'chau.le@demo.kickzone.vn', 'san-van-dong-thao-dien-thu-duc', 'GIAM50K', (timezone('Asia/Ho_Chi_Minh', now())::date - 7) + time '18:30', (timezone('Asia/Ho_Chi_Minh', now())::date - 7) + time '20:30', 'COMPLETED'::public.booking_status, 1080000, 50000, null::text, null::text),
    ('KZ-DEMO0004', 'an.nguyen@demo.kickzone.vn', 'san-gia-dinh-park-go-vap', null, (timezone('Asia/Ho_Chi_Minh', now())::date + 2) + time '18:00', (timezone('Asia/Ho_Chi_Minh', now())::date + 2) + time '20:00', 'PENDING'::public.booking_status, 800000, 0, null::text, null::text),
    ('KZ-DEMO0005', 'binh.tran@demo.kickzone.vn', 'san-mini-lan-anh-quan-10', 'GIAM50K', (timezone('Asia/Ho_Chi_Minh', now())::date + 3) + time '19:00', (timezone('Asia/Ho_Chi_Minh', now())::date + 3) + time '21:00', 'CONFIRMED'::public.booking_status, 720000, 50000, null::text, null::text),
    ('KZ-DEMO0006', 'chau.le@demo.kickzone.vn', 'san-hagl-sport-complex-quan-7', null, (timezone('Asia/Ho_Chi_Minh', now())::date + 4) + time '18:00', (timezone('Asia/Ho_Chi_Minh', now())::date + 4) + time '20:00', 'REJECTED'::public.booking_status, 1160000, 0, null::text, 'Khung giờ này được dành cho giải đấu nội bộ.'),
    ('KZ-DEMO0007', 'an.nguyen@demo.kickzone.vn', 'san-bong-rach-mieu-phu-nhuan', null, (timezone('Asia/Ho_Chi_Minh', now())::date + 5) + time '16:00', (timezone('Asia/Ho_Chi_Minh', now())::date + 5) + time '18:00', 'CANCELLED'::public.booking_status, 600000, 0, 'Đội bóng không sắp xếp đủ thành viên.', null::text)
)
insert into public.bookings (
  code,
  user_id,
  field_id,
  voucher_id,
  start_time,
  end_time,
  status,
  original_price,
  discount_amount,
  final_price,
  cancellation_reason,
  rejection_reason
)
select
  booking_seed.code,
  profiles.id,
  fields.id,
  vouchers.id,
  booking_seed.start_local at time zone 'Asia/Ho_Chi_Minh',
  booking_seed.end_local at time zone 'Asia/Ho_Chi_Minh',
  booking_seed.status,
  booking_seed.original_price,
  booking_seed.discount_amount,
  booking_seed.original_price - booking_seed.discount_amount,
  booking_seed.cancellation_reason,
  booking_seed.rejection_reason
from booking_seed
join public.profiles on profiles.email = booking_seed.user_email
join public.fields on fields.slug = booking_seed.field_slug
left join public.vouchers on vouchers.code = booking_seed.voucher_code
on conflict (code) do update
set
  user_id = excluded.user_id,
  field_id = excluded.field_id,
  voucher_id = excluded.voucher_id,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  status = excluded.status,
  original_price = excluded.original_price,
  discount_amount = excluded.discount_amount,
  final_price = excluded.final_price,
  cancellation_reason = excluded.cancellation_reason,
  rejection_reason = excluded.rejection_reason;

insert into public.voucher_usages (voucher_id, user_id, booking_id, used_at)
select bookings.voucher_id, bookings.user_id, bookings.id, bookings.created_at
from public.bookings
where bookings.code in ('KZ-DEMO0001', 'KZ-DEMO0003', 'KZ-DEMO0005')
  and bookings.voucher_id is not null
on conflict (booking_id, user_id, voucher_id) do update
set used_at = excluded.used_at;

-- Reviews are attached only to COMPLETED demo bookings.
with review_seed (booking_code, rating, content) as (
  values
    ('KZ-DEMO0001', 5::smallint, 'Mặt sân đẹp, đèn sáng và nhân viên hỗ trợ rất nhiệt tình. Đội mình chắc chắn sẽ quay lại.'),
    ('KZ-DEMO0002', 4::smallint, 'Vị trí thuận tiện, sân sạch và đúng giờ. Khu vực gửi xe hơi đông vào buổi tối.'),
    ('KZ-DEMO0003', 5::smallint, 'Không gian thoáng, mặt cỏ êm và phòng thay đồ sạch sẽ. Trải nghiệm rất tốt.')
)
insert into public.reviews (user_id, field_id, booking_id, rating, content)
select bookings.user_id, bookings.field_id, bookings.id, review_seed.rating, review_seed.content
from review_seed
join public.bookings on bookings.code = review_seed.booking_code
on conflict (booking_id, user_id, field_id) do update
set
  rating = excluded.rating,
  content = excluded.content;

with favorite_seed (user_email, field_slug) as (
  values
    ('an.nguyen@demo.kickzone.vn', 'san-futsal-chao-lua-tan-binh'),
    ('an.nguyen@demo.kickzone.vn', 'san-van-dong-thao-dien-thu-duc'),
    ('an.nguyen@demo.kickzone.vn', 'san-bong-celadon-city-tan-phu'),
    ('binh.tran@demo.kickzone.vn', 'san-bong-da-k34-quan-1'),
    ('binh.tran@demo.kickzone.vn', 'san-mini-lan-anh-quan-10'),
    ('chau.le@demo.kickzone.vn', 'san-hagl-sport-complex-quan-7')
)
insert into public.favorites (user_id, field_id)
select profiles.id, fields.id
from favorite_seed
join public.profiles on profiles.email = favorite_seed.user_email
join public.fields on fields.slug = favorite_seed.field_slug
on conflict (user_id, field_id) do nothing;

commit;
