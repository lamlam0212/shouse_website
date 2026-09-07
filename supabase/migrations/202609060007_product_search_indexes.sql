-- S HOUSE: chỉ mục phục vụ tìm kiếm và phân trang khi số sản phẩm tăng.
-- Chạy file này sau migration 001 đến 006.

create extension if not exists pg_trgm;

create index if not exists products_name_search_idx
  on public.products using gin (name gin_trgm_ops);

create index if not exists products_code_search_idx
  on public.products using gin (code gin_trgm_ops);

create index if not exists products_public_category_listing_idx
  on public.products (category_id, status, created_at desc);

-- Kết quả cần thấy: product_search_indexes_ready = true.
select count(*) = 3 as product_search_indexes_ready
from pg_indexes
where schemaname = 'public'
  and indexname in (
    'products_name_search_idx',
    'products_code_search_idx',
    'products_public_category_listing_idx'
  );
