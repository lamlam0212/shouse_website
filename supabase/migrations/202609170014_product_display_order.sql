-- S HOUSE: thứ tự hiển thị thủ công cho danh sách sản phẩm công khai.
-- Chạy sau migration 001 đến 013.

alter table public.products
  add column if not exists display_order integer;

-- Giữ nguyên cảm giác sắp xếp hiện tại trong lần nâng cấp đầu tiên.
with ranked as (
  select id, row_number() over (order by created_at desc, id) - 1 as position
  from public.products
)
update public.products product
set display_order = ranked.position
from ranked
where product.id = ranked.id
  and product.display_order is null;

alter table public.products
  alter column display_order set default 2147483647,
  alter column display_order set not null;

create index if not exists products_public_display_order_idx
  on public.products (status, display_order, created_at desc);

create or replace function public.admin_reorder_products(p_product_ids uuid[])
returns void
language plpgsql
set search_path = ''
as $$
declare
  published_count integer;
begin
  if not (select private.is_admin()) then
    raise exception 'Administrator access required' using errcode = '42501';
  end if;

  if p_product_ids is null or cardinality(p_product_ids) > 2000 then
    raise exception 'Invalid product order' using errcode = '22023';
  end if;

  if cardinality(p_product_ids) <> (
    select count(distinct requested.product_id)
    from unnest(p_product_ids) as requested(product_id)
  ) then
    raise exception 'Duplicate product id' using errcode = '22023';
  end if;

  select count(*) into published_count
  from public.products
  where status = 'published';

  if cardinality(p_product_ids) <> published_count
    or exists (
      select 1
      from unnest(p_product_ids) as requested(product_id)
      where not exists (
        select 1
        from public.products product
        where product.id = requested.product_id
          and product.status = 'published'
      )
    )
  then
    raise exception 'Product list does not match published products' using errcode = '22023';
  end if;

  update public.products product
  set
    display_order = ordered.position - 1,
    updated_by = auth.uid()
  from unnest(p_product_ids) with ordinality as ordered(product_id, position)
  where product.id = ordered.product_id;
end;
$$;

revoke all on function public.admin_reorder_products(uuid[]) from public, anon;
grant execute on function public.admin_reorder_products(uuid[]) to authenticated;

select
  exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'display_order'
  )
  and to_regprocedure('public.admin_reorder_products(uuid[])') is not null
  as product_display_order_ready;
