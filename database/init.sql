-- KickZone initial PostgreSQL schema for Supabase
-- Target: a new/empty Supabase development project
-- Safe behavior: creates missing objects and never drops application data.
-- Important: CREATE TABLE IF NOT EXISTS does not upgrade an older schema.
-- Future changes must use reviewed migrations, not repeated edits to this file.

begin;

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

do $$
begin
  create type public.user_role as enum ('USER', 'ADMIN');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.user_status as enum ('ACTIVE', 'INACTIVE');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.field_status as enum ('ACTIVE', 'INACTIVE');
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.booking_status as enum (
    'PENDING',
    'CONFIRMED',
    'REJECTED',
    'CANCELLED',
    'COMPLETED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.discount_type as enum ('PERCENT', 'FIXED');
exception
  when duplicate_object then null;
end
$$;

-- ---------------------------------------------------------------------------
-- Core tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid not null,
  email text not null,
  full_name text,
  avatar_path text,
  phone text,
  role public.user_role not null default 'USER',
  status public.user_status not null default 'ACTIVE',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_profiles_auth_user_id unique (auth_user_id),
  constraint ck_profiles_email_not_blank check (btrim(email) <> ''),
  constraint ck_profiles_full_name_not_blank
    check (full_name is null or btrim(full_name) <> ''),
  constraint ck_profiles_phone_not_blank
    check (phone is null or btrim(phone) <> '')
);

create table if not exists public.field_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_field_types_name unique (name),
  constraint ck_field_types_name_not_blank check (btrim(name) <> '')
);

create table if not exists public.fields (
  id uuid primary key default gen_random_uuid(),
  field_type_id uuid not null,
  name text not null,
  slug text not null,
  description text,
  address text not null,
  city text not null,
  district text not null,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  base_price_per_hour integer not null,
  status public.field_status not null default 'ACTIVE',
  deleted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_fields_field_type
    foreign key (field_type_id)
    references public.field_types (id)
    on update restrict
    on delete restrict,
  constraint uq_fields_slug unique (slug),
  constraint ck_fields_name_not_blank check (btrim(name) <> ''),
  constraint ck_fields_slug_format
    check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint ck_fields_address_not_blank check (btrim(address) <> ''),
  constraint ck_fields_city_not_blank check (btrim(city) <> ''),
  constraint ck_fields_district_not_blank check (btrim(district) <> ''),
  constraint ck_fields_latitude
    check (latitude is null or latitude between -90 and 90),
  constraint ck_fields_longitude
    check (longitude is null or longitude between -180 and 180),
  constraint ck_fields_base_price
    check (
      base_price_per_hour >= 0
      and mod(base_price_per_hour, 2) = 0
    )
);

create table if not exists public.field_images (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null,
  storage_path text not null,
  alt_text text,
  sort_order integer not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),

  constraint fk_field_images_field
    foreign key (field_id)
    references public.fields (id)
    on update cascade
    on delete cascade,
  constraint ck_field_images_storage_path_not_blank
    check (btrim(storage_path) <> ''),
  constraint ck_field_images_sort_order check (sort_order >= 0)
);

create table if not exists public.field_operating_hours (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null,
  day_of_week smallint not null,
  open_time time,
  close_time time,
  is_closed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_field_operating_hours_field
    foreign key (field_id)
    references public.fields (id)
    on update cascade
    on delete cascade,
  constraint uq_field_operating_hours_day unique (field_id, day_of_week),
  constraint ck_field_operating_hours_day check (day_of_week between 0 and 6),
  constraint ck_field_operating_hours_window
    check (
      (
        is_closed = true
        and open_time is null
        and close_time is null
      )
      or
      (
        is_closed = false
        and open_time is not null
        and close_time is not null
        and open_time < close_time
      )
    )
);

create table if not exists public.price_rules (
  id uuid primary key default gen_random_uuid(),
  field_id uuid not null,
  name text not null,
  day_of_week smallint,
  start_time time not null,
  end_time time not null,
  price_per_hour integer not null,
  effective_from date,
  effective_to date,
  priority integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_price_rules_field
    foreign key (field_id)
    references public.fields (id)
    on update cascade
    on delete cascade,
  constraint ck_price_rules_name_not_blank check (btrim(name) <> ''),
  constraint ck_price_rules_day
    check (day_of_week is null or day_of_week between 0 and 6),
  constraint ck_price_rules_time_window check (start_time < end_time),
  constraint ck_price_rules_price
    check (price_per_hour >= 0 and mod(price_per_hour, 2) = 0),
  constraint ck_price_rules_effective_range
    check (
      effective_from is null
      or effective_to is null
      or effective_from <= effective_to
    )
);

