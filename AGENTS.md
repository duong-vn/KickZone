# AGENTS.md — GoalSlot

> **Project:** GoalSlot — Soccer Field Booking & Management System  
> **Duration:** 7-day internship final project  
> **Current phase:** Planning/documentation; implementation has not started  
> **Stack:** Next.js + NestJS + Prisma + PostgreSQL (Supabase) + Supabase Auth/Storage  
> **Purpose:** Shared context and rules for Claude Code, OpenCode, Codex, and other coding agents.

## 1. Agent Rules

Before doing any task:

1. Read this file first.
2. Inspect the current repository before editing.
3. Do not assume dependencies, services, schema, APIs, or features already exist.
4. Do not claim a feature is complete unless it exists and works.
5. Prefer simple solutions suitable for a 4-person team in 7 days.
6. Explicit mentor/project requirements override implementation suggestions here.
7. Never expose API keys, OAuth secrets, service-role keys, passwords, or real `.env` values.
8. Use migrations for shared database changes.
9. Avoid unrelated refactors.
10. Do not add infrastructure/libraries without a concrete requirement.
11. Keep frontend/backend contracts consistent.
12. At task completion, report files changed, schema/API changes, commands/tests run, and unresolved setup.

### Planning-only tasks

If asked only to design/review/document/plan:

- do not initialize frameworks
- do not install packages
- do not create migrations
- do not connect Supabase
- do not implement application code

unless explicitly requested.

---

## 2. Project Overview

GoalSlot lets users search soccer fields, view availability, book time slots, manage bookings, review fields, and save favorites.

Admins manage bookings, fields, users, images, pricing, field types, and field schedules.

Core flow:

```text
Login/Register
→ Search Field
→ Field Detail
→ Choose Date/Time
→ View Availability
→ Calculate Price
→ Apply Voucher
→ Create PENDING Booking
→ Admin Approve/Reject
→ CONFIRMED/REJECTED
→ Email Notification
```

Highest-priority domain:

```text
availability
+ overlap prevention
+ server-side pricing
+ booking status transitions
```

A reliable end-to-end booking flow is more important than many incomplete optional features.

---

## 3. Tech Stack

### Frontend

- Next.js
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- TanStack Query
- React Hook Form
- Zod
- date-fns
- Lucide React
- Sonner
- `@supabase/supabase-js`
- Axios

State strategy:

```text
Server state     → TanStack Query
Form state       → React Hook Form
Validation       → Zod
Auth/session     → Supabase Auth
Filter state     → URLSearchParams
Local UI state   → React state
```

Do not add Redux/Zustand unless a real need appears.

### No multilingual support

This project is currently single-language.

Do not add:

- next-intl
- i18n routing
- locale middleware
- translation dictionaries

unless the team explicitly changes the requirement.

### Backend

- NestJS
- TypeScript
- Prisma ORM
- PostgreSQL
- class-validator
- class-transformer
- Swagger
- NestJS Guards
- Filters/Interceptors when useful
- @nestjs/schedule

### Authentication

Use **Supabase Auth** for:

- Email/password
- Email confirmation
- Google OAuth
- Facebook OAuth
- Forgot password
- Reset/change password
- Access-token/session lifecycle

Google and Facebook login are **P0**.

NestJS handles:

- authenticated request verification
- application profile lookup
- USER / ADMIN authorization
- ACTIVE / INACTIVE account status
- ownership checks
- booking/review/admin business rules

Do not build a second password system in NestJS.

### Database / Storage / Email

- PostgreSQL hosted on Supabase
- Prisma from NestJS
- Supabase Storage for field images and optional avatars
- Resend preferred for booking emails; Nodemailer acceptable alternative

### Testing / Tooling / Deploy

- Jest + NestJS testing for backend
- Playwright for critical E2E if time allows
- npm
- Git / GitHub
- ESLint / Prettier
- GitHub Actions
- Next.js → Vercel
- NestJS → Render or Railway
- PostgreSQL/Auth/Storage → Supabase

---

## 4. Architecture

Preferred architecture: **modular monolith**.

```text
Browser
   ↓
Next.js
   ├── Supabase Auth
   └── NestJS REST API
          ├── Prisma → PostgreSQL/Supabase
          ├── Supabase Storage
          └── Resend
```

