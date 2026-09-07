# S HOUSE — Website giới thiệu bộ chống giật

> **Trạng thái hiện tại:** Website đã tích hợp Supabase Auth, Database và Storage. Migration phải được chạy lần lượt theo hướng dẫn bên dưới.

## Yêu cầu dự án

Website giới thiệu sản phẩm bộ chống giật S HOUSE, gồm trang công khai và trang quản trị. Chưa có giỏ hàng hoặc thanh toán.

### Trang công khai

- Trang chủ: giới thiệu, danh mục, sản phẩm nổi bật, liên hệ.
- Danh sách sản phẩm: tìm kiếm, lọc danh mục, phân trang.
- Chi tiết sản phẩm: bộ ảnh, mô tả, thông số dạng tên/giá trị, PDF tùy chọn.
- Giá là tùy chọn; khi trống hiển thị “Liên hệ báo giá”.
- Nút gọi điện và Zalo lấy từ cài đặt website.
- SEO cơ bản, sitemap và trang 404.

### Quản trị `/admin`

- Đăng nhập riêng, không đăng ký công khai; chỉ quản trị viên được chỉnh sửa.
- Thêm/sửa sản phẩm; lưu nháp, xuất bản hoặc ẩn.
- Tải nhiều ảnh, sắp xếp ảnh, chọn ảnh đại diện và tải PDF.
- Quản lý danh mục và cài đặt logo, hotline, Zalo, địa chỉ, giới thiệu.

### Dữ liệu và bảo mật khi kết nối Supabase

- Supabase cung cấp PostgreSQL, Auth và Storage; dữ liệu thật không lưu trong localStorage.
- Khách chỉ đọc sản phẩm đã xuất bản qua RLS.
- Quyền quản trị được kiểm tra cả ở server và bằng RLS.
- Ảnh/PDF của bản nháp để trong bucket riêng tư, cấp signed URL sau khi xác thực.
- Khóa service role chỉ tồn tại ở server và không commit vào Git.
- File tải lên phải được kiểm tra MIME, phần mở rộng và dung lượng.

## Công nghệ đã chọn

- Next.js 16.3.3 (App Router, Active LTS)
- React 19
- TypeScript 5.9
- Tailwind CSS 4.3
- Supabase JS + `@supabase/ssr`
- Vitest cho kiểm thử tự động

## Chạy trên máy

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`. Trang quản trị mẫu ở `http://localhost:3000/admin`.

### Kiểm tra chất lượng

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

GitHub Actions cũng tự chạy bốn bước trên khi tạo pull request hoặc đẩy code lên nhánh `main`/`master`.

## Thiết lập Supabase

### 1. Cấu hình môi trường

Sao chép `.env.example` thành `.env.local` và điền:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
NEXT_PUBLIC_SITE_URL=https://ten-mien-cua-ban.vn
```

`.env.local` đã được Git bỏ qua. Không thêm service-role key vào frontend hoặc repository.
Ở môi trường production, `NEXT_PUBLIC_SITE_URL` phải là domain thật, có `https://` và không kèm đường dẫn. Giá trị này được dùng thống nhất cho canonical, sitemap, robots và ảnh chia sẻ mạng xã hội.

### 2. Chạy migration nền tảng

1. Mở Supabase Dashboard của dự án.
2. Chọn **SQL Editor** ở menu bên trái.
3. Chọn **New query**.
4. Mở file `supabase/migrations/202609040001_initial_schema.sql` trong dự án.
5. Sao chép toàn bộ nội dung file vào SQL Editor và chọn **Run**.
6. Kết quả cuối cùng cần có một dòng, trong đó năm cột `products_ready`, `categories_ready`, `images_ready`, `specs_ready`, `private_bucket_ready` đều là `true`.

Migration tạo:

- `profiles` với vai trò mặc định `user`; đăng nhập được không đồng nghĩa là quản trị viên.
- `categories`, `products`, `product_specs`, `product_images`, `site_settings`.
- Trigger tự tạo hồ sơ khi có user mới.
- RLS: khách chỉ đọc sản phẩm `published`; chỉ admin được ghi.
- Bucket private `product-assets`; ảnh/PDF của nháp chỉ admin đọc được. File của sản phẩm xuất bản được cấp URL có thời hạn.

### 3. Tạo quản trị viên đầu tiên

1. Trong Supabase Dashboard, chọn **Authentication → Users**.
2. Chọn **Add user → Create new user**.
3. Nhập email và mật khẩu mạnh, bật xác nhận email nếu Dashboard có tùy chọn này. Không tạo user từ website.
4. Mở file `supabase/manual/promote_first_admin.sql`.
5. Chỉ thay `THAY_EMAIL_QUAN_TRI@EXAMPLE.COM` bằng email vừa tạo, giữ nguyên dấu nháy đơn và toàn bộ SQL còn lại.
6. Tạo **New query** trong SQL Editor, sao chép toàn bộ file đã chỉnh và chọn **Run**.
7. Kết quả cần thấy đúng một dòng với email đã chọn và `role = admin`.

