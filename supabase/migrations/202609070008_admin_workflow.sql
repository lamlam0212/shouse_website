-- S HOUSE: lịch sử phiên bản và nhật ký hoạt động quản trị.
-- Chạy sau migration 001 đến 007.

create table if not exists public.product_versions (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  version_number integer not null check (version_number > 0),
  change_type text not null check (change_type in ('update', 'status', 'image', 'restore')),
  snapshot jsonb not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (product_id, version_number)
);

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  entity_type text not null check (entity_type in ('product', 'category', 'site_settings')),
  entity_id uuid,
  entity_label text not null default '',
  action text not null check (action in ('created', 'updated', 'published', 'hidden', 'deleted', 'restored', 'duplicated')),
  actor_id uuid references auth.users(id) on delete set null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists product_versions_product_created_idx
  on public.product_versions (product_id, created_at desc);
create index if not exists audit_logs_created_idx
  on public.audit_logs (created_at desc);
create index if not exists audit_logs_entity_idx
  on public.audit_logs (entity_type, entity_id, created_at desc);

alter table public.product_versions enable row level security;
alter table public.audit_logs enable row level security;

drop policy if exists "admins read product versions" on public.product_versions;
create policy "admins read product versions" on public.product_versions
for select to authenticated using ((select private.is_admin()));

drop policy if exists "admins create product versions" on public.product_versions;
create policy "admins create product versions" on public.product_versions
for insert to authenticated with check (
  (select private.is_admin()) and created_by = (select auth.uid())
);

drop policy if exists "admins read audit logs" on public.audit_logs;
create policy "admins read audit logs" on public.audit_logs
for select to authenticated using ((select private.is_admin()));

drop policy if exists "admins create audit logs" on public.audit_logs;
create policy "admins create audit logs" on public.audit_logs
for insert to authenticated with check (
  (select private.is_admin()) and actor_id = (select auth.uid())
);

create or replace function private.audit_admin_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  event_action text;
  record_id uuid;
  record_label text;
  actor uuid;
  payload jsonb;
begin
  if tg_op = 'INSERT' then
    event_action := 'created';
    payload := jsonb_build_object('new', to_jsonb(new));
  elsif tg_op = 'DELETE' then
    event_action := 'deleted';
    payload := jsonb_build_object('old', to_jsonb(old));
  else
    event_action := 'updated';
    payload := jsonb_build_object('old', to_jsonb(old), 'new', to_jsonb(new));
    if tg_table_name = 'products' and old.status is distinct from new.status then
      if new.status = 'published' then event_action := 'published';
      elsif new.status = 'hidden' then event_action := 'hidden';
      end if;
    end if;
  end if;

  record_id := coalesce(new.id, old.id);
  record_label := coalesce(
    to_jsonb(new)->>'name',
    to_jsonb(old)->>'name',
    'Cài đặt website'
  );
  actor := coalesce(
    auth.uid(),
    nullif(coalesce(to_jsonb(new)->>'updated_by', to_jsonb(old)->>'updated_by'), '')::uuid,
    nullif(coalesce(to_jsonb(new)->>'created_by', to_jsonb(old)->>'created_by'), '')::uuid
  );

  insert into public.audit_logs (entity_type, entity_id, entity_label, action, actor_id, details)
  values (
    case tg_table_name when 'products' then 'product' when 'categories' then 'category' else 'site_settings' end,
    record_id,
    record_label,
    event_action,
    actor,
    payload
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists products_audit_change on public.products;
create trigger products_audit_change
after insert or update or delete on public.products
for each row execute function private.audit_admin_change();

drop trigger if exists categories_audit_change on public.categories;
create trigger categories_audit_change
after insert or update or delete on public.categories
for each row execute function private.audit_admin_change();

drop trigger if exists settings_audit_change on public.site_settings;
create trigger settings_audit_change
after insert or update or delete on public.site_settings
for each row execute function private.audit_admin_change();

-- Kết quả cần thấy: admin_workflow_ready = true.
select
  to_regclass('public.product_versions') is not null
  and to_regclass('public.audit_logs') is not null
  as admin_workflow_ready;