Responsibilities:

```text
Supabase Auth
→ identity
→ login/session/refresh lifecycle

Next.js
→ UI
→ forms
→ auth client integration
→ API consumption

NestJS
→ authorization
→ validation
→ business logic
→ booking/pricing
→ persistence orchestration

PostgreSQL
→ source of truth for domain data
```

Do not use microservices.

---

## 5. Suggested Repository Structure

If the repository is empty and later needs initialization, use **npm workspaces** from the root `package.json`.

```text
kickzone/
├── apps/
│   ├── web/
│   └── api/
├── docs/
│   ├── requirements/
│   ├── database/
│   ├── api/
│   ├── screens/
│   ├── business/
│   ├── architecture/
│   └── design/
├── .github/workflows/
├── AGENTS.md
├── README.md
├── package.json
└── package-lock.json
```

Do not restructure an existing repo merely to match this example.

---

## 6. Roles

### Guest

Can:

- register
- confirm email
- login
- Google login
- Facebook login
- browse fields
- view field detail
- search/filter
- view availability

### User

Can additionally:

- logout
- recover/change password
- update profile
- create booking
- view booking history/detail
- cancel eligible booking
- review eligible field
- favorite/unfavorite
- view favorites

### Admin

Can:

- view/filter bookings
- approve/reject bookings
- manage fields
- manage field types
- manage images
- manage pricing rules
- manage users
- inspect field schedules

Advanced comments/activity timeline are lower priority.

---

## 7. Authentication Rules

Registration requirements:

- email/password
- email confirmation
- password >= 8 characters
- at least 3 of:
  - lowercase
  - uppercase
  - number
  - special character

Use Supabase Auth.

Supabase Auth configuration is authoritative for email confirmation and minimum password length.
Apply the 3-of-4 composition rule consistently in registration and password-reset UI validation.
NestJS does not receive or store user passwords.

OAuth P0:

- Google
- Facebook

Identity mapping:

```text
Supabase Auth User UUID
        ↓
profiles.auth_user_id UNIQUE
```

Never store password/password hash in `profiles`.

Profile provisioning:

- On the first protected API request, NestJS idempotently creates the profile identified by the verified Supabase `sub`, or refreshes only its cached email when it already exists.
- New profiles default to `USER` and `ACTIVE`.
- Provisioning must never overwrite an existing profile's `role` or `status`.
- Normal users may update only `full_name` and `phone`; `avatar_path` is backend-managed if avatar upload is implemented later.
- Bootstrap the first ADMIN through a documented one-time database/admin setup step, never through a public role-update endpoint.

For protected API requests NestJS must:

1. verify Supabase identity using the actual project-supported method
2. resolve `profiles`
3. ensure profile status is ACTIVE
4. enforce roles/ownership

Never trust role or userId supplied by frontend.

Current user profile:

```http
GET   /users/me
PATCH /users/me
```

`PATCH /users/me` accepts only `fullName` and `phone` for MVP.

---

## 8. Field Discovery

### Field list

```http
GET /fields?page=1&limit=12
```

Requirements:

- pagination
- server-side max page size
- public access

### Search/filter

Support:

- keyword
- field type
- min/max price
- date
- start/end time when searching availability
- combined filters
- sorting
- pagination

Example:

```http
GET /fields?search=&fieldType=&date=&startTime=&endTime=&minPrice=&maxPrice=&sort=&page=&limit=
```

Search rules:

- `minPrice` and `maxPrice` filter `base_price_per_hour`.
- `date` uses `YYYY-MM-DD`; search `startTime` and `endTime` use local `HH:mm` in `Asia/Ho_Chi_Minh`.
- Availability filtering applies only when `date`, `startTime`, and `endTime` are all present; reject incomplete combinations.
- When a complete date/time interval is supplied, return only fields available for the entire requested interval.

Avoid N+1 availability calls for field cards.

### Field detail

```http
GET /fields/:id
GET /fields/:id/availability?date=YYYY-MM-DD
GET /fields/:id/reviews?page=&limit=
```

Availability response:

- use business timezone `Asia/Ho_Chi_Minh`
- return 30-minute slots
- each slot contains ISO-offset `startTime`, ISO-offset `endTime`, `available`, and authoritative preview `price`

