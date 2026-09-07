-- S HOUSE: schema, RLS, Storage và dữ liệu cấu hình ban đầu.
-- Chạy toàn bộ file này một lần trong Supabase SQL Editor.

create extension if not exists pgcrypto;
create schema if not exists private;

do $$ begin
  create type public.product_status as enum ('draft', 'published', 'hidden');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.app_role as enum ('user', 'admin');
exception when duplicate_object then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role public.app_role not null default 'user',
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 2 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text not null default '',
  image_path text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null check (char_length(name) between 2 and 180),
  code text not null unique check (char_length(code) between 1 and 60),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  short_description text not null default '' check (char_length(short_description) <= 500),
  description text not null default '',
  price numeric(14,2) check (price is null or price >= 0),
  status public.product_status not null default 'draft',
  featured boolean not null default false,
  pdf_path text,
  created_by uuid references auth.users(id) on delete set null,
  updated_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.product_specs (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  value text not null check (char_length(value) between 1 and 300),
  unit text not null default '' check (char_length(unit) <= 40),
  sort_order integer not null default 0 check (sort_order >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  storage_path text not null unique,
  alt_text text not null default '' check (char_length(alt_text) <= 250),
  sort_order integer not null default 0 check (sort_order >= 0),
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create unique index if not exists product_images_one_cover
  on public.product_images(product_id) where is_cover;
create index if not exists products_public_listing
  on public.products(status, featured, created_at desc);
create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists product_specs_product_id_idx on public.product_specs(product_id, sort_order);
create index if not exists product_images_product_id_idx on public.product_images(product_id, sort_order);

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  logo_path text,
  hero_image_path text,
  hero_kicker text not null default 'Giải pháp thiết bị điện hiện đại',
  hero_title text not null default 'An tâm hơn cho',
  hero_highlight text not null default 'mỗi mái nhà.',
  hero_description text not null default 'S HOUSE giới thiệu các giải pháp bộ chống giật với thông tin trực quan, dễ tìm hiểu và đội ngũ sẵn sàng tư vấn.',
  hero_primary_label text not null default 'Khám phá sản phẩm',
  hero_secondary_label text not null default 'Liên hệ tư vấn',
  hero_card_title text not null default 'S HOUSE',
  hero_card_description text not null default 'Giải pháp thiết bị điện cho không gian hiện đại',
  hero_trust_items jsonb not null default '["Thông tin rõ ràng","Hỗ trợ trực tiếp","Tài liệu dễ tra cứu"]'::jsonb,
  about_image_path text,
  hotline text not null default '',
  zalo text not null default '',
  address text not null default '',
  email text not null default '',
  about text not null default '',
  about_kicker text not null default 'Về S HOUSE',
  about_title text not null default 'Thông tin vừa đủ để bạn dễ dàng lựa chọn',
  about_features jsonb not null default '[{"title":"Sản phẩm trình bày trực quan","description":"Ảnh lớn, thông số dạng bảng và tài liệu tải về khi có."},{"title":"Tư vấn thuận tiện","description":"Hotline và Zalo hiển thị thuận tiện trên mọi thiết bị."},{"title":"Nội dung có kiểm soát","description":"Thông tin được quản lý tập trung bởi S HOUSE."}]'::jsonb,
  about_cta_label text not null default 'Tìm hiểu sản phẩm',
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (id) values (1) on conflict (id) do nothing;

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function private.set_updated_at();
drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function private.set_updated_at();
drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function private.set_updated_at();
drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, role, display_name)
  values (new.id, 'user', coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

revoke all on function private.set_updated_at() from public;
revoke all on function private.handle_new_user() from public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

insert into public.profiles (id, role, display_name)
select id, 'user', coalesce(raw_user_meta_data ->> 'display_name', split_part(email, '@', 1))
from auth.users
on conflict (id) do nothing;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.profiles
    where id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to anon, authenticated;
grant execute on function private.is_admin() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_specs enable row level security;
alter table public.product_images enable row level security;
alter table public.site_settings enable row level security;

revoke all on table public.profiles from anon, authenticated;
revoke all on table public.categories from anon, authenticated;
revoke all on table public.products from anon, authenticated;
revoke all on table public.product_specs from anon, authenticated;
revoke all on table public.product_images from anon, authenticated;
revoke all on table public.site_settings from anon, authenticated;

grant select on table public.profiles to authenticated;
grant select on table public.categories, public.products, public.product_specs, public.product_images, public.site_settings to anon, authenticated;
grant insert, update, delete on table public.categories, public.products, public.product_specs, public.product_images to authenticated;
grant insert, update on table public.site_settings to authenticated;

drop policy if exists "profiles read own or admin" on public.profiles;
create policy "profiles read own or admin" on public.profiles for select to authenticated
using (id = (select auth.uid()) or (select private.is_admin()));

drop policy if exists "categories public read" on public.categories;
create policy "categories public read" on public.categories for select to anon, authenticated
using (is_active or (select private.is_admin()));
drop policy if exists "categories admin insert" on public.categories;
create policy "categories admin insert" on public.categories for insert to authenticated
with check ((select private.is_admin()));
drop policy if exists "categories admin update" on public.categories;
create policy "categories admin update" on public.categories for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "categories admin delete" on public.categories;
create policy "categories admin delete" on public.categories for delete to authenticated
using ((select private.is_admin()));

drop policy if exists "products public read published" on public.products;
create policy "products public read published" on public.products for select to anon, authenticated
using (status = 'published' or (select private.is_admin()));
drop policy if exists "products admin insert" on public.products;
create policy "products admin insert" on public.products for insert to authenticated
with check ((select private.is_admin()) and created_by = (select auth.uid()));
drop policy if exists "products admin update" on public.products;
create policy "products admin update" on public.products for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "products admin delete" on public.products;
create policy "products admin delete" on public.products for delete to authenticated
using ((select private.is_admin()));

drop policy if exists "specs public read published product" on public.product_specs;
create policy "specs public read published product" on public.product_specs for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published') or (select private.is_admin()));
drop policy if exists "specs admin insert" on public.product_specs;
create policy "specs admin insert" on public.product_specs for insert to authenticated with check ((select private.is_admin()));
drop policy if exists "specs admin update" on public.product_specs;
create policy "specs admin update" on public.product_specs for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "specs admin delete" on public.product_specs;
create policy "specs admin delete" on public.product_specs for delete to authenticated using ((select private.is_admin()));

drop policy if exists "images public read published product" on public.product_images;
create policy "images public read published product" on public.product_images for select to anon, authenticated
using (exists (select 1 from public.products p where p.id = product_id and p.status = 'published') or (select private.is_admin()));
drop policy if exists "images admin insert" on public.product_images;
create policy "images admin insert" on public.product_images for insert to authenticated with check ((select private.is_admin()));
drop policy if exists "images admin update" on public.product_images;
create policy "images admin update" on public.product_images for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
drop policy if exists "images admin delete" on public.product_images;
create policy "images admin delete" on public.product_images for delete to authenticated using ((select private.is_admin()));

drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read" on public.site_settings for select to anon, authenticated using (true);
drop policy if exists "settings admin insert" on public.site_settings;
create policy "settings admin insert" on public.site_settings for insert to authenticated with check ((select private.is_admin()) and id = 1);
drop policy if exists "settings admin update" on public.site_settings;
create policy "settings admin update" on public.site_settings for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()) and id = 1);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'product-assets',
  'product-assets',
  false,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "published assets can be read" on storage.objects;
