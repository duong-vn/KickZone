# Contributing to KickZone

Tài liệu này quy định cách team 4 người làm việc với branch, commit, Pull Request và database migration.

## 1. Nguyên tắc

- `main` luôn phải build được và có thể demo/deploy.
- Không push commit trực tiếp vào `main`.
- Một branch giải quyết một phạm vi rõ ràng.
- Một Pull Request nên nhỏ, review được trong khoảng 15–30 phút.
- Không trộn refactor không liên quan vào feature PR.
- Không commit secret, file `.env`, token, password hoặc dữ liệu người dùng thật.
- Contract frontend/backend và database phải được thay đổi trong cùng PR hoặc được ghi rõ thứ tự rollout.
- P0 booking flow được ưu tiên trước P1/P2.

## 2. Branch model

Repository dùng trunk-based flow đơn giản:

```text
main
 ├── feature/field-list
 ├── feature/booking-create
 ├── fix/booking-overlap
 ├── db/init-core-schema
 └── docs/supabase-setup
```

Không tạo branch dài hạn như `develop`, `frontend` hoặc `backend`. Mỗi thành viên có thể làm nhiều branch ngắn theo task.

### Tên branch

```text
feature/<scope>
fix/<scope>
db/<scope>
docs/<scope>
test/<scope>
refactor/<scope>
chore/<scope>
ci/<scope>
```

Ví dụ:

```text
feature/supabase-auth
feature/field-availability
fix/concurrent-booking
db/init-core-schema
docs/api-contract
```

Nếu coding agent tự tạo branch, dùng prefix `codex/`, ví dụ `codex/booking-tests`.

## 3. Bắt đầu một task

```bash
git switch main
git pull --rebase origin main
git switch -c feature/field-list
```

Trước khi code:

1. Đọc task và acceptance criteria.
2. Kiểm tra branch hiện tại bằng `git status`.
3. Đọc contract/schema liên quan.
4. Xác nhận không có người khác cùng sửa migration hoặc file trung tâm.

## 4. Commit convention

Dùng Conventional Commits:

```text
<type>(<scope>): <short imperative description>
```

Các type:

| Type | Dùng khi |
| --- | --- |
| `feat` | Thêm chức năng |
| `fix` | Sửa bug |
| `db` | Schema, migration, seed |
| `docs` | Tài liệu |
| `test` | Thêm/sửa test |
| `refactor` | Đổi cấu trúc, không đổi behavior |
| `chore` | Tooling/dependency/maintenance |
| `ci` | GitHub Actions/CI |
| `style` | Chỉ formatting, không đổi logic |

Ví dụ:

```text
feat(fields): add paginated public field list
feat(auth): provision profile from verified Supabase user
fix(bookings): reject overlapping pending reservations
db(prisma): add core booking models
docs(setup): document shared Supabase workflow
test(pricing): cover mixed price-rule segments
```

Quy tắc message:

- Viết tiếng Anh để thống nhất với source code.
- Dòng đầu tối đa khoảng 72 ký tự nếu có thể.
- Dùng động từ hiện tại: `add`, `fix`, `prevent`, `document`.
- Không dùng message mơ hồ như `update`, `fix bug`, `done`, `final`.

### Tạo commit

```bash
git status
git diff
git add <specific-files>
git diff --staged
git commit -m "feat(fields): add paginated field list"
```

Ưu tiên `git add <file>` hoặc `git add -p` thay vì luôn dùng `git add .`, để tránh đưa file ngoài phạm vi vào commit.

## 5. Đồng bộ với main

Trước khi push hoặc mở PR:

```bash
git fetch origin
git rebase origin/main
```

Nếu conflict:

```bash
git status
# sửa từng file conflict
git add <resolved-files>
git rebase --continue
```

Nếu muốn dừng rebase và quay về trạng thái trước đó:

```bash
git rebase --abort
```

Sau khi rebase một branch đã push, dùng:

```bash
git push --force-with-lease
```

Không dùng `git push --force`. `--force-with-lease` dừng nếu remote đã có commit mới của người khác.

## 6. Kiểm tra trước Pull Request

Từ repository root:

```bash
npm run format:check
npm run lint
npm run typecheck
npm test
npm run build
```

Chạy thêm test liên quan nếu có:

```bash
cd apps/api
npm run test:e2e
```

PR có database change phải chạy thêm:

```bash
cd apps/api
npx prisma format
npx prisma validate
npx prisma generate
npx prisma migrate status
```

Nếu không thể chạy một lệnh do thiếu service/credential, ghi rõ trong PR; không ghi chung chung là “chưa test”.

## 7. Pull Request

### Mở PR

```bash
git push -u origin feature/field-list
```

Mở PR vào `main`. Có thể mở Draft PR sớm khi cần thống nhất contract.

