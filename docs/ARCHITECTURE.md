# Kiến trúc S HOUSE

## Luồng dữ liệu

```text
Trang công khai → repositories → Supabase client ẩn danh → RLS
Trang quản trị → Server Actions → requireAdmin → Supabase Auth + RLS
Ảnh công khai → /media/... → signed URL sau khi Storage RLS cho phép
```

## Hiệu năng và vận hành lâu dài

- Truy vấn công khai được cache theo nhóm `products`, `categories` và `site-settings`; Server Action xóa đúng nhóm cache sau khi cập nhật.
- Danh sách sản phẩm công khai và quản trị đều phân trang phía server.
- Dashboard dùng truy vấn đếm thay vì tải toàn bộ sản phẩm.
- Mỗi sản phẩm giữ tối đa 30 phiên bản; nhật ký quản trị giữ trong 730 ngày để dữ liệu không tăng vô hạn.
- File ảnh và PDF không còn được sản phẩm hiện tại hoặc các phiên bản đang giữ tham chiếu sẽ được dọn sau thao tác quản trị.
- Lỗi server, lỗi trình duyệt và Core Web Vitals được ghi dưới dạng JSON trong log của nền tảng triển khai.
- `NEXT_PUBLIC_SITE_URL` là nguồn duy nhất cho canonical, sitemap, robots và metadata chia sẻ.
- Thao tác lưu sản phẩm và thông số kỹ thuật chạy trong một transaction PostgreSQL để tránh dữ liệu dở dang.
- Ảnh và PDF sản phẩm dùng signed upload ticket để trình duyệt tải thẳng lên bucket riêng tư; server kiểm tra lại file rồi liên kết bằng transaction `admin_attach_product_assets`.

## Vị trí mã nguồn

- `app/`: route, trang và Server Component của Next.js.
- `components/`: thành phần giao diện dùng lại.
- `app/admin/actions/`: thao tác ghi dữ liệu, chia theo sản phẩm, danh mục và cài đặt.
- `lib/repositories/`: thao tác đọc dữ liệu theo từng miền chức năng.
- `lib/supabase/database.types.ts`: kiểu database dùng chung cho TypeScript.
- `supabase/migrations/`: lịch sử thay đổi database và RLS; không đặt thao tác theo tài khoản cụ thể tại đây.
- `supabase/manual/`: SQL chỉ chạy thủ công, ví dụ cấp quyền quản trị đầu tiên.
- `supabase/tests/`: các kiểm tra bảo mật database sẽ được bổ sung tại đây.
- `scripts/sync-supabase-types.mjs`: sinh và kiểm tra type tự động sau migration.
- `product_versions`: ảnh chụp dữ liệu trước khi sản phẩm thay đổi để có thể khôi phục.
- `audit_logs`: nhật ký bất biến về người thực hiện và loại thao tác quản trị.

## Quy tắc mở rộng

1. Thay đổi database bằng migration mới, không sửa migration cũ đã chạy trên production.
2. Dùng `npm run db:migrate` hoặc `npm run db:reset`; types được cập nhật tự động và CI kiểm tra độ lệch.
3. Mọi thao tác ghi phải đi qua Server Action và gọi `requireAdmin()`.
4. RLS vẫn phải chặn được truy cập trái phép nếu người dùng gọi Supabase trực tiếp.
5. Không đặt truy vấn Supabase trực tiếp trong component; thêm vào repository tương ứng.
6. Thêm test cho validation hoặc luồng quan trọng trước khi mở rộng chức năng.

## Hướng mở rộng sau này

- Vai trò mới: tạo bảng quyền riêng thay vì thêm nhiều điều kiện rải rác.
- Bán hàng: tách `product_variants`, `inventory`, `orders`, `order_items`; không nhồi vào `products`.
- Nội dung nhiều trang: tạo `pages` và `content_sections` thay vì tiếp tục tăng cột trong `site_settings`.
- Ảnh dung lượng lớn: tạo thumbnail/WebP bằng tác vụ nền hoặc dịch vụ xử lý ảnh.