Can expose:

- name/type/address
- description
- images
- pricing
- rating/reviews
- operating hours
- availability
- latitude/longitude if maps are used

---

## 9. Booking — Core Business Rules

### Statuses

```text
PENDING
CONFIRMED
REJECTED
CANCELLED
COMPLETED
```

Allowed transitions:

| From      | To        | Actor                                             |
| --------- | --------- | ------------------------------------------------- |
| PENDING   | CONFIRMED | Admin                                             |
| PENDING   | REJECTED  | Admin                                             |
| PENDING   | CANCELLED | Booking owner                                     |
| CONFIRMED | COMPLETED | `@nestjs/schedule` backend job                    |

Do not expose arbitrary status updates.

### Overlap

A booking overlaps if:

```text
newStart < existingEnd
AND
newEnd > existingStart
```

Existing `18:00 → 20:00`:

Invalid:

```text
17:00 → 19:00
18:30 → 19:30
19:00 → 21:00
```

Valid:

```text
16:00 → 18:00
20:00 → 21:00
```

Blocking statuses:

```text
PENDING
CONFIRMED
```

`REJECTED` and `CANCELLED` do not block.

### Double-booking protection

Frontend availability is not sufficient.

Required:

1. display availability
2. validate again in backend
3. validate field/time/status
4. calculate price server-side
5. create booking transactionally with concurrency protection

MVP concurrency rule:

1. start one short database transaction
2. lock the selected `fields` row with `SELECT ... FOR UPDATE`
3. recheck active/non-deleted field, operating hours, and overlap
4. calculate authoritative pricing
5. if a voucher is supplied, lock its row after the field row and validate limits
6. create the PENDING booking and optional voucher usage
7. commit before sending email or calling any other network service

Every booking-creation path must follow this lock order. This serializes competing requests for the same field without requiring an MVP exclusion constraint.

A PostgreSQL exclusion constraint may be considered later, but do not overcomplicate MVP without testing it.

### Time storage

Use:

```text
start_time
end_time
```

as real timestamps.

Time rules:

- business timezone is `Asia/Ho_Chi_Minh`
- API timestamps use ISO 8601 with `Z` or an explicit UTC offset; reject offset-free datetimes
- store booking instants as `timestamptz`
- start/end must align to 30-minute boundaries
- booking must start and end on the same local calendar date
- booking cannot start in the past
- booking must fit entirely inside that weekday's operating window
- `day_of_week` uses `0 = Sunday`

Do not store canonical booking time as `"18h-20h"`.

### Pricing

Backend is source of truth.

```text
Requested interval
→ Base price / PriceRule
→ Original price
→ Voucher
→ Discount
→ Final price
```

Store snapshots:

- original_price
- discount_amount
- final_price

Use integer VND.

Price-rule algorithm:

1. split the requested interval into 30-minute segments
2. for each segment, select matching active rules for the local date, weekday, and time
3. highest `priority` wins; break ties by newest `created_at`, then lexicographically ascending `id`
4. fall back to `base_price_per_hour` when no rule matches
5. sum all segment prices to produce `original_price`
6. apply voucher discount afterward

All base prices and rule prices must be divisible by 2 so a 30-minute segment remains integer VND.
For percentage vouchers, round the calculated discount down to integer VND.
Never allow `discount_amount > original_price` or `final_price < 0`.

### Booking APIs

```http
POST  /bookings
GET   /bookings/me?page=&limit=&status=
GET   /bookings/:id
PATCH /bookings/:id/cancel
```

`GET /bookings/:id` is available only to the booking owner or an ADMIN.

Booking request should send mainly:

- fieldId
- startTime
- endTime
- voucherCode optional

Do not trust client-provided:

- userId
- role
- originalPrice
- finalPrice

### Cancellation

User can cancel only `PENDING`.

Backend verifies authentication, ownership, and status, then:

```text
PENDING → CANCELLED
```

Use a conditional status update from `PENDING` so concurrent cancel/approve/reject actions cannot overwrite one another.

Send cancellation email after the transaction commits. Email failure does not roll back the cancellation; log it without secrets.

### Automatic completion