Nếu file cấp quyền báo không tìm thấy tài khoản, kiểm tra lại user trong **Authentication → Users**, sau đó chạy lại file 001 để backfill hồ sơ rồi chạy lại file trong thư mục `manual`. File này không nằm trong migration vì CI và database local không có tài khoản thật của bạn.

### 4. Khởi động lại website

```bash
npm run dev
```

Mở `http://localhost:3000/admin/login` và đăng nhập bằng tài khoản admin vừa tạo. Hãy tạo danh mục trước, sau đó tạo sản phẩm.

### 5. Migration bổ sung ảnh danh mục

Nếu dự án đã chạy migration 001 trước ngày 05/09/2026:

1. Mở `supabase/migrations/202609050003_category_images.sql`.
2. Sao chép toàn bộ nội dung vào **SQL Editor → New query**.
3. Chọn **Run**.
4. Kết quả cần thấy `category_image_ready = true`.

Sau đó trang **Quản trị → Danh mục** sẽ cho phép tải hoặc thay ảnh đại diện. Ảnh được lưu trong bucket private `product-assets`.

### 6. Migration bổ sung ảnh lớn trang chủ

Sau khi hoàn tất migration 003:

1. Mở `supabase/migrations/202609050004_homepage_hero_image.sql`.
2. Sao chép toàn bộ nội dung vào **SQL Editor → New query**.
3. Chọn **Run**.
4. Kết quả cần thấy `homepage_hero_image_ready = true`.

Sau đó vào **Quản trị → Cài đặt → Ảnh lớn trang chủ** để tải, thay hoặc xóa ảnh. Nếu chưa tải ảnh riêng, trang chủ tự dùng ảnh của sản phẩm nổi bật đầu tiên.

### 7. Migration cho khu vực “Về S HOUSE”

Sau khi hoàn tất migration 004:

1. Mở `supabase/migrations/202609050005_about_section.sql`.
2. Sao chép toàn bộ nội dung vào **SQL Editor → New query**.
3. Chọn **Run**.
4. Kết quả cần thấy `about_section_ready = true`.

Sau đó vào **Quản trị → Cài đặt → Khu vực “Về S HOUSE”** để thay ảnh, nhãn nhỏ, tiêu đề, đoạn giới thiệu, ba điểm nổi bật và chữ trên nút. Không cần chạy lại migration 001.

### 8. Migration cho nội dung đầu trang

Sau khi hoàn tất migration 005:

1. Mở `supabase/migrations/202609050006_homepage_hero_content.sql`.
2. Sao chép toàn bộ nội dung vào **SQL Editor → New query**.
3. Chọn **Run**.
4. Kết quả cần thấy `homepage_hero_content_ready = true`.

Sau đó vào **Quản trị → Cài đặt → Khu vực đầu trang** để chỉnh nhãn nhỏ, tiêu đề, phần chữ xanh, đoạn giới thiệu, hai nút, ba lợi ích và nội dung thẻ trên ảnh. Không cần chạy lại các migration cũ.

### 9. Migration tối ưu tìm kiếm sản phẩm

Sau khi hoàn tất migration 006:

1. Mở `supabase/migrations/202609060007_product_search_indexes.sql`.
2. Sao chép toàn bộ nội dung vào **SQL Editor → New query**.
3. Chọn **Run**.
4. Kết quả cần thấy `product_search_indexes_ready = true`.

Migration này không thay đổi dữ liệu sản phẩm. Nó bổ sung chỉ mục để tìm theo tên/mã và lọc danh mục nhanh hơn khi số sản phẩm tăng.

### 10. Migration lịch sử và nhật ký quản trị

Sau khi hoàn tất migration 007:

1. Mở `supabase/migrations/202609070008_admin_workflow.sql`.
2. Sao chép toàn bộ nội dung vào **SQL Editor → New query**.
3. Chọn **Run**.
4. Kết quả cần thấy `admin_workflow_ready = true`.

Migration này tạo lịch sử phiên bản sản phẩm, nhật ký hoạt động và RLS để chỉ quản trị viên được đọc. Sau khi chạy, trang quản trị có xem trước bản nháp, nhân bản, alt riêng, kéo thả ảnh, slug tự động, cảnh báo chưa lưu, trình soạn thảo Markdown, nhập/xuất CSV, khôi phục phiên bản và trang **Nhật ký hoạt động**.

File CSV dùng các cột theo đúng thứ tự: `name`, `code`, `slug`, `category_slug`, `short_description`, `description`, `price`, `status`, `featured`, `specs_json`. Cách đơn giản nhất để có file mẫu đúng cấu trúc là chọn **Xuất CSV**, chỉnh bằng Excel rồi lưu lại dưới định dạng CSV UTF-8.

### 11. Migration giới hạn dữ liệu lưu lâu dài

Sau khi hoàn tất migration 008, chạy `supabase/migrations/202609080009_data_retention.sql`. Migration này:

