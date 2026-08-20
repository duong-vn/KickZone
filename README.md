# KickZone

KickZone là hệ thống tìm kiếm, đặt lịch và quản lý sân bóng. Repository dùng npm workspaces, gồm frontend Next.js và REST API NestJS.

> Trạng thái hiện tại: development foundation đã được khởi tạo. Database models, migrations, authentication flow và các module nghiệp vụ chưa được triển khai.

## Tài liệu chung

- [Thiết kế và thiết lập database](./database.md)
- [Quy trình Git và đóng góp](./CONTRIBUTING.md)
- [Quy tắc dành cho coding agent](./AGENTS.md)

Khi tài liệu mâu thuẫn, thứ tự ưu tiên là: yêu cầu mentor/project → `AGENTS.md` → `database.md` → mockup Excel. Các endpoint ghi trong mockup chỉ là gợi ý giao diện, không phải contract cuối cùng.

## Kiến trúc

```text
Browser
   ├── Next.js web
   ├── Supabase Auth (email/password, Google, Facebook)
   └── NestJS REST API
          ├── Prisma → PostgreSQL trên Supabase
          ├── Supabase Storage
          └── Resend
```

- Browser chỉ dùng Supabase trực tiếp cho Auth.
- Dữ liệu nghiệp vụ như sân, booking, voucher và review đi qua NestJS.
- NestJS là nơi kiểm tra quyền, tính giá, chống trùng lịch và xử lý trạng thái booking.
- PostgreSQL là nguồn dữ liệu chuẩn duy nhất cho nghiệp vụ.

## C ông nghệ

### Frontend

- Next.js 16, React 19, TypeScript
- Tailwind CSS 4, shadcn/ui
- TanStack Query, Axios
- React Hook Form, Zod
- Supabase JavaScript client

### Backend

- NestJS 11, TypeScript
- Prisma 7, PostgreSQL
- class-validator, Swagger
- `@nestjs/schedule`

## Yêu cầu máy phát triển

- Node.js 24+
- npm 11+
- Git
- Tài khoản GitHub được cấp quyền vào repository
- Tài khoản Supabase được mời vào project KickZone

Kiểm tra phiên bản:

```bash
node --version
npm --version
git --version
```

## Cài đặt lần đầu

```bash
git clone <repository-url>
cd KickZone
npm ci
```

Tạo file môi trường từ template:

```bash
# macOS/Linux
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env

# PowerShell
Copy-Item apps/web/.env.example apps/web/.env.local
Copy-Item apps/api/.env.example apps/api/.env
```

Không commit `.env`, `.env.local`, database password, access token hoặc service-role key.

## Biến môi trường

### `apps/web/.env.local`

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=http://localhost:3001
```

Các biến có prefix `NEXT_PUBLIC_` được đưa xuống browser. Không đặt `SUPABASE_SERVICE_ROLE_KEY` hoặc database URL trong frontend.

### `apps/api/.env`

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

- `DATABASE_URL`: connection string dùng khi NestJS chạy.
- `DIRECT_URL`: connection string của role `prisma`, chỉ Database Owner cần khi introspect/migrate. Có thể bỏ hẳn biến này trên máy thành viên; Prisma sẽ dùng `DATABASE_URL`.
- `SUPABASE_SERVICE_ROLE_KEY`: chỉ tồn tại ở backend và secret manager của môi trường deploy.

Giá trị thật được chia sẻ qua password manager hoặc kênh secret của nhóm, không gửi trong issue, PR, chat công khai hoặc screenshot.

## Tạo Supabase project cho nhóm

Owner/Tech Lead thực hiện một lần:

1. Tạo organization/project Supabase dành riêng cho môi trường development.
2. Chọn region phù hợp với nơi deploy và đặt database password mạnh.
3. Vào Organization Settings → Team, mời thành viên với role `Developer`. Chỉ Tech Lead cần `Owner` hoặc `Administrator`.
4. Bật email confirmation trong Auth; thêm URL local và URL deploy vào danh sách redirect cho OAuth/password recovery.
5. Cấu hình Google và Facebook provider khi bắt đầu phần Auth.
6. Tạo Postgres role `prisma` theo hướng dẫn trong [database.md](./database.md#3-cách-tạo-database-trên-supabase).
7. Chạy toàn bộ [`database/init.sql`](./database/init.sql) trong Supabase SQL Editor.
8. Tạo role runtime `kickzone_app` và cấp quyền theo [database.md](./database.md#bước-5--tạo-role-runtime-cho-backend-và-cả-nhóm).
9. Dùng Session pooler của role `kickzone_app` làm `DATABASE_URL` trong `apps/api/.env`.
10. Lấy Project URL và anon key cho `apps/web/.env.local`; service-role key chỉ điền ở backend.

Không tạo 11 bảng nghiệp vụ từng cái bằng Table Editor. Lần đầu dùng script đã review trong repo; các thay đổi sau đó phải dùng migration mới.

## Database workflow

Database Owner chạy `database/init.sql` một lần trên Supabase development. Sau đó đồng bộ Prisma:

```bash
cd apps/api
npx prisma db pull --force
npx prisma format
npx prisma validate
npx prisma generate
```

Database Owner review và commit `schema.prisma`. Các thành viên khác chỉ cần:

```bash
git pull --rebase origin main
npm ci
cd apps/api
npx prisma generate
```

Sau baseline, không sửa lịch sử đã chạy. Mỗi thay đổi schema cần migration riêng và chỉ Database Owner/CI được apply lên shared environment. Không dùng `prisma db push` trên database dùng chung vì lệnh này không tạo migration history rõ ràng.

## Chạy dự án

Mở hai terminal từ repository root:

```bash
npm run dev:web
npm run dev:api
```

- Web: <http://localhost:3000>
- API: <http://localhost:3001>
- Swagger: <http://localhost:3001/docs>

## Lệnh thường dùng

```bash
npm run dev:web       # Chạy Next.js
npm run dev:api       # Chạy NestJS watch mode
npm run build         # Build mọi workspace
npm run lint          # ESLint
npm run typecheck     # TypeScript check
npm test              # Unit test API
npm run format:check  # Kiểm tra Prettier
npm run format        # Format source
```

Prisma:

```bash
cd apps/api
npx prisma validate
npx prisma generate
npx prisma migrate status
npx prisma studio
```

## Quy ước dữ liệu quan trọng

- Business timezone: `Asia/Ho_Chi_Minh`.
- Booking được lưu bằng `timestamptz`, API dùng ISO 8601 có `Z` hoặc UTC offset.
- Giá dùng integer VND, không dùng floating point.
- Chỉ `PENDING` và `CONFIRMED` chặn lịch.
- Mọi giá booking được tính lại ở backend.
- Sân dùng soft delete; user dùng trạng thái `INACTIVE`.
- Không có password/password hash trong bảng `profiles`.

Chi tiết schema, constraints, indexes, transaction và Supabase security nằm trong [database.md](./database.md).

## Làm việc nhóm

- Không commit trực tiếp vào `main`.
- Mỗi thay đổi nằm trong một branch và một Pull Request nhỏ, có phạm vi rõ ràng.
- Migration phải đi cùng thay đổi `schema.prisma` và phải được Database Owner review.
- Trước khi mở PR phải chạy lint, typecheck và test liên quan.

Xem quy trình đầy đủ tại [CONTRIBUTING.md](./CONTRIBUTING.md).
