-- S HOUSE: giới hạn dữ liệu lịch sử để database không tăng vô hạn.
-- Chạy sau migration 001 đến 008.

create or replace function private.prune_product_versions()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.product_versions
  where id in (
    select id
    from public.product_versions
    where product_id = new.product_id
    order by version_number desc
    offset 30
  );
  return null;
end;
$$;

drop trigger if exists product_versions_prune_after_insert on public.product_versions;
create trigger product_versions_prune_after_insert
after insert on public.product_versions
for each row execute function private.prune_product_versions();

create or replace function private.prune_audit_logs()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  delete from public.audit_logs
  where created_at < now() - interval '730 days';
  return null;
end;
$$;

drop trigger if exists audit_logs_prune_after_insert on public.audit_logs;
create trigger audit_logs_prune_after_insert
after insert on public.audit_logs
for each statement execute function private.prune_audit_logs();

revoke all on function private.prune_product_versions() from public;
revoke all on function private.prune_audit_logs() from public;

-- Dọn ngay dữ liệu cũ nếu dự án đã hoạt động trước khi có migration này.
delete from public.product_versions version
where version.id in (
  select id from (
    select id, row_number() over (partition by product_id order by version_number desc) as position
    from public.product_versions
  ) ranked
  where ranked.position > 30
);

delete from public.audit_logs
where created_at < now() - interval '730 days';

select
  to_regprocedure('private.prune_product_versions()') is not null
  and to_regprocedure('private.prune_audit_logs()') is not null
  as data_retention_ready;
