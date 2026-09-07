-- S HOUSE: bổ sung ảnh đại diện lớn cho trang chủ.
-- Chạy file này sau migration 001, 002 và 003.

alter table public.site_settings
add column if not exists hero_image_path text;

drop policy if exists "published assets can be read" on storage.objects;
create policy "published assets can be read" on storage.objects
for select to anon, authenticated
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
    )
    or exists (
      select 1 from public.categories c
      where c.image_path = storage.objects.name and c.is_active = true
    )
    or (select private.is_admin())
  )
);

-- Kết quả cần thấy: homepage_hero_image_ready = true.
select exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'site_settings'
    and column_name = 'hero_image_path'
) as homepage_hero_image_ready;