create table if not exists public.vouchers (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  discount_type public.discount_type not null,
  value integer not null,
  max_discount integer,
  min_order_value integer,
  start_at timestamptz,
  end_at timestamptz,
  usage_limit integer,
  per_user_limit integer,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_vouchers_code unique (code),
  constraint ck_vouchers_code_normalized
    check (code = upper(btrim(code)) and btrim(code) <> ''),
  constraint ck_vouchers_value
    check (
      (discount_type = 'PERCENT' and value between 1 and 100)
      or
      (discount_type = 'FIXED' and value > 0)
    ),
  constraint ck_vouchers_max_discount
    check (max_discount is null or max_discount >= 0),
  constraint ck_vouchers_min_order_value
    check (min_order_value is null or min_order_value >= 0),
  constraint ck_vouchers_usage_limit
    check (usage_limit is null or usage_limit > 0),
  constraint ck_vouchers_per_user_limit
    check (per_user_limit is null or per_user_limit > 0),
  constraint ck_vouchers_active_range
    check (start_at is null or end_at is null or start_at < end_at)
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  code text not null default (
    'KZ-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 12))
  ),
  user_id uuid not null,
  field_id uuid not null,
  voucher_id uuid,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status public.booking_status not null default 'PENDING',
  original_price integer not null,
  discount_amount integer not null default 0,
  final_price integer not null,
  cancellation_reason text,
  rejection_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_bookings_user
    foreign key (user_id)
    references public.profiles (id)
    on update restrict
    on delete restrict,
  constraint fk_bookings_field
    foreign key (field_id)
    references public.fields (id)
    on update restrict
    on delete restrict,
  constraint fk_bookings_voucher
    foreign key (voucher_id)
    references public.vouchers (id)
    on update restrict
    on delete restrict,
  constraint uq_bookings_code unique (code),
  constraint uq_bookings_id_user_field unique (id, user_id, field_id),
  constraint uq_bookings_id_user_voucher unique (id, user_id, voucher_id),
  constraint ck_bookings_code_format check (code ~ '^KZ-[A-Z0-9]{8,}$'),
  constraint ck_bookings_time_order check (start_time < end_time),
  constraint ck_bookings_same_business_day
    check (
      (start_time at time zone 'Asia/Ho_Chi_Minh')::date
      =
      (end_time at time zone 'Asia/Ho_Chi_Minh')::date
    ),
  constraint ck_bookings_start_half_hour
    check (
      extract(minute from start_time at time zone 'UTC') in (0, 30)
      and extract(second from start_time at time zone 'UTC') = 0
    ),
  constraint ck_bookings_end_half_hour
    check (
      extract(minute from end_time at time zone 'UTC') in (0, 30)
      and extract(second from end_time at time zone 'UTC') = 0
    ),
  constraint ck_bookings_price_snapshot
    check (
      original_price >= 0
      and discount_amount >= 0
      and discount_amount <= original_price
      and final_price >= 0
      and final_price = original_price - discount_amount
    ),
  constraint ck_bookings_cancellation_reason
    check (
      cancellation_reason is null
      or btrim(cancellation_reason) <> ''
    ),
  constraint ck_bookings_rejection_reason
    check (rejection_reason is null or btrim(rejection_reason) <> '')
);

create table if not exists public.voucher_usages (
  id uuid primary key default gen_random_uuid(),
  voucher_id uuid not null,
  user_id uuid not null,
  booking_id uuid not null,
  used_at timestamptz not null default now(),

  constraint uq_voucher_usages_booking
    unique (booking_id, user_id, voucher_id),
  constraint fk_voucher_usages_voucher
    foreign key (voucher_id)
    references public.vouchers (id)
    on update restrict
    on delete restrict,
  constraint fk_voucher_usages_user
    foreign key (user_id)
    references public.profiles (id)
    on update restrict
    on delete restrict,
  constraint fk_voucher_usages_booking
    foreign key (booking_id, user_id, voucher_id)
    references public.bookings (id, user_id, voucher_id)
    on update restrict
    on delete restrict
);

