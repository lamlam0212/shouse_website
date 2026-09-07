# Quy tắc dự án S HOUSE

- Giao diện và nội dung mặc định dùng tiếng Việt, dễ hiểu với người không chuyên.
- Dùng Next.js App Router, TypeScript strict và Tailwind CSS.
- Màu thương hiệu: `#5B963B`; nút chính: `#24632B`; hover: `#1B4D21`; đỏ tiết chế: `#B50913`.
- Không thay đổi tỷ lệ, màu sắc hoặc bóp méo logo S HOUSE.
- Không bịa thông số kỹ thuật, chứng nhận hay cam kết an toàn. Dữ liệu chưa được duyệt phải ghi rõ là mẫu.
- Dữ liệu chính thức phải lưu ở Supabase, không dùng localStorage làm database.
- Kiểm tra quyền quản trị trên server và bằng Supabase RLS; không chỉ ẩn nút ở giao diện.
- File của sản phẩm nháp phải nằm trong bucket riêng tư và chỉ cấp signed URL sau khi kiểm tra quyền.
- Không đưa service-role key hoặc bí mật vào frontend/Git.
- Kiểm tra kiểu dữ liệu, dung lượng, MIME và phần mở rộng của ảnh/PDF tải lên.
- Ưu tiên Server Component; chỉ dùng Client Component cho phần thật sự tương tác.
- Trước khi bàn giao phải chạy `npm run lint` và `npm run build`.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
