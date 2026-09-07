-- S HOUSE: gắn file đã tải trực tiếp lên Storage với sản phẩm trong một transaction.
-- Chạy sau migration 001 đến 010.

create or replace function public.admin_attach_product_assets(
  p_product_id uuid,
  p_images jsonb,
  p_pdf_path text
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  existing_image_count integer;
begin
  if not (select private.is_admin()) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if jsonb_typeof(coalesce(p_images, '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(p_images, '[]'::jsonb)) > 8 then
    raise exception 'Invalid product images' using errcode = '22023';
  end if;

  perform 1 from public.products where id = p_product_id for update;
  if not found then
    raise exception 'Product not found' using errcode = 'P0002';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) image
    where coalesce(image->>'storage_path', '') !~ (
      '^products/' || p_product_id::text ||
      '/images/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|png|webp)$'
    )
      or length(coalesce(image->>'alt_text', '')) > 250
  ) then
    raise exception 'Invalid product image path' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(coalesce(p_images, '[]'::jsonb)) image
    where not exists (
      select 1 from storage.objects object
      where object.bucket_id = 'product-assets'
        and object.name = image->>'storage_path'
    )
  ) then
    raise exception 'Uploaded product image not found' using errcode = '22023';
  end if;

  if p_pdf_path is not null and (
    p_pdf_path !~ (
      '^products/' || p_product_id::text ||
      '/documents/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.]pdf$'
    )
    or not exists (
      select 1 from storage.objects object
      where object.bucket_id = 'product-assets' and object.name = p_pdf_path
    )
  ) then
    raise exception 'Invalid product PDF path' using errcode = '22023';
  end if;

  select count(*) into existing_image_count
  from public.product_images where product_id = p_product_id;

  insert into public.product_images (
    product_id, storage_path, alt_text, sort_order, is_cover
  )
  select
    p_product_id,
    image.value->>'storage_path',
    left(trim(coalesce(image.value->>'alt_text', '')), 250),
    existing_image_count + image.ordinality - 1,
    existing_image_count = 0 and image.ordinality = 1
  from jsonb_array_elements(coalesce(p_images, '[]'::jsonb))
    with ordinality as image(value, ordinality);

  update public.products
  set
    pdf_path = case when p_pdf_path is not null then p_pdf_path else pdf_path end,
    updated_by = auth.uid()
  where id = p_product_id;

  return p_product_id;
end;
$$;

revoke all on function public.admin_attach_product_assets(uuid,jsonb,text) from public, anon;
grant execute on function public.admin_attach_product_assets(uuid,jsonb,text) to authenticated;

select to_regprocedure('public.admin_attach_product_assets(uuid,jsonb,text)') is not null
  as direct_product_uploads_ready;
