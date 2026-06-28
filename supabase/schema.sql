create extension if not exists "pgcrypto";

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated, service_role;

create table if not exists private.admin_discord_ids (
  discord_id text primary key
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  discord_id text unique,
  display_name text not null default '소행성 탐험가',
  avatar_url text,
  minecraft_uuid text,
  minecraft_account_name text,
  minecraft_name text,
  community_role_verified boolean not null default false,
  cash_balance integer not null default 0 check (cash_balance >= 0),
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists minecraft_uuid text;
alter table public.profiles add column if not exists minecraft_account_name text;
alter table public.profiles add column if not exists minecraft_name text;
alter table public.profiles add column if not exists community_role_verified boolean not null default false;

create table if not exists public.minecraft_links (
  discord_id text primary key,
  discord_name text,
  minecraft_uuid text not null,
  minecraft_account_name text,
  minecraft_name text not null,
  community_role_verified boolean not null default false,
  linked_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content text not null,
  category text not null default 'notice' check (category in ('notice', 'update', 'event')),
  image_url text,
  image_urls text[] not null default '{}',
  published boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.notices add column if not exists image_url text;
alter table public.notices add column if not exists image_urls text[] not null default '{}';

create table if not exists public.guides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text not null,
  content text not null,
  icon text not null default '✨'
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  details text not null,
  product_kind text not null default 'credit' check (product_kind in ('credit', 'goods')),
  price_krw integer not null check (price_krw >= 0),
  discount_percent integer not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  cash_amount integer not null default 0 check (cash_amount >= 0),
  image_url text,
  image_urls text[] not null default '{}',
  minecraft_item_key text,
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists image_urls text[] not null default '{}';
alter table public.products add column if not exists product_kind text not null default 'credit';
alter table public.products add column if not exists discount_percent integer not null default 0;
alter table public.products add column if not exists sort_order integer not null default 0;
alter table public.products alter column minecraft_item_key drop not null;
alter table public.products drop constraint if exists products_product_kind_check;
alter table public.products add constraint products_product_kind_check check (product_kind in ('credit', 'goods'));
alter table public.products drop constraint if exists products_discount_percent_check;
alter table public.products add constraint products_discount_percent_check check (discount_percent >= 0 and discount_percent <= 100);

create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  amount_krw integer not null check (amount_krw >= 0),
  product_kind text not null default 'credit' check (product_kind in ('credit', 'goods')),
  shipping_recipient text,
  shipping_phone text,
  shipping_address text,
  shipping_message text,
  status text not null default 'pending' check (status in ('pending', 'paid', 'fulfilled', 'failed', 'refunded')),
  payment_provider text not null default 'test',
  payment_reference text,
  created_at timestamptz not null default now()
);

create table if not exists public.community_posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null default '탐험대원',
  author_avatar_url text,
  title text not null,
  slug text not null unique,
  content text not null,
  category text not null default 'free' check (category in ('screenshot', 'free', 'tips')),
  image_url text,
  image_urls text[] not null default '{}',
  view_count integer not null default 0 check (view_count >= 0),
  featured boolean not null default false,
  featured_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.community_posts add column if not exists view_count integer not null default 0 check (view_count >= 0);
alter table public.community_posts add column if not exists featured boolean not null default false;
alter table public.community_posts add column if not exists featured_at timestamptz;
alter table public.community_posts add column if not exists image_urls text[] not null default '{}';

create table if not exists public.community_post_views (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

alter table public.purchases add column if not exists product_kind text not null default 'credit';
alter table public.purchases add column if not exists shipping_recipient text;
alter table public.purchases add column if not exists shipping_phone text;
alter table public.purchases add column if not exists shipping_address text;
alter table public.purchases add column if not exists shipping_message text;
alter table public.purchases drop constraint if exists purchases_product_kind_check;
alter table public.purchases add constraint purchases_product_kind_check check (product_kind in ('credit', 'goods'));

create table if not exists public.community_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.community_posts(id) on delete cascade,
  parent_id uuid references public.community_comments(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  author_name text not null,
  author_avatar_url text,
  content text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.community_likes (
  post_id uuid not null references public.community_posts(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create table if not exists public.cash_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  purchase_id uuid references public.purchases(id),
  amount integer not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists notices_published_created_idx on public.notices (published, created_at desc);
create index if not exists products_active_sort_created_idx on public.products (active, sort_order asc, created_at desc);
create index if not exists purchases_user_created_idx on public.purchases (user_id, created_at desc);
create index if not exists profiles_discord_id_idx on public.profiles (discord_id);
create index if not exists community_posts_category_created_idx on public.community_posts (category, created_at desc);
create index if not exists community_posts_author_created_idx on public.community_posts (author_id, created_at desc);
create index if not exists community_posts_featured_idx on public.community_posts (featured desc, featured_at desc, created_at desc);
create index if not exists community_comments_post_created_idx on public.community_comments (post_id, created_at asc);
create index if not exists community_comments_parent_created_idx on public.community_comments (parent_id, created_at asc);
create index if not exists community_likes_post_idx on public.community_likes (post_id);
create index if not exists community_post_views_user_idx on public.community_post_views (user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.minecraft_links enable row level security;
alter table public.notices enable row level security;
alter table public.guides enable row level security;
alter table public.products enable row level security;
alter table public.purchases enable row level security;
alter table public.community_posts enable row level security;
alter table public.community_comments enable row level security;
alter table public.community_likes enable row level security;
alter table public.community_post_views enable row level security;
alter table public.cash_ledger enable row level security;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles
    join private.admin_discord_ids admins on admins.discord_id = profiles.discord_id
    where id = auth.uid()
  );
$$;

revoke all on function private.is_admin() from public;
grant execute on function private.is_admin() to anon, authenticated, service_role;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_discord_id text;
  profile_display_name text;
  profile_avatar_url text;
begin
  profile_discord_id := nullif(
    coalesce(
      new.raw_user_meta_data ->> 'provider_id',
      new.raw_user_meta_data ->> 'sub',
      new.raw_user_meta_data ->> 'discord_id'
    ),
    ''
  );
  profile_display_name := nullif(
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      new.raw_user_meta_data ->> 'preferred_username',
      new.raw_user_meta_data ->> 'user_name'
    ),
    ''
  );
  profile_avatar_url := nullif(
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    ''
  );

  insert into public.profiles (id, discord_id, display_name, avatar_url)
  select new.id, profile_discord_id, coalesce(profile_display_name, '소행성 탐험가'), profile_avatar_url
  where profile_discord_id is null
    or not exists (
      select 1
      from public.profiles
      where discord_id = profile_discord_id
    )
  on conflict (id) do nothing;

  if not found then
    insert into public.profiles (id, display_name, avatar_url)
    values (new.id, coalesce(profile_display_name, '소행성 탐험가'), profile_avatar_url)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles for select
using (id = auth.uid() or private.is_admin());

drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
on public.profiles for insert
with check (id = auth.uid() and role = 'user' and cash_balance = 0);

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles for update
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "minecraft_links_select_own_or_admin" on public.minecraft_links;
create policy "minecraft_links_select_own_or_admin"
on public.minecraft_links for select
to authenticated
using (
  private.is_admin()
  or discord_id = (
    select profiles.discord_id
    from public.profiles
    where profiles.id = (select auth.uid())
  )
);

drop policy if exists "public_read_published_notices" on public.notices;
create policy "public_read_published_notices"
on public.notices for select
using (published = true or private.is_admin());

drop policy if exists "admin_write_notices" on public.notices;
create policy "admin_write_notices"
on public.notices for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "public_read_guides" on public.guides;
create policy "public_read_guides"
on public.guides for select
using (true);

drop policy if exists "admin_write_guides" on public.guides;
create policy "admin_write_guides"
on public.guides for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "public_read_active_products" on public.products;
create policy "public_read_active_products"
on public.products for select
using (active = true or private.is_admin());

drop policy if exists "admin_write_products" on public.products;
create policy "admin_write_products"
on public.products for all
using (private.is_admin())
with check (private.is_admin());

drop policy if exists "purchase_select_own_or_admin" on public.purchases;
create policy "purchase_select_own_or_admin"
on public.purchases for select
using (user_id = auth.uid() or private.is_admin());

drop policy if exists "purchase_insert_own" on public.purchases;
create policy "purchase_insert_own"
on public.purchases for insert
with check (user_id = auth.uid());

drop policy if exists "ledger_select_own_or_admin" on public.cash_ledger;
create policy "ledger_select_own_or_admin"
on public.cash_ledger for select
using (user_id = auth.uid() or private.is_admin());

insert into storage.buckets (id, name, public)
values ('notice-images', 'notice-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public_read_notice_images" on storage.objects;
create policy "public_read_notice_images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'notice-images');

drop policy if exists "admin_manage_notice_images" on storage.objects;
create policy "admin_manage_notice_images"
on storage.objects for all
to authenticated
using (bucket_id = 'notice-images' and private.is_admin())
with check (bucket_id = 'notice-images' and private.is_admin());

drop policy if exists "public_read_community_posts" on public.community_posts;
create policy "public_read_community_posts"
on public.community_posts for select
to anon, authenticated
using (true);

drop policy if exists "authenticated_insert_own_community_posts" on public.community_posts;
create policy "authenticated_insert_own_community_posts"
on public.community_posts for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and (
    parent_id is null
    or exists (
      select 1
      from public.community_comments parent_comment
      where parent_comment.id = parent_id
        and parent_comment.post_id = post_id
        and parent_comment.parent_id is null
    )
  )
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.community_role_verified = true
      and nullif(profiles.minecraft_name, '') is not null
  )
);

drop policy if exists "owner_or_admin_update_community_posts" on public.community_posts;
create policy "owner_or_admin_update_community_posts"
on public.community_posts for update
to authenticated
using (author_id = (select auth.uid()) or private.is_admin())
with check (author_id = (select auth.uid()) or private.is_admin());

drop policy if exists "owner_or_admin_delete_community_posts" on public.community_posts;
create policy "owner_or_admin_delete_community_posts"
on public.community_posts for delete
to authenticated
using (author_id = (select auth.uid()));

drop policy if exists "public_read_community_comments" on public.community_comments;
create policy "public_read_community_comments"
on public.community_comments for select
to anon, authenticated
using (true);

drop policy if exists "authenticated_insert_own_community_comments" on public.community_comments;
create policy "authenticated_insert_own_community_comments"
on public.community_comments for insert
to authenticated
with check (
  author_id = (select auth.uid())
  and exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.community_role_verified = true
      and nullif(profiles.minecraft_name, '') is not null
  )
);

drop policy if exists "owner_delete_community_comments" on public.community_comments;
create policy "owner_delete_community_comments"
on public.community_comments for delete
to authenticated
using (author_id = (select auth.uid()) or private.is_admin());

drop policy if exists "public_read_community_likes" on public.community_likes;
create policy "public_read_community_likes"
on public.community_likes for select
to anon, authenticated
using (true);

drop policy if exists "authenticated_insert_own_community_likes" on public.community_likes;
create policy "authenticated_insert_own_community_likes"
on public.community_likes for insert
to authenticated
with check (user_id = (select auth.uid()));

drop policy if exists "owner_delete_community_likes" on public.community_likes;
create policy "owner_delete_community_likes"
on public.community_likes for delete
to authenticated
using (user_id = (select auth.uid()));

drop policy if exists "public_read_community_post_views" on public.community_post_views;
create policy "public_read_community_post_views"
on public.community_post_views for select
to anon, authenticated
using (true);

drop policy if exists "authenticated_insert_own_community_post_views" on public.community_post_views;
create policy "authenticated_insert_own_community_post_views"
on public.community_post_views for insert
to authenticated
with check (user_id = (select auth.uid()));

insert into storage.buckets (id, name, public)
values ('community-images', 'community-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "public_read_community_images" on storage.objects;
create policy "public_read_community_images"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'community-images');

drop policy if exists "authenticated_upload_community_images" on storage.objects;
create policy "authenticated_upload_community_images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'community-images'
  and (storage.foldername(name))[1] = 'posts'
);

drop policy if exists "admin_manage_community_images" on storage.objects;
create policy "admin_manage_community_images"
on storage.objects for all
to authenticated
using (bucket_id = 'community-images' and private.is_admin())
with check (bucket_id = 'community-images' and private.is_admin());

drop function if exists public.is_admin();
