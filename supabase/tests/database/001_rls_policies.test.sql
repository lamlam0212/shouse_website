begin;

create extension if not exists pgtap with schema extensions;
set search_path = public, extensions;
select plan(29);

-- Dữ liệu trong file này chỉ tồn tại trong transaction kiểm thử và luôn rollback.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
) values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin-test@s-house.local', crypt('not-used', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'user-test@s-house.local', crypt('not-used', gen_salt('bf')), now(), '{}', '{}', now(), now(), '', '', '', '');

update public.profiles set role = 'admin' where id = '10000000-0000-0000-0000-000000000001';

insert into public.categories (id, name, slug, is_active)
values ('20000000-0000-0000-0000-000000000001', 'Danh mục kiểm thử', 'danh-muc-kiem-thu', true);

insert into public.products (id, category_id, name, code, slug, status, created_by, updated_by)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Sản phẩm đã xuất bản', 'RLS-PUBLISHED', 'rls-published', 'published', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001'),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Sản phẩm nháp', 'RLS-DRAFT', 'rls-draft', 'draft', '10000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001');

insert into public.product_specs (product_id, name, value)
values
  ('30000000-0000-0000-0000-000000000001', 'Thông số công khai', '1'),
  ('30000000-0000-0000-0000-000000000002', 'Thông số nháp', '2');

insert into public.product_images (product_id, storage_path, is_cover)
values
  ('30000000-0000-0000-0000-000000000001', 'products/30000000-0000-0000-0000-000000000001/images/public.webp', true),
  ('30000000-0000-0000-0000-000000000002', 'products/30000000-0000-0000-0000-000000000002/images/draft.webp', true);

insert into storage.objects (bucket_id, name)
values
  ('product-assets', 'products/30000000-0000-0000-0000-000000000001/images/public.webp'),
  ('product-assets', 'products/30000000-0000-0000-0000-000000000002/images/draft.webp');

insert into public.product_versions (product_id, version_number, change_type, snapshot, created_by)
values ('30000000-0000-0000-0000-000000000002', 1, 'update', '{}'::jsonb, '10000000-0000-0000-0000-000000000001');

select is(
  (select relrowsecurity from pg_class where oid = 'public.products'::regclass),
  true,
  'RLS được bật trên bảng products'
);

select is(
  (select public from storage.buckets where id = 'product-assets'),
  false,
  'Bucket product-assets là riêng tư'
);

set local role anon;
set local request.jwt.claim.sub = '';
set local request.jwt.claim.role = 'anon';

select results_eq('select count(*) from public.products', array[1::bigint], 'Khách chỉ thấy một sản phẩm đã xuất bản');
select results_eq($$select count(*) from public.products where id = '30000000-0000-0000-0000-000000000002'$$, array[0::bigint], 'Khách không thấy sản phẩm nháp');
select results_eq('select count(*) from public.product_specs', array[1::bigint], 'Khách chỉ thấy thông số của sản phẩm đã xuất bản');
select results_eq($$select count(*) from public.product_images where product_id = '30000000-0000-0000-0000-000000000002'$$, array[0::bigint], 'Khách không thấy bản ghi ảnh nháp');
select results_eq($$select count(*) from storage.objects where name like '%/public.webp'$$, array[1::bigint], 'Khách đọc được file của sản phẩm đã xuất bản');
select results_eq($$select count(*) from storage.objects where name like '%/draft.webp'$$, array[0::bigint], 'Khách không đọc được file của sản phẩm nháp');
select results_eq('select count(*) from public.product_versions', array[0::bigint], 'Khách không đọc được lịch sử phiên bản');
select results_eq('select count(*) from public.audit_logs', array[0::bigint], 'Khách không đọc được nhật ký quản trị');

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000002';
set local request.jwt.claim.role = 'authenticated';

