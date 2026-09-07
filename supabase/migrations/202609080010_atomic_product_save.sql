-- S HOUSE: lưu sản phẩm, thông số và phiên bản trong cùng một transaction.
-- Chạy sau migration 001 đến 009.

create or replace function public.admin_save_product(
  p_product_id uuid,
  p_category_id uuid,
  p_name text,
  p_code text,
  p_slug text,
  p_short_description text,
  p_description text,
  p_price numeric,
  p_status text,
  p_featured boolean,
  p_specs jsonb
)
returns uuid
language plpgsql
set search_path = ''
as $$
declare
  target_id uuid;
  current_product public.products%rowtype;
  next_version integer;
begin
  if not (select private.is_admin()) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;
  if p_status not in ('draft', 'published', 'hidden') then
    raise exception 'Invalid product status' using errcode = '22023';
  end if;
  if jsonb_typeof(coalesce(p_specs, '[]'::jsonb)) <> 'array' or jsonb_array_length(coalesce(p_specs, '[]'::jsonb)) > 60 then
    raise exception 'Invalid product specifications' using errcode = '22023';
  end if;

  if p_product_id is null then
    insert into public.products (
      category_id, name, code, slug, short_description, description, price,
      status, featured, created_by, updated_by, published_at
    ) values (
      p_category_id, p_name, p_code, p_slug, p_short_description, p_description, p_price,
      p_status::public.product_status, p_featured, auth.uid(), auth.uid(),
      case when p_status = 'published' then now() else null end
    ) returning id into target_id;
  else
    select * into current_product from public.products where id = p_product_id for update;
    if not found then raise exception 'Product not found' using errcode = 'P0002'; end if;

    select coalesce(max(version_number), 0) + 1 into next_version
    from public.product_versions where product_id = p_product_id;
    insert into public.product_versions (product_id, version_number, change_type, snapshot, created_by)
    values (
      p_product_id,
      next_version,
      'update',
      jsonb_build_object(
        'product', to_jsonb(current_product),
        'specs', coalesce((select jsonb_agg(to_jsonb(spec) order by spec.sort_order) from public.product_specs spec where spec.product_id = p_product_id), '[]'::jsonb),
        'images', coalesce((select jsonb_agg(to_jsonb(image) order by image.sort_order) from public.product_images image where image.product_id = p_product_id), '[]'::jsonb)
      ),
      auth.uid()
    );

    update public.products set
      category_id = p_category_id,
      name = p_name,
      code = p_code,
      slug = p_slug,
      short_description = p_short_description,
      description = p_description,
      price = p_price,
      status = p_status::public.product_status,
      featured = p_featured,
      updated_by = auth.uid(),
      published_at = case when p_status = 'published' then coalesce(published_at, now()) else null end
    where id = p_product_id;
    target_id := p_product_id;
  end if;

  delete from public.product_specs where product_id = target_id;
  insert into public.product_specs (product_id, name, value, unit, sort_order)
  select
    target_id,
    left(trim(item.value->>'name'), 120),
    left(trim(item.value->>'value'), 300),
    left(trim(coalesce(item.value->>'unit', '')), 40),
    item.ordinality - 1
  from jsonb_array_elements(coalesce(p_specs, '[]'::jsonb)) with ordinality as item(value, ordinality);

  return target_id;
end;
$$;

revoke all on function public.admin_save_product(uuid,uuid,text,text,text,text,text,numeric,text,boolean,jsonb) from public, anon;
grant execute on function public.admin_save_product(uuid,uuid,text,text,text,text,text,numeric,text,boolean,jsonb) to authenticated;

select to_regprocedure('public.admin_save_product(uuid,uuid,text,text,text,text,text,numeric,text,boolean,jsonb)') is not null
  as atomic_product_save_ready;