create policy "published assets can be read" on storage.objects for select to anon, authenticated
using (
  bucket_id = 'product-assets' and (
    exists (
      select 1 from public.product_images pi
      join public.products p on p.id = pi.product_id
      where pi.storage_path = storage.objects.name and p.status = 'published'
    )
    or exists (
      select 1 from public.products p
      where p.pdf_path = storage.objects.name and p.status = 'published'
    )
    or exists (
      select 1 from public.site_settings s
      where s.logo_path = storage.objects.name
         or s.hero_image_path = storage.objects.name
         or s.about_image_path = storage.objects.name
    )
    or exists (
      select 1 from public.categories c
      where c.image_path = storage.objects.name and c.is_active = true
    )
    or (select private.is_admin())
  )
);

drop policy if exists "admins upload assets" on storage.objects;
create policy "admins upload assets" on storage.objects for insert to authenticated
with check (bucket_id = 'product-assets' and (select private.is_admin()));
drop policy if exists "admins update assets" on storage.objects;
create policy "admins update assets" on storage.objects for update to authenticated
using (bucket_id = 'product-assets' and (select private.is_admin()))
with check (bucket_id = 'product-assets' and (select private.is_admin()));
drop policy if exists "admins delete assets" on storage.objects;
create policy "admins delete assets" on storage.objects for delete to authenticated
using (bucket_id = 'product-assets' and (select private.is_admin()));

-- Kết quả kiểm tra ở cuối SQL Editor: tất cả giá trị phải là true.
select
  to_regclass('public.products') is not null as products_ready,
  to_regclass('public.categories') is not null as categories_ready,
  to_regclass('public.product_images') is not null as images_ready,
  to_regclass('public.product_specs') is not null as specs_ready,
  exists (select 1 from storage.buckets where id = 'product-assets' and public = false) as private_bucket_ready;
