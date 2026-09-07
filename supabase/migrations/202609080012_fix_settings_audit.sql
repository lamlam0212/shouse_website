-- S HOUSE: sửa trigger nhật ký để cài đặt website (id smallint) có thể được lưu.
-- Chạy sau migration 001 đến 011.

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
    if tg_table_name = 'products'
      and to_jsonb(old)->>'status' is distinct from to_jsonb(new)->>'status'
    then
      if to_jsonb(new)->>'status' = 'published' then event_action := 'published';
      elsif to_jsonb(new)->>'status' = 'hidden' then event_action := 'hidden';
      end if;
    end if;
  end if;

  -- Sản phẩm và danh mục dùng UUID. Cài đặt website là một bản ghi duy nhất
  -- có id smallint = 1, vì vậy không thể ép id này sang audit_logs.entity_id UUID.
  if tg_table_name = 'site_settings' then
    record_id := null;
  else
    record_id := nullif(
      coalesce(to_jsonb(new)->>'id', to_jsonb(old)->>'id'),
      ''
    )::uuid;
  end if;

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

select to_regprocedure('private.audit_admin_change()') is not null
  as settings_audit_fix_ready;