create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  field_id uuid not null,
  booking_id uuid not null,
  rating smallint not null,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint uq_reviews_booking
    unique (booking_id, user_id, field_id),
  constraint fk_reviews_user
    foreign key (user_id)
    references public.profiles (id)
    on update restrict
    on delete restrict,
  constraint fk_reviews_field
    foreign key (field_id)
    references public.fields (id)
    on update restrict
    on delete restrict,
  constraint fk_reviews_eligible_booking
    foreign key (booking_id, user_id, field_id)
    references public.bookings (id, user_id, field_id)
    on update restrict
    on delete restrict,
  constraint ck_reviews_rating check (rating between 1 and 5),
  constraint ck_reviews_content_not_blank check (btrim(content) <> '')
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  field_id uuid not null,
  created_at timestamptz not null default now(),

  constraint fk_favorites_user
    foreign key (user_id)
    references public.profiles (id)
    on update cascade
    on delete cascade,
  constraint fk_favorites_field
    foreign key (field_id)
    references public.fields (id)
    on update cascade
    on delete cascade,
  constraint uq_favorites_user_field unique (user_id, field_id)
);

-- ---------------------------------------------------------------------------
-- Indexes used by list, search, availability, booking and admin screens
-- ---------------------------------------------------------------------------

create index if not exists idx_profiles_email
  on public.profiles (email);

create index if not exists idx_profiles_status
  on public.profiles (status);

create index if not exists idx_fields_field_type
  on public.fields (field_type_id);

create index if not exists idx_fields_status_deleted
  on public.fields (status, deleted_at);

create index if not exists idx_fields_district
  on public.fields (district);

create index if not exists idx_fields_base_price
  on public.fields (base_price_per_hour);

create unique index if not exists ux_field_images_one_primary
  on public.field_images (field_id)
  where is_primary = true;

create index if not exists idx_field_images_order
  on public.field_images (field_id, sort_order, created_at);

create index if not exists idx_price_rules_lookup
  on public.price_rules (
    field_id,
    is_active,
    day_of_week,
    effective_from,
    effective_to,
    start_time,
    end_time
  );

create index if not exists idx_vouchers_active_window
  on public.vouchers (is_active, start_at, end_at);

create index if not exists idx_bookings_field_start
  on public.bookings (field_id, start_time);

create index if not exists idx_bookings_field_end
  on public.bookings (field_id, end_time);

create index if not exists idx_bookings_field_status
  on public.bookings (field_id, status);

create index if not exists idx_bookings_user_created
  on public.bookings (user_id, created_at desc);

create index if not exists idx_bookings_status_end
  on public.bookings (status, end_time);

create index if not exists idx_bookings_blocking_interval
  on public.bookings (field_id, start_time, end_time)
  where status in ('PENDING', 'CONFIRMED');

create index if not exists idx_voucher_usages_voucher
  on public.voucher_usages (voucher_id, used_at);

create index if not exists idx_voucher_usages_user
  on public.voucher_usages (voucher_id, user_id, used_at);

create index if not exists idx_reviews_field_created
  on public.reviews (field_id, created_at desc);

create index if not exists idx_reviews_user
  on public.reviews (user_id, created_at desc);