Use `@nestjs/schedule` to run an idempotent job every 5 minutes:

```text
CONFIRMED booking with end_time <= now() → COMPLETED
```

The job must update only rows still in `CONFIRMED` and must not send completion email for MVP.

---

## 10. Reviews

Requirement:

- rating
- content
- only an account that booked the field may review it

Expected:

```http
GET    /fields/:id/reviews
POST   /fields/:id/reviews
PATCH  /reviews/:id
DELETE /reviews/:id
```

Required design:

- Review references the booking proving eligibility
- one review per booking
- booking must be owned by the reviewer, reference the reviewed field, and be COMPLETED

Rating:

```text
1..5
```

---

## 11. Favorites

```http
GET    /favorites?page=&limit=
POST   /fields/:id/favorite
DELETE /fields/:id/favorite
```

Database:

```text
UNIQUE(user_id, field_id)
```

---

## 12. Voucher

Support:

- FIXED discount
- PERCENT discount
- active/inactive
- start/end
- global usage limit
- per-user limit
- minimum booking value
- optional maximum discount

Optional preview:

```http
POST /vouchers/validate
```

Final validation must run again during booking creation.

Voucher rules:

- normalize code with `trim().toUpperCase()`
- PERCENT value must be `1..100`
- FIXED value must be positive
- usage limits must be positive when present
- start/end range must be valid
- PENDING, CONFIRMED, and COMPLETED bookings consume usage capacity
- REJECTED and CANCELLED bookings do not consume usage capacity
- keep voucher usage rows for history; usage-limit queries count only consuming booking statuses
- lock the voucher row inside the booking transaction before counting usage and inserting `voucher_usages`
- validate minimum order value against `original_price`
- cap percentage discount with `max_discount` when present

For MVP, vouchers are created through seed/demo data. Admin voucher CRUD is out of scope unless explicitly required.

---

## 13. Admin Requirements

### Booking management

```http
GET   /admin/bookings?page=&limit=&status=&from=&to=&fieldId=&userId=
GET   /admin/bookings/:id
PATCH /admin/bookings/:id/approve
PATCH /admin/bookings/:id/reject
GET   /admin/bookings/calendar?from=&to=
```

Approve:

```text
PENDING → CONFIRMED
```

Reject:

```text
PENDING → REJECTED
```

Approve/reject must use a conditional update from `PENDING`.

Send email after the transaction commits. Email failure does not reverse the decision; log it without secrets.

### Field CRUD

```http
POST   /admin/fields
PATCH  /admin/fields/:id
DELETE /admin/fields/:id
```

A field cannot be deleted if it has:

- PENDING booking
- future CONFIRMED booking

Required:

- soft delete with `deleted_at`
- set `status = INACTIVE` when soft-deleting
- exclude deleted fields from public queries
- preserve history

`INACTIVE` temporarily disables public booking while remaining normally manageable.
`deleted_at` removes a field from normal lists while preserving historical relations.
`DELETE /admin/fields/:id` never physically deletes a normal field.
Soft deletion must lock the same field row used by booking creation, recheck blocking bookings, and update the field in one transaction.

### Images

```http
POST   /admin/fields/:id/images
DELETE /admin/fields/:fieldId/images/:imageId
```

Use Supabase Storage; validate MIME/size.

### Field types

```http
GET    /field-types
POST   /admin/field-types
PATCH  /admin/field-types/:id
DELETE /admin/field-types/:id
```

Examples: 5-a-side, 7-a-side, 11-a-side.

### Flexible pricing

Use `price_rules`.

```http
GET    /admin/fields/:fieldId/price-rules
POST   /admin/fields/:fieldId/price-rules
PATCH  /admin/fields/:fieldId/price-rules/:ruleId
DELETE /admin/fields/:fieldId/price-rules/:ruleId
```

MVP fields:

- field
- optional weekday
- start/end time
- price/hour
- optional effective date range
- priority
- active

Keep pricing deterministic and simple.

Field create/update DTOs include the field's seven operating-hours entries; do not create a separate operating-hours CRUD module for MVP.

### User management

```http
GET   /admin/users?page=&limit=&search=&status=
GET   /admin/users/:id
PATCH /admin/users/:id/status
```

Statuses:

```text
ACTIVE
INACTIVE
```

