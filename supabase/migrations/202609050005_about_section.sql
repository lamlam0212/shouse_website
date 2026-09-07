-- S HOUSE: cho phép quản trị nội dung và ảnh khu vực "Về S HOUSE".
-- Chạy file này sau migration 001, 002, 003 và 004.

alter table public.site_settings
add column if not exists about_image_path text,
add column if not exists about_kicker text not null default 'Về S HOUSE',
add column if not exists about_title text not null default 'Thông tin vừa đủ để bạn dễ dàng lựa chọn',
add column if not exists about_features jsonb not null default '[{"title":"Sản phẩm trình bày trực quan","description":"Ảnh lớn, thông số dạng bảng và tài liệu tải về khi có."},{"title":"Tư vấn thuận tiện","description":"Hotline và Zalo hiển thị thuận tiện trên mọi thiết bị."},{"title":"Nội dung có kiểm soát","description":"Thông tin được quản lý tập trung bởi S HOUSE."}]'::jsonb,
add column if not exists about_cta_label text not null default 'Tìm hiểu sản phẩm';

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
         or s.about_image_path = storage.objects.name
    )
    or exists (
      select 1 from public.categories c
      where c.image_path = storage.objects.name and c.is_active = true
    )
    or (select private.is_admin())
  )
);

-- Kết quả cần thấy: about_section_ready = true.
select count(*) = 5 as about_section_ready
from information_schema.columns
where table_schema = 'public'
  and table_name = 'site_settings'
  and column_name in (
    'about_image_path',
    'about_kicker',
    'about_title',
    'about_features',
    'about_cta_label'
  );
