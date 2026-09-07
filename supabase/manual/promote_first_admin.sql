-- Chỉ chạy thủ công SAU migration nền tảng và SAU KHI tạo user trong Authentication > Users.
-- Thay địa chỉ giữa hai dấu nháy ở dòng target_email; không commit email thật vào Git.

do $$
declare
  target_email text := 'THAY_EMAIL_QUAN_TRI@EXAMPLE.COM';
  changed_rows integer;
begin
  if target_email = 'THAY_EMAIL_QUAN_TRI@EXAMPLE.COM' then
    raise exception 'Hãy thay email quản trị trong biến target_email trước khi chạy.';
  end if;

  update public.profiles p
  set role = 'admin'
  from auth.users u
  where p.id = u.id and lower(u.email) = lower(target_email);

  get diagnostics changed_rows = row_count;
  if changed_rows <> 1 then
    raise exception 'Không tìm thấy đúng một tài khoản. Hãy kiểm tra user đã được tạo trong Authentication > Users.';
  end if;
end $$;

select u.email, p.role
from public.profiles p
join auth.users u on u.id = p.id
where p.role = 'admin';