PR description nên có:

```markdown
## Summary
- Thay đổi chính
- Lý do

## Database/API changes
- Migration hoặc endpoint/DTO thay đổi
- Nếu không có, ghi None

## Verification
- npm run lint
- npm run typecheck
- npm test

## Screenshots
- Chỉ cần cho thay đổi UI

## Setup / unresolved
- Env mới, provider hoặc thao tác thủ công còn cần làm
```

### PR checklist

- [ ] PR chỉ có một mục tiêu chính.
- [ ] Không có secret hoặc dữ liệu thật.
- [ ] Lint/typecheck/test liên quan pass.
- [ ] UI có loading, empty và error state phù hợp.
- [ ] API validate DTO/query và kiểm tra auth/ownership.
- [ ] Frontend không gửi/trust userId, role hoặc booking price.
- [ ] Docs/`.env.example` được cập nhật nếu setup thay đổi.
- [ ] Migration và schema nằm cùng PR nếu database thay đổi.
- [ ] Không có refactor ngoài phạm vi.

### Review và merge

- Cần ít nhất một approval từ thành viên khác.
- Thay đổi auth/permission cần Backend Lead hoặc Tech Lead review.
- Thay đổi booking/availability/pricing/migration cần Tech Lead/Database Owner review.
- Thay đổi design system cần Frontend Lead review.
- Không merge khi CI đỏ.
- Dùng Squash and merge để `main` có lịch sử gọn; squash commit phải theo Conventional Commits.
- Sau khi merge, xóa branch remote.

## 8. Database change workflow

Database Owner hiện tại: Tech Lead phụ trách database/Prisma.

Baseline đầu tiên nằm tại `database/init.sql`. Chỉ Database Owner chạy file này lên Supabase development, sau đó introspect và commit Prisma schema:

```bash
cd apps/api
npx prisma db pull
npx prisma format
npx prisma validate
npx prisma generate
```

Sau baseline, trước khi tạo migration mới phải báo trong nhóm để tránh hai người cùng thay đổi shared database. PR database phải bao gồm:

- `apps/api/prisma/schema.prisma`
- file `database/migrations/YYYYMMDDHHMM_description.sql`
- check constraints/indexes Prisma không sinh đủ
- seed thay đổi nếu cần
- cập nhật `database.md`
- test cho business rule bị ảnh hưởng

Không được:

- dùng `prisma db push` trên database dùng chung
- sửa migration đã merge
- tiếp tục sửa `database/init.sql` để thay đổi database đã chạy thay vì tạo migration mới
- xóa dữ liệu để migration “chạy được”
- chạy migration production từ máy cá nhân nếu chưa được giao
- để nhiều người chạy `migrate dev` đồng thời vào shared Supabase

Shared environment chỉ được apply bằng Database Owner hoặc CI theo migration workflow được chọn trong PR.

## 9. Xử lý thay đổi chưa commit

Xem thay đổi:

```bash
git status
git diff
git diff --staged
```

Tạm cất thay đổi để chuyển branch:

```bash
git stash push -u -m "wip: booking form"
git stash list
git stash pop
```

Bỏ stage nhưng giữ nội dung file:

```bash
git restore --staged <file>
```

Khôi phục file sẽ làm mất thay đổi chưa commit, vì vậy phải xem `git diff` trước:

```bash
git restore <file>
```

Không dùng `git reset --hard` hoặc xóa branch khi chưa chắc thay đổi đã được commit/push.

## 10. Các lệnh Git thường dùng

| Mục đích | Lệnh |
| --- | --- |
| Xem trạng thái | `git status` |
| Xem lịch sử ngắn | `git log --oneline --graph --decorate -15` |
| Xem branch | `git branch -a` |
| Tạo/chuyển branch | `git switch -c feature/name` |
| Chuyển branch | `git switch main` |
| Lấy metadata remote | `git fetch origin` |
| Cập nhật main | `git pull --rebase origin main` |
| Xem thay đổi | `git diff` |
| Stage theo phần | `git add -p` |
| Bỏ stage | `git restore --staged <file>` |
| Sửa commit cuối chưa push | `git commit --amend` |
| Push lần đầu | `git push -u origin <branch>` |
| Push sau rebase | `git push --force-with-lease` |
| Tạm cất WIP | `git stash push -u -m "wip: scope"` |

## 11. Definition of done

Một task chỉ hoàn thành khi:

- Acceptance criteria đã chạy được, không chỉ có code scaffold.
- Tests phù hợp đã pass.
- API/schema/frontend contract đồng bộ.
- Không có secret hoặc log nhạy cảm.
- Tài liệu/setup được cập nhật.
- PR đã được review và CI pass.
- Các bước thủ công, env hoặc provider chưa hoàn tất được ghi rõ.
