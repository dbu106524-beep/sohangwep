-- 소행성 탐사대 운영용 Supabase/Postgres 기본 스키마 예시
-- Supabase SQL Editor에서 실행하기 전에 프로젝트 요구사항에 맞게 검토하세요.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  discord_id text unique,
  minecraft_uuid text unique,
  role text not null default 'member' check (role in ('member', 'admin')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('notice', 'update', 'event')),
  title text not null,
  summary text,
  content text not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  pinned boolean not null default false,
  tags text[] not null default '{}',
  event_start date,
  event_end date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "public can read published posts"
on public.posts for select
using (status = 'published');

create policy "admins can read all posts"
on public.posts for select
to authenticated
using (public.is_admin());

create policy "admins can insert posts"
on public.posts for insert
to authenticated
with check (public.is_admin());

create policy "admins can update posts"
on public.posts for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete posts"
on public.posts for delete
to authenticated
using (public.is_admin());

create table if not exists public.guide_categories (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  display_order integer not null default 0,
  status text not null default 'published' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guide_categories enable row level security;

create policy "public can read published guide categories"
on public.guide_categories for select
using (status = 'published');

create policy "admins can read all guide categories"
on public.guide_categories for select
to authenticated
using (public.is_admin());

create policy "admins can insert guide categories"
on public.guide_categories for insert
to authenticated
with check (public.is_admin());

create policy "admins can update guide categories"
on public.guide_categories for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete guide categories"
on public.guide_categories for delete
to authenticated
using (public.is_admin());

create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.guide_categories(id) on delete set null,
  title text not null,
  summary text,
  content text not null,
  display_order integer not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.guides enable row level security;

create policy "public can read published guides"
on public.guides for select
using (status = 'published');

create policy "admins can read all guides"
on public.guides for select
to authenticated
using (public.is_admin());

create policy "admins can insert guides"
on public.guides for insert
to authenticated
with check (public.is_admin());

create policy "admins can update guides"
on public.guides for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete guides"
on public.guides for delete
to authenticated
using (public.is_admin());

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  price_text text,
  summary text,
  description text,
  image_url text,
  tags text[] not null default '{}',
  status text not null default 'draft' check (status in ('draft', 'published')),
  featured boolean not null default false,
  stock_text text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.products enable row level security;

create policy "public can read published products"
on public.products for select
using (status = 'published');

create policy "admins can read all products"
on public.products for select
to authenticated
using (public.is_admin());

create policy "admins can insert products"
on public.products for insert
to authenticated
with check (public.is_admin());

create policy "admins can update products"
on public.products for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete products"
on public.products for delete
to authenticated
using (public.is_admin());

create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.site_settings enable row level security;

create policy "public can read site settings"
on public.site_settings for select
using (true);

create policy "admins can insert site settings"
on public.site_settings for insert
to authenticated
with check (public.is_admin());

create policy "admins can update site settings"
on public.site_settings for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "admins can delete site settings"
on public.site_settings for delete
to authenticated
using (public.is_admin());

-- 최초 관리자 지정 예시:
-- 1. 먼저 Discord/Supabase 로그인으로 auth.users에 본인 계정이 생기게 합니다.
-- 2. Supabase 대시보드에서 본인 user id를 확인합니다.
-- 3. 아래 SQL의 UUID를 본인 auth.users.id로 바꿔 실행합니다.
-- insert into public.profiles (id, display_name, role)
-- values ('00000000-0000-0000-0000-000000000000', 'admin', 'admin')
-- on conflict (id) do update set role = 'admin', updated_at = now();