Inactive users stay in Supabase Auth but are blocked from GoalSlot protected operations.

### Field schedule

```http
GET /admin/fields/:id/schedule?date=YYYY-MM-DD
```

Reuse the same availability logic as booking.

---

## 14. Priority

### P0

Authentication:

- Email/password
- Email confirmation
- Google OAuth
- Facebook OAuth
- session
- NestJS auth verification
- USER/ADMIN authorization

Fields:

- list/detail
- pagination
- search/filter
- availability

Booking:

- create
- overlap prevention
- server-side pricing
- voucher
- history/detail
- cancel PENDING
- automatic CONFIRMED → COMPLETED transition

User:

- profile basics
- password recovery
- reviews
- favorites

Admin:

- booking management
- approve/reject
- field CRUD
- multiple images
- field types
- pricing rules
- user management
- field schedule

Infrastructure:

- Supabase PostgreSQL
- Supabase Storage
- Swagger
- GitHub Actions
- deployment

### P1

- richer admin dashboard
- richer voucher/pricing UI
- improved emails
- broader automated tests

### P2

- nested review comments
- activity timeline
- audit-log UI
- advanced analytics

---

## 15. Core Database Design

Current proposed core entities:

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

Do not add optional tables before core schema is stable.

### `profiles`

| Field        | Notes             |
| ------------ | ----------------- |
| id           | UUID PK           |
| auth_user_id | UUID UNIQUE       |
| email        | indexed           |
| full_name    | nullable          |
| avatar_path  | nullable          |
| phone        | nullable          |
| role         | USER / ADMIN      |
| status       | ACTIVE / INACTIVE |
| created_at   | timestamptz       |
| updated_at   | timestamptz       |

Rules:

- no password column
- default role USER
- default status ACTIVE
- normal profile update cannot promote role
- provision idempotently from verified Supabase identity on first protected request

### `field_types`

| Field       | Notes       |
| ----------- | ----------- |
| id          | UUID PK     |
| name        | UNIQUE      |
| description | nullable    |
| created_at  | timestamptz |
| updated_at  | timestamptz |

### `fields`

| Field               | Notes              |
| ------------------- | ------------------ |
| id                  | UUID PK            |
| field_type_id       | FK                 |
| name                | required           |
| slug                | UNIQUE             |
| description         | nullable           |
| address             | required           |
| latitude            | nullable           |
| longitude           | nullable           |
| base_price_per_hour | integer VND        |
| status              | ACTIVE / INACTIVE  |
| deleted_at          | nullable           |
| created_at          | timestamptz        |
| updated_at          | timestamptz        |

Indexes:

- field_type_id
- status
- deleted_at
- slug

Validate:

- `base_price_per_hour >= 0`
- `base_price_per_hour` is divisible by 2 for 30-minute billing

### `field_images`

| Field        | Notes         |
| ------------ | ------------- |
| id           | UUID PK       |
| field_id     | FK            |
| storage_path | required      |
| alt_text     | nullable      |
| sort_order   | default 0     |
| is_primary   | default false |
| created_at   | timestamptz   |

### `field_operating_hours`

| Field       | Notes       |
| ----------- | ----------- |
| id          | UUID PK     |
| field_id    | FK          |
| day_of_week | 0..6        |
| open_time   | nullable time |
| close_time  | nullable time |
| is_closed   | default false |
| created_at  | timestamptz |
| updated_at  | timestamptz |

MVP:

```text
UNIQUE(field_id, day_of_week)
```

One normal opening window/day is enough.

Validate:

- `day_of_week` is `0..6`, where `0 = Sunday`
- closed day has null `open_time` and `close_time`
- open day has both times and `open_time < close_time`
- overnight hours are out of scope

### `price_rules`

| Field          | Notes         |
| -------------- | ------------- |
| id             | UUID PK       |
| field_id       | FK            |
| day_of_week    | nullable 0..6 |
| start_time     | time          |
| end_time       | time          |
| price_per_hour | integer VND   |
| effective_from | nullable date |
| effective_to   | nullable date |
| priority       | default 0     |
| is_active      | default true  |
| created_at     | timestamptz   |
| updated_at     | timestamptz   |

Validate:

