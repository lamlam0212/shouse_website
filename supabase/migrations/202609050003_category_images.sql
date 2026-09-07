-- S HOUSE: bổ sung ảnh đại diện cho danh mục.
-- Chạy file này sau migration 001 và 002.

alter table public.categories
add column if not exists image_path text;

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
    )
    or exists (
      select 1 from public.categories c
      where c.image_path = storage.objects.name and c.is_active = true
    )
    or (select private.is_admin())
  )
);

-- Kết quả cần thấy: category_image_ready = true.
select exists (
  select 1
  from information_schema.columns
  where table_schema = 'public'
    and table_name = 'categories'
    and column_name = 'image_path'
) as category_image_ready;
