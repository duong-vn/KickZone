# DATABASE

Tài liệu này mô tả database KickZone, mục đích của từng bảng/cột, cách khởi tạo schema bằng [`database/init.sql`](./database/init.sql), cách kết nối Supabase và cách cả nhóm giữ database đồng bộ.

> Hiện tại: SQL schema đã có trong repo nhưng chưa được chạy lên một Supabase project thật. `apps/api/prisma/schema.prisma` cũng chưa được đồng bộ từ database vì repo chưa có credential.

## Mục lục

- [1. Tổng quan](#1-tổng-quan)
- [2. File database trong repo](#2-file-database-trong-repo)
- [3. Cách tạo database trên Supabase](#3-cách-tạo-database-trên-supabase)
- [4. Cách cả nhóm kết nối](#4-cách-cả-nhóm-kết-nối)
- [5. Cách khởi tạo và kiểm tra schema](#5-cách-khởi-tạo-và-kiểm-tra-schema)
- [6. Tổng quan schema](#6-tổng-quan-schema)
- [7. Chi tiết từng bảng và thuộc tính](#7-chi-tiết-từng-bảng-và-thuộc-tính)
- [8. Quan hệ dữ liệu](#8-quan-hệ-dữ-liệu)
- [9. Quy tắc booking, thời gian và giá](#9-quy-tắc-booking-thời-gian-và-giá)
- [10. RLS và bảo mật](#10-rls-và-bảo-mật)
- [11. Trigger và index](#11-trigger-và-index)
- [12. Đồng bộ Prisma](#12-đồng-bộ-prisma)
- [13. Quản lý thay đổi database](#13-quản-lý-thay-đổi-database)
- [14. Checklist](#14-checklist)

## 1. Tổng quan

KickZone dùng:

| Thành phần | Công nghệ |
| --- | --- |
| Database | PostgreSQL |
| Cloud database | Supabase |
| ORM | Prisma 7 |
| Backend | NestJS |
| Authentication | Supabase Auth |
| File storage | Supabase Storage |

Database phục vụ ba nhóm:

- Guest xem, tìm kiếm sân và xem availability.
- User quản lý profile, yêu thích, booking, voucher và review.
- Admin quản lý booking, sân, hình ảnh, giá, loại sân và trạng thái user.

Supabase Auth lưu identity/password. Bảng `profiles` chỉ lưu dữ liệu ứng dụng và liên kết bằng `auth_user_id`; không có password/password hash trong schema KickZone.

### Phạm vi schema đầu tiên

```text
profiles
field_types
fields
field_images
field_operating_hours
price_rules
vouchers
bookings
voucher_usages
reviews
favorites
```

Chưa thêm:

- facilities/cụm sân
- amenities
- nested review comments
- activity timeline/audit log
- analytics

Các phần này chỉ làm sau khi flow Login → Field → Booking → Admin approve chạy end-to-end.

## 2. File database trong repo

```text
database/
├── README.md       # Danh mục dữ liệu mẫu và hướng dẫn seed
├── init.sql        # Tạo toàn bộ schema core trên Supabase project mới
├── seed.sql        # Dữ liệu demo dùng chung, có thể chạy lại an toàn
└── migrations/     # Mỗi thay đổi schema sau baseline là một file SQL mới
```

`database/init.sql` bao gồm:

- 5 PostgreSQL enum.
- 11 bảng core.
- Foreign key và delete action.
- Check constraint.
- Index cho search, booking và admin.
- Trigger tự cập nhật `updated_at`.
- RLS deny-by-default.
- Seed ba loại sân 5/7/11 người.
- Comment cho bảng/cột quan trọng.

Script không có `DROP TABLE`, không truncate và không xóa dữ liệu. Có thể chạy lại để tạo object còn thiếu, nhưng `CREATE TABLE IF NOT EXISTS` không tự nâng cấp bảng cũ. Sau lần khởi tạo đầu, mọi thay đổi phải đi qua migration mới.

`database/seed.sql` khác migration: file này chỉ chứa dữ liệu demo và dùng `ON CONFLICT` để có thể chạy lại mà không nhân đôi record. Sau khi chạy `init.sql`, Database Owner seed lên Supabase development bằng:

```bash
npm run db:seed --workspace @kickzone/api
```

Danh sách chính xác các record demo nằm trong [`database/README.md`](./database/README.md).

## 3. Cách tạo database trên Supabase

Mỗi Supabase project tự có một PostgreSQL database. Bạn không cần tạo database con bằng Table Editor.

### Bước 1 — Tạo project

1. Truy cập [Supabase Dashboard](https://supabase.com/dashboard).
2. Chọn `New project`.
3. Tạo/chọn organization của nhóm.
4. Đặt project name, ví dụ `kickzone-dev`.
5. Chọn region gần nơi backend sẽ deploy.
6. Tạo database password mạnh và lưu trong password manager.
7. Chờ project được provision xong.

Nên có project riêng cho development. Không dùng database production trong lúc cả nhóm đang phát triển.

### Bước 2 — Mời thành viên

Vào Organization Settings → Team:

- Tech Lead: `Owner` hoặc `Administrator`.
- Các thành viên còn lại: `Developer`.

Không chia sẻ chung tài khoản Supabase. Mỗi người dùng tài khoản riêng để thao tác có thể truy vết.

### Bước 3 — Tạo role PostgreSQL cho Prisma

Mở SQL Editor → New query và chạy một lần:

```sql
create user "prisma" with password 'REPLACE_WITH_A_STRONG_PASSWORD'
  bypassrls
  createdb;

grant "prisma" to "postgres";

grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;

alter default privileges for role postgres in schema public
  grant all on tables to prisma;
alter default privileges for role postgres in schema public
  grant all on routines to prisma;
alter default privileges for role postgres in schema public
  grant all on sequences to prisma;
```

Thay placeholder bằng password khác database owner password và lưu vào password manager. Không commit câu SQL có password thật.

Nếu password chứa ký tự đặc biệt như `@`, `:`, `/` hoặc `#`, phải URL-encode password khi đặt vào connection string. Nếu password có dấu nháy đơn, phải escape đúng trong câu SQL hoặc tạo password khác.

### Bước 4 — Chạy `init.sql`

1. Mở file [`database/init.sql`](./database/init.sql).
2. Copy toàn bộ nội dung.
3. Trong Supabase chọn SQL Editor → New query.
4. Paste nội dung.
5. Kiểm tra đang ở đúng project `kickzone-dev`.
6. Nhấn `Run` hoặc `Ctrl+Enter`.
7. Nếu có lỗi, không chạy từng đoạn ngẫu nhiên. Lưu nguyên error và kiểm tra trước khi thử lại.

Script chạy trong transaction. Nếu một câu lệnh lỗi trước `commit`, phần schema của lần chạy đó được rollback.

### Bước 5 — Tạo role runtime cho backend và cả nhóm

Role `prisma` có quyền thay đổi schema nên chỉ Database Owner giữ. Backend của mọi thành viên dùng role `kickzone_app` với quyền đọc/ghi dữ liệu nhưng không có quyền tạo hoặc xóa bảng.

Chạy một lần trong SQL Editor sau `init.sql`:

```sql
create user "kickzone_app"
  with password 'REPLACE_WITH_A_STRONG_RUNTIME_PASSWORD'
  bypassrls;

grant usage on schema public to kickzone_app;

grant usage on type public.user_role to kickzone_app;
grant usage on type public.user_status to kickzone_app;
grant usage on type public.field_status to kickzone_app;
grant usage on type public.booking_status to kickzone_app;
grant usage on type public.discount_type to kickzone_app;

grant select, insert, update, delete
  on all tables in schema public
  to kickzone_app;

grant execute
  on function public.set_updated_at()
  to kickzone_app;

alter default privileges for role postgres in schema public
  grant select, insert, update, delete on tables to kickzone_app;
```

Mật khẩu này là secret riêng của role `kickzone_app`, không phải database password của role `postgres`. Lưu trong password manager của nhóm; không ghi giá trị thật vào Markdown, `.env.example` hoặc Git.

### Bước 6 — Kiểm tra kết quả

SQL Editor sẽ trả về danh sách 11 bảng. Vào Table Editor và xác nhận:

```text
bookings
favorites
field_images
field_operating_hours
field_types
fields
price_rules
profiles
reviews
voucher_usages
vouchers
```

Trong Database → Policies, tất cả bảng trên phải hiển thị RLS enabled và chưa có policy cho `anon`/`authenticated`.

### Bước 7 — Lấy thông tin kết nối

Trong project, chọn `Connect`.

| Nhu cầu | Loại kết nối |
| --- | --- |
| NestJS local/server chạy lâu dài | Direct `5432` nếu có IPv6 |
| Máy chỉ có IPv4 | Supavisor Session `5432` |
| Prisma CLI/migration | Direct hoặc Session `5432` |
| Serverless/auto-scaling | Transaction pooler `6543` |

Với role custom, username trong pooler URL có dạng `ROLE.PROJECT_REF`.

Ví dụ placeholder:

```env
DATABASE_URL=postgresql://kickzone_app.PROJECT_REF:RUNTIME_PASSWORD@REGION.pooler.supabase.com:5432/postgres
DIRECT_URL=postgresql://prisma.PROJECT_REF:PRISMA_PASSWORD@REGION.pooler.supabase.com:5432/postgres
```

Không copy ví dụ này nguyên xi; dùng connection details đúng từ bảng `Connect`.

Tài liệu chính thức:

- [Supabase tables và SQL Editor](https://supabase.com/docs/guides/database/tables)
- [Kết nối PostgreSQL](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase với Prisma](https://supabase.com/docs/guides/database/prisma)
- [Supabase access control](https://supabase.com/docs/guides/platform/access-control)

## 4. Cách cả nhóm kết nối

### Quyền và secret

- Mọi thành viên được mời vào Supabase bằng email riêng.
- Thành viên làm full-stack nhận `DATABASE_URL` của role `kickzone_app`.
- Chỉ Database Owner nhận `DIRECT_URL` của role `prisma`.
- Frontend chỉ cần Project URL, publishable/anon key và API URL.
- Chỉ backend nhận service-role key.
- Secret được chia qua password manager hoặc secret manager của nơi deploy.

### Frontend

Tạo `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Các biến `NEXT_PUBLIC_` xuất hiện trong browser. Không đặt database URL hoặc service-role key tại đây.

### Backend

Tạo `apps/api/.env`:

```env
PORT=3001
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_URL=http://localhost:3000
RESEND_API_KEY=
EMAIL_FROM=
```

Ý nghĩa:

| Biến | Dùng để làm gì |
| --- | --- |
| `DATABASE_URL` | Role `kickzone_app` để NestJS/Prisma runtime đọc và ghi dữ liệu |
| `DIRECT_URL` | Role `prisma` để Database Owner introspect/migrate; thành viên khác có thể bỏ biến này |
| `SUPABASE_URL` | Backend gọi Supabase Auth/Storage |
| `SUPABASE_SERVICE_ROLE_KEY` | Quyền server cho Auth admin/Storage; không đưa xuống browser |
| `FRONTEND_URL` | CORS và redirect URL |
| `RESEND_API_KEY` | Gửi email booking |
| `EMAIL_FROM` | Địa chỉ người gửi email |

## 5. Cách khởi tạo và kiểm tra schema

### Chạy từ Supabase SQL Editor

Đây là cách dễ nhất cho lần đầu: copy toàn bộ `database/init.sql` và Run.

### Chạy bằng psql

Nếu đã cài PostgreSQL client:

```bash
psql "$DIRECT_URL" -v ON_ERROR_STOP=1 -f database/init.sql
```

PowerShell:

```powershell
psql $env:DIRECT_URL -v ON_ERROR_STOP=1 -f database/init.sql
```

Không ghi connection string thật trực tiếp vào terminal history nếu máy dùng chung.

### Các query kiểm tra

Kiểm tra 11 bảng:

```sql
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;
```

Kiểm tra RLS:

```sql
select
  schemaname,
  tablename,
  rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;
```

Kiểm tra index:

```sql
select tablename, indexname
from pg_indexes
where schemaname = 'public'
order by tablename, indexname;
```

Kiểm tra trigger:

```sql
select event_object_table, trigger_name
from information_schema.triggers
where trigger_schema = 'public'
order by event_object_table, trigger_name;
```

Kiểm tra reference data từ `init.sql`:

```sql
select id, name
from public.field_types
order by name;
```

Để thêm và kiểm tra toàn bộ dữ liệu demo, chạy `npm run db:seed --workspace @kickzone/api`. Script sẽ in số lượng profile, sân, voucher, booking, review và favorites đã seed trên Supabase.

### Bootstrap ADMIN đầu tiên

Không có API public để tự nâng role. Sau khi tài khoản admin đã đăng ký và xác nhận email trong Supabase Auth, Owner chạy một lần:

```sql
insert into public.profiles (
  auth_user_id,
  email,
  role,
  status
)
select
  id,
  lower(email),
  'ADMIN',
  'ACTIVE'
from auth.users
where lower(email) = lower('ADMIN_EMAIL_HERE')
on conflict (auth_user_id)
do update set
  email = excluded.email,
  role = 'ADMIN',
  status = 'ACTIVE';
```

Thay placeholder bằng đúng email đã xác nhận. Query phải tạo/cập nhật đúng một profile; không đưa email thật vào repository.

## 6. Tổng quan schema

| Nhóm | Bảng | Phục vụ màn hình/chức năng |
| --- | --- | --- |
| User | `profiles` | Profile, admin user list/status |
| Field | `field_types`, `fields` | Danh sách, tìm kiếm, chi tiết, CRUD |
| Field config | `field_images`, `field_operating_hours` | Gallery, availability |
| Pricing | `price_rules`, `vouchers` | Giá theo giờ, voucher |
| Booking | `bookings`, `voucher_usages` | Đặt sân, lịch sử, admin approval |
| Engagement | `reviews`, `favorites` | Đánh giá và sân yêu thích |

## 7. Chi tiết từng bảng và thuộc tính

### 7.1 `profiles`

Lưu hồ sơ KickZone của một identity đã được Supabase Auth xác minh.

| Thuộc tính | Kiểu | Dùng để làm gì | Ràng buộc |
| --- | --- | --- | --- |
| `id` | UUID | ID nội bộ dùng trong quan hệ booking/review | PK, tự sinh |
| `auth_user_id` | UUID | Liên kết với `sub` của Supabase Auth | UNIQUE, bắt buộc |
| `email` | text | Hiển thị/tìm user; là bản cache từ Auth | Không rỗng, indexed |
| `full_name` | text | Tên hiển thị của user | Có thể null |
| `avatar_path` | text | Storage path của avatar | Có thể null |
| `phone` | text | Liên hệ người đặt sân | Có thể null |
| `role` | enum | Phân quyền `USER`/`ADMIN` | Default `USER` |
| `status` | enum | Cho phép/chặn protected API | Default `ACTIVE` |
| `created_at` | timestamptz | Ngày tạo profile | Tự ghi |
| `updated_at` | timestamptz | Lần sửa profile gần nhất | Trigger cập nhật |

Không lưu password. Backend tạo profile idempotently sau request có Supabase access token hợp lệ; provisioning không được ghi đè role/status.

### 7.2 `field_types`

Danh mục loại sân dùng cho filter và form admin.

| Thuộc tính | Kiểu | Dùng để làm gì | Ràng buộc |
| --- | --- | --- | --- |
| `id` | UUID | ID loại sân | PK |
| `name` | text | Nhãn như `5-a-side` | UNIQUE, không rỗng |
| `description` | text | Giải thích loại sân | Có thể null |
| `created_at` | timestamptz | Ngày tạo | Tự ghi |
| `updated_at` | timestamptz | Ngày cập nhật | Trigger |

`init.sql` seed ba bản ghi: 5, 7 và 11 người.

### 7.3 `fields`

Mỗi record là một sân có thể đặt trực tiếp.

| Thuộc tính | Kiểu | Dùng để làm gì | Ràng buộc |
| --- | --- | --- | --- |
| `id` | UUID | ID sân | PK |
| `field_type_id` | UUID | Phân loại sân | FK → `field_types` |
| `name` | text | Tên hiển thị | Không rỗng |
| `slug` | text | URL thân thiện | UNIQUE, lowercase-kebab-case |
| `description` | text | Nội dung trang chi tiết | Có thể null |
| `address` | text | Địa chỉ đầy đủ | Không rỗng |
| `city` | text | Lọc theo thành phố | Không rỗng |
| `district` | text | Lọc theo quận/huyện | Không rỗng, indexed |
| `latitude` | numeric | Vĩ độ bản đồ | -90..90 hoặc null |
| `longitude` | numeric | Kinh độ bản đồ | -180..180 hoặc null |
| `base_price_per_hour` | integer | Giá VND/giờ khi không có price rule | >= 0, số chẵn |
| `status` | enum | Bật/tắt nhận booking | Default `ACTIVE` |
| `deleted_at` | timestamptz | Soft delete, giữ lịch sử | Null khi còn dùng |
| `created_at` | timestamptz | Ngày tạo | Tự ghi |
| `updated_at` | timestamptz | Lần sửa gần nhất | Trigger |

Public query chỉ lấy sân có `deleted_at IS NULL` và phù hợp status. Không hard-delete sân có lịch sử.

### 7.4 `field_images`

Metadata hình ảnh; file thật nằm trong Supabase Storage.

| Thuộc tính | Kiểu | Dùng để làm gì | Ràng buộc |
| --- | --- | --- | --- |
| `id` | UUID | ID metadata ảnh | PK |
| `field_id` | UUID | Ảnh thuộc sân nào | FK → `fields`, CASCADE |
| `storage_path` | text | Đường dẫn object trong Storage | Không rỗng |
| `alt_text` | text | Accessibility/SEO | Có thể null |
| `sort_order` | integer | Thứ tự gallery | >= 0 |
| `is_primary` | boolean | Ảnh đại diện field card | Mỗi sân tối đa một ảnh |
| `created_at` | timestamptz | Ngày upload metadata | Tự ghi |

Không lưu signed URL vì URL này hết hạn.

### 7.5 `field_operating_hours`

Lịch mở cửa theo thứ trong tuần, dùng chung cho availability và admin schedule.

| Thuộc tính | Kiểu | Dùng để làm gì | Ràng buộc |
| --- | --- | --- | --- |
| `id` | UUID | ID lịch | PK |
| `field_id` | UUID | Sân áp dụng | FK → `fields`, CASCADE |
| `day_of_week` | smallint | Thứ trong tuần, `0 = Sunday` | 0..6 |
| `open_time` | time | Giờ mở | Null nếu đóng |
| `close_time` | time | Giờ đóng | Null nếu đóng |
| `is_closed` | boolean | Đánh dấu ngày nghỉ | Default false |
| `created_at` | timestamptz | Ngày tạo | Tự ghi |
| `updated_at` | timestamptz | Ngày sửa | Trigger |

Mỗi sân chỉ có một record cho mỗi thứ. Overnight schedule chưa hỗ trợ.

### 7.6 `price_rules`

Giá đặc biệt theo ngày/giờ, ví dụ giờ cao điểm.

| Thuộc tính | Kiểu | Dùng để làm gì | Ràng buộc |
| --- | --- | --- | --- |
| `id` | UUID | ID mức giá | PK |
| `field_id` | UUID | Sân áp dụng | FK → `fields`, CASCADE |
| `name` | text | Nhãn admin, ví dụ “Giờ cao điểm” | Không rỗng |
| `day_of_week` | smallint | Chỉ áp dụng một thứ; null = mọi ngày | Null hoặc 0..6 |
| `start_time` | time | Bắt đầu khung giá | < `end_time` |
| `end_time` | time | Kết thúc khung giá | > `start_time` |
| `price_per_hour` | integer | Giá VND/giờ của rule | >= 0, số chẵn |
| `effective_from` | date | Ngày bắt đầu hiệu lực | Inclusive, có thể null |
| `effective_to` | date | Ngày hết hiệu lực | Inclusive, có thể null |
| `priority` | integer | Chọn rule khi nhiều rule trùng | Cao hơn thắng |
| `is_active` | boolean | Bật/tắt rule | Default true |
| `created_at` | timestamptz | Tạo rule lúc nào | Tự ghi |
| `updated_at` | timestamptz | Sửa rule lúc nào | Trigger |

Tie-break: priority cao nhất → `created_at` mới nhất → `id` lexical tăng dần.

### 7.7 `vouchers`

Định nghĩa mã giảm giá.

| Thuộc tính | Kiểu | Dùng để làm gì | Ràng buộc |
| --- | --- | --- | --- |
| `id` | UUID | ID voucher | PK |
| `code` | text | Mã user nhập | UNIQUE, trim + uppercase |
| `discount_type` | enum | Giảm phần trăm hay số tiền cố định | `PERCENT`/`FIXED` |
| `value` | integer | % hoặc số VND giảm | Percent 1..100; fixed > 0 |
| `max_discount` | integer | Trần giảm cho voucher % | >= 0 hoặc null |
| `min_order_value` | integer | Giá tối thiểu trước discount | >= 0 hoặc null |
| `start_at` | timestamptz | Bắt đầu sử dụng | Inclusive hoặc null |
| `end_at` | timestamptz | Ngừng sử dụng | Exclusive hoặc null |
| `usage_limit` | integer | Số lượt toàn hệ thống | > 0 hoặc null |
| `per_user_limit` | integer | Số lượt mỗi user | > 0 hoặc null |
| `is_active` | boolean | Admin bật/tắt voucher | Default true |
| `created_at` | timestamptz | Ngày tạo | Tự ghi |
| `updated_at` | timestamptz | Ngày sửa | Trigger |

### 7.8 `bookings`

Bảng trung tâm lưu đơn đặt sân và snapshot giá authoritative.

| Thuộc tính | Kiểu | Dùng để làm gì | Ràng buộc |
| --- | --- | --- | --- |
| `id` | UUID | ID nội bộ booking | PK |
| `code` | text | Mã hiển thị/tìm kiếm như `KZ-...` | UNIQUE, DB tự sinh |
| `user_id` | UUID | Người đặt | FK → `profiles`, RESTRICT |
| `field_id` | UUID | Sân được đặt | FK → `fields`, RESTRICT |
| `voucher_id` | UUID | Voucher đã áp dụng | FK → `vouchers` hoặc null |
| `start_time` | timestamptz | Thời điểm bắt đầu thực tế | ISO offset từ API |
| `end_time` | timestamptz | Thời điểm kết thúc thực tế | > start |
| `status` | enum | Trạng thái workflow | Default `PENDING` |
| `original_price` | integer | Giá backend tính trước voucher | >= 0 |
| `discount_amount` | integer | Số VND được giảm | 0..original |
| `final_price` | integer | Giá cuối cùng | original - discount |
| `cancellation_reason` | text | Lý do user hủy | Có thể null |
| `rejection_reason` | text | Lý do admin từ chối | Có thể null |
| `created_at` | timestamptz | Thời điểm tạo đơn | Tự ghi |
| `updated_at` | timestamptz | Lần chuyển trạng thái/sửa gần nhất | Trigger |

Database kiểm tra:

- start < end
- cùng ngày theo `Asia/Ho_Chi_Minh`
- mốc thời gian nằm trên biên 30 phút
- price snapshot không âm và cân bằng

Backend vẫn phải kiểm tra thời gian tương lai, operating hours, overlap và concurrency.

### 7.9 `voucher_usages`

Lịch sử voucher gắn với booking.

| Thuộc tính | Kiểu | Dùng để làm gì | Ràng buộc |
| --- | --- | --- | --- |
| `id` | UUID | ID usage | PK |
| `voucher_id` | UUID | Voucher được dùng | FK → `vouchers` |
| `user_id` | UUID | User sử dụng | FK → `profiles` |
| `booking_id` | UUID | Booking tiêu thụ voucher | UNIQUE, FK → `bookings` |
| `used_at` | timestamptz | Thời điểm ghi nhận | Tự ghi |

Composite FK đảm bảo user/voucher usage khớp booking. Không xóa record khi booking bị cancel/reject; query limit chỉ đếm booking ở trạng thái tiêu thụ.

### 7.10 `reviews`

Đánh giá hợp lệ dựa trên một booking đã hoàn thành.

| Thuộc tính | Kiểu | Dùng để làm gì | Ràng buộc |
| --- | --- | --- | --- |
| `id` | UUID | ID review | PK |
| `user_id` | UUID | Người viết | FK → `profiles` |
| `field_id` | UUID | Sân được đánh giá | FK → `fields` |
| `booking_id` | UUID | Bằng chứng đã đặt sân | UNIQUE, FK → `bookings` |
| `rating` | smallint | Số sao | 1..5 |
| `content` | text | Nội dung review | Không rỗng |
| `created_at` | timestamptz | Ngày viết | Tự ghi |
| `updated_at` | timestamptz | Ngày sửa | Trigger |

Composite FK đảm bảo booking thuộc đúng user và field. Backend kiểm tra thêm booking phải `COMPLETED`.

### 7.11 `favorites`

Quan hệ user lưu sân yêu thích.

| Thuộc tính | Kiểu | Dùng để làm gì | Ràng buộc |
| --- | --- | --- | --- |
| `id` | UUID | ID record | PK |
| `user_id` | UUID | User lưu sân | FK → `profiles`, CASCADE |
| `field_id` | UUID | Sân được lưu | FK → `fields`, CASCADE |
| `created_at` | timestamptz | Dùng sort mới nhất | Tự ghi |

`UNIQUE(user_id, field_id)` ngăn favorite trùng.

## 8. Quan hệ dữ liệu

```mermaid
erDiagram
    profiles ||--o{ bookings : creates
    profiles ||--o{ reviews : writes
    profiles ||--o{ favorites : saves
    profiles ||--o{ voucher_usages : consumes

    field_types ||--o{ fields : categorizes
    fields ||--o{ field_images : has
    fields ||--o{ field_operating_hours : opens
    fields ||--o{ price_rules : prices
    fields ||--o{ bookings : receives
    fields ||--o{ reviews : receives
    fields ||--o{ favorites : saved_as

    vouchers ||--o{ bookings : discounts
    vouchers ||--o{ voucher_usages : tracks
    bookings ||--o| reviews : proves
    bookings ||--o| voucher_usages : records
```

## 9. Quy tắc booking, thời gian và giá

### Overlap

```text
new_start < existing_end
AND
new_end > existing_start
```

Chỉ `PENDING` và `CONFIRMED` block lịch. Hai booking chạm đầu/cuối nhau hợp lệ.

### Transaction tạo booking

1. Bắt đầu transaction ngắn.
2. Lock row `fields` bằng `SELECT ... FOR UPDATE`.
3. Kiểm tra field active/chưa delete, operating hours và overlap.
4. Tính giá từng segment 30 phút.
5. Nếu có voucher, lock voucher sau field.
6. Tạo booking `PENDING` và `voucher_usages`.
7. Commit.
8. Gửi email sau commit.

Lock order luôn là `field → voucher`.

### Status transition

| From | To | Ai thực hiện |
| --- | --- | --- |
| `PENDING` | `CONFIRMED` | Admin |
| `PENDING` | `REJECTED` | Admin |
| `PENDING` | `CANCELLED` | Booking owner |
| `CONFIRMED` | `COMPLETED` | Scheduler |

Không có arbitrary status update.

### Time và price

- Business timezone: `Asia/Ho_Chi_Minh`.
- API timestamp phải có `Z` hoặc offset.
- Booking cùng local date và chia theo 30 phút.
- VND lưu bằng integer.
- Giá theo giờ là số chẵn để nửa giờ vẫn là integer.
- Backend tính authoritative price; frontend chỉ preview.

## 10. RLS và bảo mật

`init.sql` bật RLS trên cả 11 bảng và revoke quyền từ:

- `anon`
- `authenticated`
- `service_role`

Không có policy Data API, nên browser không thể CRUD domain tables. Đây là chủ ý:

```text
Browser → NestJS → Prisma role → PostgreSQL
```

Browser dùng Supabase client cho Auth, không dùng nó để query trực tiếp booking/field/voucher.

Role `prisma` có `BYPASSRLS`, vì vậy connection string của role này là secret backend nghiêm ngặt. Service-role key cũng không được đặt trong frontend.

Supabase yêu cầu tự bật RLS cho bảng tạo bằng raw SQL/SQL Editor; script đã thực hiện việc này. Xem [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security) và [Securing the Data API](https://supabase.com/docs/guides/api/securing-your-api).

## 11. Trigger và index

### Trigger `set_updated_at`

Trước mỗi update, trigger đặt `updated_at = now()` cho:

- profiles
- field_types
- fields
- field_operating_hours
- price_rules
- vouchers
- bookings
- reviews

Nhờ đó service không phải tự truyền `updated_at` ở mọi query.

### Index chính

| Index group | Hỗ trợ |
| --- | --- |
| `fields(field_type_id/status/district/base_price)` | Search và filter |
| `field_images(field_id, sort_order)` | Gallery |
| `price_rules(...)` | Lookup giá theo field/ngày/giờ |
| `bookings(field_id, start/end/status)` | Availability và overlap |
| `bookings(user_id, created_at)` | Lịch sử user |
| `bookings(status, end_time)` | Scheduler completion |
| `voucher_usages(voucher_id, user_id)` | Usage limit |
| `reviews(field_id, created_at)` | Review list |
| `favorites(user_id, created_at)` | Favorite list |

Partial unique index đảm bảo mỗi sân tối đa một ảnh primary.

## 12. Đồng bộ Prisma

Sau khi chạy `init.sql`, Database Owner đồng bộ database-first schema:

```bash
cd apps/api
npx prisma db pull
npx prisma format
npx prisma validate
npx prisma generate
```

Sau đó:

1. Review `schema.prisma`.
2. Đổi model/field sang PascalCase/camelCase và dùng `@@map`/`@map` nếu Prisma introspect giữ snake_case.
3. Kiểm tra enum, composite FK và partial index.
4. Commit `schema.prisma` trong một PR database riêng.

Lưu ý: Prisma schema hiện chưa được pull trong repo vì chưa có Supabase credential. Không để từng thành viên tự chạy `db pull` rồi tạo bốn phiên bản schema khác nhau. Database Owner chạy và commit một lần; thành viên còn lại chỉ pull Git và chạy:

```bash
cd apps/api
npx prisma generate
```

## 13. Quản lý thay đổi database

`init.sql` là baseline cho project mới, không phải nơi liên tục sửa database đã chạy.

Sau khi baseline được áp dụng:

1. Tạo branch `db/<scope>`.
2. Thống nhất thay đổi với Database Owner.
3. Tạo file `database/migrations/YYYYMMDDHHMM_description.sql`, không sửa lịch sử đã chạy.
4. Review SQL về data loss, lock, constraint và index.
5. Apply trên development trước.
6. Đồng bộ `schema.prisma`.
7. Commit migration + Prisma schema + tài liệu trong cùng PR.

Không dùng `prisma db push` trên shared/staging/production vì không có migration history rõ ràng.

Chỉ Database Owner hoặc CI apply schema lên shared Supabase. Tránh hai thành viên chạy DDL cùng lúc vì Dashboard SQL Editor dùng quyền mạnh.

## 14. Checklist

### Khi tạo Supabase

- [ ] Tạo `kickzone-dev`.
- [ ] Lưu database password trong password manager.
- [ ] Mời thành viên bằng tài khoản riêng.
- [ ] Tạo role `prisma`.
- [ ] Chạy toàn bộ `database/init.sql`.
- [ ] Xác nhận đủ 11 bảng.
- [ ] Xác nhận RLS enabled.
- [ ] Xác nhận ba field types đã seed.
- [ ] Lấy connection string từ `Connect`.
- [ ] Chia secret đúng người/đúng kênh.
- [ ] Database Owner chạy `prisma db pull` và commit schema.

### Trước khi merge database change

- [ ] Không có password/token trong Git.
- [ ] Constraint và FK delete action đúng.
- [ ] Index phục vụ query chính.
- [ ] SQL chạy thành công trên development.
- [ ] `prisma validate` và `prisma generate` pass.
- [ ] Business rule có test.
- [ ] `database.md` được cập nhật.

### Database foundation được xem là hoàn tất khi

- `init.sql` chạy thành công trên Supabase development.
- Đủ 11 bảng, enum, constraint, trigger, index và RLS.
- Prisma schema đã đồng bộ và generate được.
- NestJS chạy được query `select 1`.
- Team clone repo có thể setup chỉ bằng README/database guide.
- Test concurrent overlap cho kết quả đúng một booking thành công.