- start < end
- price >= 0
- price divisible by 2 for 30-minute billing
- effective date range valid
- `effective_from` and `effective_to` are inclusive when present

### `bookings`

| Field               | Notes         |
| ------------------- | ------------- |
| id                  | UUID PK       |
| user_id             | FK → profiles |
| field_id            | FK → fields   |
| voucher_id          | nullable FK   |
| start_time          | timestamptz   |
| end_time            | timestamptz   |
| status              | BookingStatus |
| original_price      | integer VND   |
| discount_amount     | integer VND   |
| final_price         | integer VND   |
| cancellation_reason | nullable      |
| rejection_reason    | nullable      |
| created_at          | timestamptz   |
| updated_at          | timestamptz   |

Useful indexes:

```text
(field_id, start_time)
(field_id, end_time)
(field_id, status)
(user_id, created_at)
status
start_time
```

Validate:

- `start_time < end_time`
- all price snapshots are non-negative
- `discount_amount <= original_price`
- `final_price = original_price - discount_amount`

### `vouchers`

| Field           | Notes                |
| --------------- | -------------------- |
| id              | UUID PK              |
| code            | UNIQUE               |
| discount_type   | PERCENT / FIXED      |
| value           | integer              |
| max_discount    | nullable             |
| min_order_value | nullable             |
| start_at        | nullable timestamptz |
| end_at          | nullable timestamptz |
| usage_limit     | nullable             |
| per_user_limit  | nullable             |
| is_active       | boolean              |
| created_at      | timestamptz          |
| updated_at      | timestamptz          |

Normalize code uppercase.

Validate:

- PERCENT value is `1..100`
- FIXED value is positive
- `max_discount` and `min_order_value` are non-negative when present
- usage limits are positive when present
- start/end range is valid
- `start_at` is inclusive and `end_at` is exclusive when present

### `voucher_usages`

| Field      | Notes       |
| ---------- | ----------- |
| id         | UUID PK     |
| voucher_id | FK          |
| user_id    | FK          |
| booking_id | FK          |
| used_at    | timestamptz |

Recommended:

```text
UNIQUE(booking_id)
```

Keep usage rows for history. Global/per-user limit queries count only rows whose booking is PENDING, CONFIRMED, or COMPLETED.

### `reviews`

| Field      | Notes       |
| ---------- | ----------- |
| id         | UUID PK     |
| user_id    | FK          |
| field_id   | FK          |
| booking_id | FK          |
| rating     | 1..5        |
| content    | required    |
| created_at | timestamptz |
| updated_at | timestamptz |

Recommended:

```text
UNIQUE(booking_id)
```

Backend verifies booking matches user/field and is eligible.

### `favorites`

| Field      | Notes       |
| ---------- | ----------- |
| id         | UUID PK     |
| user_id    | FK          |
| field_id   | FK          |
| created_at | timestamptz |

Required:

```text
UNIQUE(user_id, field_id)
```

---

## 16. Database Enums

```text
UserRole:
- USER
- ADMIN

UserStatus:
- ACTIVE
- INACTIVE

FieldStatus:
- ACTIVE
- INACTIVE

BookingStatus:
- PENDING
- CONFIRMED
- REJECTED
- CANCELLED
- COMPLETED

DiscountType:
- PERCENT
- FIXED
```

---

## 17. Relationships

```text
Supabase Auth User
  └── 1:1 Profile
       ├── 1:N Bookings
       ├── 1:N Reviews
       ├── 1:N Favorites
       └── 1:N VoucherUsages

FieldType
  └── 1:N Fields
       ├── 1:N FieldImages
       ├── 1:N FieldOperatingHours
       ├── 1:N PriceRules
       ├── 1:N Bookings
       ├── 1:N Reviews
       └── 1:N Favorites

Voucher
  ├── 1:N Bookings
  └── 1:N VoucherUsages

Booking
  ├── 0..1 Review
  └── 0..1 VoucherUsage
```

---

## 18. Delete / History Rules