- Chỉ giữ 30 phiên bản gần nhất cho mỗi sản phẩm.
- Chỉ giữ nhật ký quản trị trong 730 ngày.
- Tự dọn dữ liệu cũ sau khi phát sinh phiên bản hoặc nhật ký mới.

Kết quả cuối cần thấy `data_retention_ready = true`.

### 12. Migration lưu sản phẩm nguyên tử

Tiếp theo chạy `supabase/migrations/202609080010_atomic_product_save.sql`. Migration này đưa việc lưu sản phẩm và toàn bộ thông số kỹ thuật vào cùng một transaction PostgreSQL; nếu một phần thất bại, dữ liệu sẽ không bị lưu dở dang.

Kết quả cuối cần thấy `atomic_product_save_ready = true`.

### 13. Migration upload trực tiếp lên Supabase Storage

Sau migration 010, chạy `supabase/migrations/202609080011_direct_product_uploads.sql`. Migration này tạo transaction dùng để liên kết ảnh/PDF đã tải trực tiếp lên bucket riêng tư với sản phẩm.

Luồng upload không gửi nội dung file qua Next.js Server Action: server chỉ cấp vé upload có thời hạn sau khi xác nhận quyền admin, trình duyệt gửi file thẳng tới Supabase, rồi server kiểm tra lại chữ ký file, MIME, phần mở rộng và dung lượng trước khi liên kết. Vì vậy ảnh 5 MB và PDF 10 MB không phụ thuộc giới hạn request của Netlify.

Kết quả cuối cần thấy `direct_product_uploads_ready = true`.

Nếu dùng Supabase CLI local, chỉ cần chạy `npm run db:migrate`; migration và type TypeScript sẽ được cập nhật theo thứ tự tự động.

## Kiến trúc dành cho phát triển

Xem `docs/ARCHITECTURE.md` để biết vị trí đặt truy vấn, Server Action, type Supabase và quy tắc thêm chức năng mới.

## Cơ chế bảo mật đã triển khai

- Session Auth lưu bằng cookie qua `@supabase/ssr` và được làm mới trong `proxy.ts`.
- Layout quản trị và mọi Server Action đều kiểm tra lại vai trò admin ở server.
- RLS trong PostgreSQL là lớp bảo vệ độc lập; user thường không thể ghi dữ liệu ngay cả khi gọi API trực tiếp.
- Bucket không public. Policy Storage chỉ cho khách đọc file đang được tham chiếu bởi sản phẩm đã xuất bản hoặc logo hiện hành.
- Ảnh được kiểm tra MIME, đuôi file, dung lượng và chữ ký JPG/PNG/WebP; PDF cũng được kiểm tra chữ ký và tối đa 10 MB.
- Website không có trang hoặc action đăng ký công khai.

## Kiểm thử RLS tự động

Bộ test tại `supabase/tests/database/001_rls_policies.test.sql` xác nhận khách chỉ đọc sản phẩm đã xuất bản, file nháp bị chặn, user thường không thể ghi và admin có quyền quản trị.

Để chạy trên máy cá nhân, cài Docker Desktop rồi dùng:

```bash
npm run db:start
npm run db:reset
npm run test:db
```

Các thay đổi trong test luôn được `rollback`, không ghi vào dự án Supabase thật. GitHub Actions tự chạy bộ test này khi các file trong `supabase/` thay đổi.

Lệnh `db:start` bỏ qua Edge Runtime, Vector và Analytics vì website hiện không dùng các dịch vụ này; Auth, Database, Storage, REST và Studio vẫn được khởi động đầy đủ.

`npm run db:reset` tự dựng lại database rồi sinh lại `lib/supabase/database.types.ts`. Nếu chỉ muốn áp dụng migration mới, dùng `npm run db:migrate`; lệnh này cũng tự cập nhật types. GitHub Actions chạy `npm run types:db:check` để chặn migration chưa cập nhật type.

## Theo dõi vận hành

Ở production, lỗi server, lỗi trình duyệt và Core Web Vitals được ghi thành từng dòng JSON trong log của nền tảng triển khai. Endpoint `/api/telemetry` chỉ nhận payload nhỏ thuộc danh sách sự kiện cho phép và không lưu vào database, vì vậy không làm Supabase phình dần. Khi quy mô tăng và cần cảnh báo tập trung, có thể nối luồng log hiện tại với dịch vụ giám sát bên ngoài mà không phải sửa giao diện.

Khi deploy trên Netlify, function `netlify/functions/supabase-health-check.ts` chạy lúc 08:17 mỗi ngày theo giờ Việt Nam. Tác vụ chỉ đọc một truy vấn rất nhỏ từ `site_settings`, không tạo dữ liệu mới. Có thể xem kết quả `supabase_health_check_succeeded` hoặc lỗi `supabase_health_check_failed` trong log Functions của Netlify. Scheduled Function chỉ chạy trên production deploy.
#   s h o u s e _ w e b s i t e  
 