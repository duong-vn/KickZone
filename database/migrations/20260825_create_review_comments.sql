-- Migration: Create review_comments table for nested review replies
-- Created: 2026-08-25

create table if not exists public.review_comments (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null,
  user_id uuid not null,
  parent_id uuid,
  content text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint fk_review_comments_review
    foreign key (review_id)
    references public.reviews (id)
    on delete cascade
    on update restrict,

  constraint fk_review_comments_user
    foreign key (user_id)
    references public.profiles (id)
    on delete restrict
    on update restrict,

  constraint fk_review_comments_parent
    foreign key (parent_id)
    references public.review_comments (id)
    on delete cascade
    on update restrict,

  constraint ck_review_comments_content_not_blank
    check (btrim(content) <> '')
);

-- Indexes for fast tree lookup and author queries
create index if not exists idx_review_comments_review
  on public.review_comments (review_id, created_at asc);

create index if not exists idx_review_comments_parent
  on public.review_comments (parent_id);

create index if not exists idx_review_comments_user
  on public.review_comments (user_id);

-- Auto-update updated_at timestamp trigger
drop trigger if exists trg_review_comments_set_updated_at on public.review_comments;
create trigger trg_review_comments_set_updated_at
before update on public.review_comments
for each row
execute function public.set_updated_at();

-- Enable Row Level Security
alter table public.review_comments enable row level security;

-- Grant permissions to application roles
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'prisma') then
    execute 'grant all privileges on table public.review_comments to prisma';
  end if;
  if exists (select 1 from pg_roles where rolname = 'kickzone_app') then
    execute 'grant all privileges on table public.review_comments to kickzone_app';
  end if;
end
$$;