- Do not hard-delete normal bookings.
- Do not delete users to deactivate; use INACTIVE.
- Soft-delete fields by setting `deleted_at` and `status = INACTIVE`.
- Preserve historical bookings.
- Field deletion is blocked by PENDING or future CONFIRMED booking.
- Image deletion should remove DB metadata and storage object when appropriate.
- Use `ON DELETE RESTRICT` for profiles/fields/vouchers referenced by historical bookings or reviews.
- Physical field deletion may cascade only to configuration children such as images, operating hours, and price rules; normal application flow never physically deletes fields.
- Favorites may cascade when a referenced user or physically deleted field is removed.

---

## 19. Naming Convention

Preferred SQL:

```text
tables       → snake_case plural
columns      → snake_case
foreign keys → *_id
timestamps   → created_at / updated_at
```

Preferred TypeScript/Prisma:

```text
models → PascalCase
fields → camelCase
```

Use mappings if needed.

---

## 20. Security Rules

1. Never trust userId from client for ownership.
2. Resolve user from Supabase identity.
3. Never trust client-provided role.
4. Never trust client-provided booking price.
5. ADMIN APIs require server-side ADMIN authorization.
6. User resource operations require ownership checks.
7. Validate DTOs/query params.
8. Never expose Supabase service-role key to browser.
9. Validate file upload MIME/size.
10. Cap pagination.
11. Restrict production CORS.
12. Do not log tokens.
13. Do not commit `.env`.
14. Browser clients must not access domain tables directly; enable deny-by-default RLS/grants for exposed tables.
15. Upload field images through the authenticated NestJS ADMIN API; keep Storage service credentials backend-only.
16. Send email only after the related database transaction commits; failure must not reverse the committed business action.

---

## 21. Environment Variables

Example only.

