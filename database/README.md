# Dữ liệu database dùng chung

Thư mục này chứa schema và dữ liệu mẫu của PostgreSQL/Supabase development.

## Phân biệt schema, migration và seed

| Thành phần | Mục đích | Khi nào chạy |
| --- | --- | --- |
| `init.sql` | Khởi tạo toàn bộ schema trên một Supabase project mới | Một lần khi tạo database |
| `migrations/` | Ghi lại từng thay đổi cấu trúc sau baseline | Theo thứ tự, do Database Owner chạy |
| `seed.sql` | Thêm hoặc cập nhật dữ liệu mẫu để phát triển/demo | Sau `init.sql`, có thể chạy lại |

Không đặt dữ liệu mẫu vào `migrations/`. Migration cần ổn định và tập trung vào cấu trúc; seed có thể được cập nhật khi nhóm cần thêm kịch bản demo.

## Dữ liệu hiện có trong `seed.sql`

| Bảng | Số lượng demo | Nội dung |
| --- | ---: | --- |
| `field_types` | 3 | Sân 5, 7 và 11 người |
| `fields` | 12 | Các sân mẫu tại Thành phố Hồ Chí Minh |
| `field_images` | 12 | Một ảnh đại diện công khai cho mỗi sân |
| `field_operating_hours` | 84 | Bảy ngày hoạt động cho mỗi sân |
| `price_rules` | 8 | Giá giờ cao điểm và giá Chủ nhật |
| `vouchers` | 4 | `CHAOMUNG`, `GIAM50K`, `CUOITUAN15`, `HETHAN` |
| `profiles` | 4 | Ba người dùng demo và một quản trị viên demo |
| `bookings` | 7 | Đủ trạng thái PENDING, CONFIRMED, REJECTED, CANCELLED, COMPLETED |
| `voucher_usages` | 3 | Lịch sử sử dụng voucher trong booking demo |
| `reviews` | 3 | Đánh giá tiếng Việt cho booking đã hoàn thành |
| `favorites` | 6 | Các sân yêu thích của profile demo |

Ngày booking được tính tương đối từ ngày chạy seed theo múi giờ `Asia/Ho_Chi_Minh`, nên luôn có dữ liệu quá khứ và tương lai phù hợp để demo.

### Profile demo không phải tài khoản đăng nhập

Các record `profiles` chỉ phục vụ dữ liệu quan hệ trong database. Seed không tạo tài khoản trong `auth.users`, không đặt mật khẩu và không thể dùng các email demo để đăng nhập Supabase Auth.

Muốn test đăng nhập, thành viên phải đăng ký một tài khoản thật qua ứng dụng/Supabase Auth. Backend sẽ provision profile từ danh tính đã xác thực.

## Cách chạy lên Supabase development

### Cách khuyến nghị từ project

Database Owner cấu hình `DATABASE_URL` trong `apps/api/.env`, sau đó chạy tại thư mục gốc:

```bash
npm run db:seed --workspace @kickzone/api
```

Script sử dụng đúng file `database/seed.sql`. Không commit `.env`, password hoặc connection string.

### Chạy bằng Supabase SQL Editor

1. Mở Supabase Dashboard → SQL Editor.
2. Tạo query mới.
3. Copy toàn bộ nội dung `database/seed.sql`.
4. Chọn **Run**.
5. Mở Table Editor để kiểm tra dữ liệu.

## UTF-8 và tiếng Việt

- `seed.sql` được lưu dưới dạng UTF-8.
- Script đặt `client_encoding = 'UTF8'` trong transaction.
- Không mở rồi lưu file dưới ANSI/Windows-1258.
- Trong VS Code, góc dưới bên phải phải hiển thị `UTF-8`.

## Quy tắc cập nhật seed

1. Seed phải chạy lại được mà không nhân đôi dữ liệu.
2. Dùng `ON CONFLICT` với khóa ổn định như `slug`, `code` hoặc khóa unique.
3. Không đưa password, token, API key hoặc connection string vào seed.
4. Không dùng `TRUNCATE`, `DROP` hoặc xóa dữ liệu thật của thành viên.
5. Khi thêm dữ liệu, cập nhật bảng thống kê trong file này và ghi rõ trong Pull Request.