select throws_ok(
  $$insert into public.products (category_id, name, code, slug, status, created_by) values ('20000000-0000-0000-0000-000000000001', 'Xâm nhập', 'RLS-HACK', 'rls-hack', 'published', '10000000-0000-0000-0000-000000000002')$$,
  '42501',
  'new row violates row-level security policy for table "products"',
  'Người dùng thường không thể tạo sản phẩm'
);
select results_eq(
  $$update public.products set name = 'Bị sửa' where id = '30000000-0000-0000-0000-000000000001' returning id$$,
  $$select null::uuid where false$$,
  'Người dùng thường không thể sửa sản phẩm'
);
select throws_ok(
  $$insert into public.product_versions (product_id, version_number, change_type, snapshot, created_by) values ('30000000-0000-0000-0000-000000000002', 2, 'update', '{}', '10000000-0000-0000-0000-000000000002')$$,
  '42501',
  'new row violates row-level security policy for table "product_versions"',
  'Người dùng thường không thể tạo lịch sử giả'
);
select throws_ok(
  $$select public.admin_attach_product_assets('30000000-0000-0000-0000-000000000002', '[]'::jsonb, null)$$,
  '42501',
  'Administrator access required',
  'Người dùng thường không thể gắn file vào sản phẩm'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '10000000-0000-0000-0000-000000000001';
set local request.jwt.claim.role = 'authenticated';

select results_eq('select count(*) from public.products', array[2::bigint], 'Quản trị viên thấy cả sản phẩm nháp và đã xuất bản');
select lives_ok($$update public.products set name = 'Đã sửa bởi admin' where id = '30000000-0000-0000-0000-000000000002'$$, 'Quản trị viên có thể sửa sản phẩm');
select results_eq('select count(*) from storage.objects', array[2::bigint], 'Quản trị viên đọc được cả file công khai và file nháp');
select results_eq('select count(*) from public.product_versions', array[1::bigint], 'Quản trị viên đọc được lịch sử phiên bản');
select cmp_ok((select count(*) from public.audit_logs), '>=', 3::bigint, 'Trigger tự ghi nhật ký thay đổi');
select lives_ok(
  $$update public.site_settings set hotline = '0902020995', updated_by = '10000000-0000-0000-0000-000000000001' where id = 1$$,
  'Quản trị viên có thể lưu cài đặt website'
);
select results_eq(
  $$select action from public.audit_logs where entity_type = 'site_settings' and entity_id is null order by created_at desc, id desc limit 1$$,
  array['updated'::text],
  'Thay đổi cài đặt được ghi nhật ký mà không ép id smallint sang UUID'
);
select lives_ok(
  $$insert into public.categories (id, name, slug) values ('20000000-0000-0000-0000-000000000099', 'Danh mục tạm', 'danh-muc-tam'); delete from public.categories where id = '20000000-0000-0000-0000-000000000099'$$,
  'Trigger nhật ký xử lý được thao tác xóa'
);
select lives_ok(
  $$select public.admin_save_product('30000000-0000-0000-0000-000000000002','20000000-0000-0000-0000-000000000001','Sản phẩm lưu nguyên tử','RLS-DRAFT','rls-draft','','',null,'draft',false,'[{"name":"Điện áp","value":"220V","unit":""}]'::jsonb)$$,
  'Quản trị viên lưu sản phẩm và thông số bằng transaction'
);
select results_eq(
  $$select value from public.product_specs where product_id = '30000000-0000-0000-0000-000000000002'$$,
  array['220V'::text],
  'Transaction thay thông số đầy đủ'
);
insert into storage.objects (bucket_id, name)
values
  ('product-assets', 'products/30000000-0000-0000-0000-000000000002/images/40000000-0000-0000-0000-000000000001.webp'),
  ('product-assets', 'products/30000000-0000-0000-0000-000000000002/documents/40000000-0000-0000-0000-000000000002.pdf');
select lives_ok(
  $$select public.admin_attach_product_assets(
    '30000000-0000-0000-0000-000000000002',
    '[{"storage_path":"products/30000000-0000-0000-0000-000000000002/images/40000000-0000-0000-0000-000000000001.webp","alt_text":"Ảnh kiểm thử"}]'::jsonb,
    'products/30000000-0000-0000-0000-000000000002/documents/40000000-0000-0000-0000-000000000002.pdf'
  )$$,
  'Quản trị viên gắn ảnh và PDF đã tải lên bằng transaction'
);
select results_eq(
  $$select count(*) from public.product_images where storage_path like '%40000000-0000-0000-0000-000000000001.webp'$$,
  array[1::bigint],
  'Ảnh tải trực tiếp được liên kết đúng với sản phẩm'
);
insert into public.product_versions (product_id, version_number, change_type, snapshot, created_by)
select '30000000-0000-0000-0000-000000000002', number, 'update', '{}'::jsonb, '10000000-0000-0000-0000-000000000001'
from generate_series(3, 35) number;
select results_eq(
  $$select count(*) from public.product_versions where product_id = '30000000-0000-0000-0000-000000000002'$$,
  array[30::bigint],
  'Tự động chỉ giữ 30 phiên bản gần nhất'
);
select lives_ok(
  $$update public.products set status = 'published' where id = '30000000-0000-0000-0000-000000000002'$$,
  'Quản trị viên có thể xuất bản sản phẩm'
);
select results_eq(
  $$select action from public.audit_logs where entity_id = '30000000-0000-0000-0000-000000000002' order by created_at desc, id desc limit 1$$,
  array['published'::text],
  'Nhật ký phân biệt đúng thao tác xuất bản'
);

reset role;
select * from finish();
rollback;