Frontend:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_API_URL=
```

Backend:

```env
DATABASE_URL=
DIRECT_URL=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
FRONTEND_URL=
RESEND_API_KEY=
EMAIL_FROM=
```

Do not add unused variables.

---

## 22. Database Implementation Rules

When the team later asks to implement the database:

1. inspect repo
2. configure Prisma/PostgreSQL if needed
3. define enums/models
4. add relations
5. add useful indexes/uniques
6. add row-local check constraints and explicit foreign-key delete actions
7. generate migration
8. inspect generated SQL
9. generate Prisma Client
10. prepare safe seed strategy
11. update ERD/docs

Initial core migration:

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

Do not initially add:

```text
review_comments
activity_logs
audit_logs
```

unless explicitly requested.

---

## 23. Team Ownership

**Nguyễn Tuấn Dương B**

- Tech Lead
- database/Prisma
- fields
- availability
- booking
- overlap
- pricing/voucher
- integration/code review

**Nguyễn Minh Quân D**

- Backend Lead
- Supabase Auth/NestJS auth
- users
- reviews/favorites
- admin booking APIs
- email
- Swagger

**Trần Thành Vinh**

- Frontend Lead
- design system
- home
- field list/detail
- search/filter
- auth UI
- booking UI
- responsive

**Nguyễn Nhật Minh C**

- admin frontend
- booking-management UI
- field CRUD UI
- user UI
- booking history/favorites
- QA/docs/demo data

---

## 24. 7-Day Plan

**Day 1:** docs/contracts, repo, DB, Supabase, Next/Nest/Prisma, OAuth provider configuration, deployment skeleton, UI foundation, Swagger, CI.

**Day 2:** email auth, Google/Facebook OAuth, profile provisioning, NestJS auth/roles, field list/detail/search, auth UI.

**Day 3:** operating hours, availability, concurrency-safe booking with base pricing, history, admin approve/reject, FE integration.

Day 3 delivery gate:

```text
Login → Field → Date/time → PENDING → Admin approve → CONFIRMED
```

**Day 4:** automatic completion scheduler, pricing rules, vouchers, cancellation, email, reviews, favorites.

**Day 5:** profile/password recovery, users, images, remaining admin CRUD/schedule, integration, permissions, validation, loading/errors, responsive.

**Day 6:** feature freeze, critical tests, deploy, seed data, docs, production OAuth/email, booking/OAuth edge cases.

**Day 7:** regression, final fixes, demo rehearsal, presentation.

Do not start P1/P2 work until the Day 3 delivery gate works end to end.

---

## 25. Testing Priorities

Booking:

```text
free slot → success
overlap PENDING → reject
overlap CONFIRMED → reject
two concurrent overlapping requests → exactly one succeeds
touch previous end time → success
start >= end → reject
offset-free timestamp → reject
timestamp not aligned to 30 minutes → reject
cross-local-day booking → reject
past start time → reject
outside operating hours → reject
closed day → reject
inactive field/user → reject
```

Cancellation:

```text
owner cancels PENDING → success
owner cancels CONFIRMED → reject
other user cancels → forbidden
```

Admin:

```text
admin approve/reject PENDING → success
normal user approve → forbidden
approve CANCELLED → reject
concurrent approve and cancel → only one transition succeeds
```

Scheduler:

```text
expired CONFIRMED → COMPLETED
future CONFIRMED → unchanged
already COMPLETED → unchanged
repeated scheduler run → idempotent
```

Review:

```text
owned COMPLETED booking → success
CONFIRMED booking not yet completed → reject
no eligible booking → reject
rating outside 1..5 → reject
other user edits review → forbidden
```

Voucher:

```text
valid → applied
expired/inactive → reject
usage limit reached → reject
minimum value not met → reject
max discount respected
REJECTED/CANCELLED usage does not consume limit
two concurrent final voucher uses → exactly one succeeds
```

Pricing:

```text
no matching price rule → base price
overlapping rules → highest priority wins
equal priority → deterministic tie-break
booking crossing price boundaries → sum 30-minute segments
percentage discount → round down to integer VND
```

---

## 26. Database Definition of Done

When database implementation is eventually requested:

- PostgreSQL connection works
- Prisma schema exists
- migration applies successfully
- Prisma Client generates
- relations/enums correct
- indexes/unique constraints exist
- row-local check constraints and foreign-key delete actions exist
- `profiles.auth_user_id` unique
- no password column
- fields support soft delete
- operating hours exist
- price rules exist
- bookings use real timestamps
- price snapshots exist
- availability indexes exist
- voucher usage trackable
- review eligibility enforceable
- favorite uniqueness exists
- seed strategy documented
- ERD/docs updated
- exposed domain tables have deny-by-default RLS/grants
- no secrets committed

---

## 27. Non-Goals

Do not add unless a concrete requirement appears:

- multilingual/i18n
- microservices
- Kafka
- Redis without real need
- Elasticsearch
- Kubernetes
- Event Sourcing
- CQRS everywhere
- excessive abstraction
- unnecessary global client-state libraries

Preferred:

```text
Next.js
+ NestJS modular monolith
+ Prisma
+ PostgreSQL
+ Supabase Auth/Storage
```

---

## 28. Requirement vs Team Decisions

Original requirement includes:

- registration/email activation/password policy
- field list/detail/search/filter
- login/logout/password recovery/profile
- booking/no overlap/availability/pricing/voucher
- booking history/cancel/email
- reviews/favorites
- nested comments/activity timeline
- Google/Facebook login
- admin booking approval/rejection/filter
- field CRUD/flexible pricing/type/images
- field deletion restrictions
- user management
- field schedule

Current team decisions include:

- GoalSlot name
- exact proposed tables/endpoints
- UUID IDs
- integer VND
- soft-delete fields
- operating-hours table
- one review per booking
- COMPLETED review eligibility
- Prisma
- Resend preference
- P0/P1/P2
- no multilingual support
- `@nestjs/schedule` for automatic booking completion

Mentor requirements override team implementation decisions.

---

## 29. Final Instructions for Coding Agents

When implementing:

1. read relevant section
2. inspect existing code
3. reuse current patterns
4. make smallest complete change
5. validate input
6. enforce auth/ownership
7. update tests
8. update Swagger/docs for API changes
9. create migrations for schema changes
10. avoid unrelated refactors

When asked only to **design the database**:

1. review sections 9–19
2. review normalization/relationships/indexes/delete rules
3. create/update `docs/database-design.md`
4. do not initialize Prisma, install packages, or connect DB unless explicitly requested

When asked to **implement the database**:

1. inspect repo
2. follow sections 15–22
3. create models/enums/relations/indexes
4. generate migration
5. inspect SQL
6. prepare seed strategy
7. update ERD/docs
8. validate against section 26

**Main principle:** keep the project coherent, small enough to finish, and centered on a reliable booking flow.