create index if not exists idx_favorites_user_created
  on public.favorites (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at trigger
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function public.set_updated_at()
  from public, anon, authenticated, service_role;

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists trg_field_types_set_updated_at on public.field_types;
create trigger trg_field_types_set_updated_at
before update on public.field_types
for each row execute function public.set_updated_at();

drop trigger if exists trg_fields_set_updated_at on public.fields;
create trigger trg_fields_set_updated_at
before update on public.fields
for each row execute function public.set_updated_at();

drop trigger if exists trg_field_operating_hours_set_updated_at
  on public.field_operating_hours;
create trigger trg_field_operating_hours_set_updated_at
before update on public.field_operating_hours
for each row execute function public.set_updated_at();

drop trigger if exists trg_price_rules_set_updated_at on public.price_rules;
create trigger trg_price_rules_set_updated_at
before update on public.price_rules
for each row execute function public.set_updated_at();

drop trigger if exists trg_vouchers_set_updated_at on public.vouchers;
create trigger trg_vouchers_set_updated_at
before update on public.vouchers
for each row execute function public.set_updated_at();

drop trigger if exists trg_bookings_set_updated_at on public.bookings;
create trigger trg_bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists trg_reviews_set_updated_at on public.reviews;
create trigger trg_reviews_set_updated_at
before update on public.reviews
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Minimal idempotent reference data
-- ---------------------------------------------------------------------------

insert into public.field_types (name, description)
values
  ('5-a-side', 'Sân dành cho đội hình 5 người'),
  ('7-a-side', 'Sân dành cho đội hình 7 người'),
  ('11-a-side', 'Sân dành cho đội hình 11 người')
on conflict (name) do nothing;

-- ---------------------------------------------------------------------------
-- Security: domain tables are server-only for the MVP.
-- Browser clients use Supabase only for Auth, not for domain table CRUD.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.field_types enable row level security;
alter table public.fields enable row level security;
alter table public.field_images enable row level security;
alter table public.field_operating_hours enable row level security;
alter table public.price_rules enable row level security;
alter table public.vouchers enable row level security;
alter table public.bookings enable row level security;
alter table public.voucher_usages enable row level security;
alter table public.reviews enable row level security;
alter table public.favorites enable row level security;

revoke all privileges on table public.profiles
  from anon, authenticated, service_role;
revoke all privileges on table public.field_types
  from anon, authenticated, service_role;
revoke all privileges on table public.fields
  from anon, authenticated, service_role;
revoke all privileges on table public.field_images
  from anon, authenticated, service_role;
revoke all privileges on table public.field_operating_hours
  from anon, authenticated, service_role;
revoke all privileges on table public.price_rules
  from anon, authenticated, service_role;
revoke all privileges on table public.vouchers
  from anon, authenticated, service_role;
revoke all privileges on table public.bookings
  from anon, authenticated, service_role;
revoke all privileges on table public.voucher_usages
  from anon, authenticated, service_role;
revoke all privileges on table public.reviews
  from anon, authenticated, service_role;
revoke all privileges on table public.favorites
  from anon, authenticated, service_role;

alter default privileges for role postgres in schema public
  revoke all on tables from anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke execute on functions from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema public
  revoke all on sequences from anon, authenticated, service_role;

-- If the dedicated Prisma role was created before this script, grant it access.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'prisma') then
    execute 'grant usage, create on schema public to prisma';
    execute 'grant usage on type public.user_role to prisma';
    execute 'grant usage on type public.user_status to prisma';
    execute 'grant usage on type public.field_status to prisma';
    execute 'grant usage on type public.booking_status to prisma';
    execute 'grant usage on type public.discount_type to prisma';
    execute 'grant all privileges on all tables in schema public to prisma';
    execute 'grant execute on function public.set_updated_at() to prisma';
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Database comments visible in Supabase/pgAdmin/DBeaver
-- ---------------------------------------------------------------------------

comment on table public.profiles is
  'KickZone application profile mapped to a verified Supabase Auth user.';
comment on column public.profiles.auth_user_id is
  'Supabase Auth user UUID from the verified JWT sub claim.';
comment on column public.profiles.email is
  'Cached email for search/display; Supabase Auth remains authoritative.';
comment on column public.profiles.role is
  'Application authorization role. Never trust a role sent by the frontend.';

comment on table public.fields is
  'Bookable soccer fields. Normal deletion is soft delete via deleted_at.';
comment on column public.fields.base_price_per_hour is
  'Base integer VND price per hour; even so a 30-minute segment is integral.';
comment on column public.fields.deleted_at is
  'Non-null means hidden from normal lists while historical relations remain.';

comment on table public.field_operating_hours is
  'One operating window per field and weekday; 0 means Sunday.';
comment on table public.price_rules is
  'Optional time/date pricing overrides evaluated per 30-minute segment.';
comment on table public.vouchers is
  'Voucher definitions; usage limits count consuming booking statuses only.';

comment on table public.bookings is
  'Booking source of truth with status and authoritative price snapshots.';
comment on column public.bookings.start_time is
  'Booking instant stored as timestamptz; API must send Z or an explicit offset.';
comment on column public.bookings.original_price is
  'Authoritative server-calculated price before applying a voucher.';
comment on column public.bookings.final_price is
  'Price snapshot after discount: original_price - discount_amount.';

comment on table public.voucher_usages is
  'Voucher history; rows remain after cancellation/rejection for auditability.';
comment on table public.reviews is
  'One review per completed booking; composite FK matches booking owner/field.';
comment on table public.favorites is
  'Unique user-to-field favorites used by the saved-fields screen.';

commit;

-- ---------------------------------------------------------------------------
-- Verification output shown after a successful run in Supabase SQL Editor
-- ---------------------------------------------------------------------------

select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in (
    'profiles',
    'field_types',
    'fields',
    'field_images',
    'field_operating_hours',
    'price_rules',
    'vouchers',
    'bookings',
    'voucher_usages',
    'reviews',
    'favorites'
  )
order by table_name;
