import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RichDescription } from "./rich-description";

describe("RichDescription", () => {
  it("tách nội dung cũ thành ưu đãi, danh sách và liên kết dễ đọc", () => {
    const html = renderToStaticMarkup(
      <RichDescription
        content={
          "**Nâng tầm không gian bếp** với thiết bị hiện đại. 🎁 Đặc quyền: ▪ 2 năm bảo hành ▪ Miễn phí lắp đặt 👉 Khám phá ngay: https://www.example.com/san-pham"
        }
      />,
    );

    expect(html).toContain("<strong>Nâng tầm không gian bếp</strong>");
    expect(html).toContain('class="description-highlight"');
    expect(html).toContain("<ul>");
    expect(html).toContain("<li>2 năm bảo hành</li>");
    expect(html).toContain('class="description-cta"');
    expect(html).toContain('class="raw-link"');
    expect(html).toContain("Xem tại example.com");
  });

  it("giữ hỗ trợ tiêu đề và danh sách Markdown", () => {
    const html = renderToStaticMarkup(
      <RichDescription content={"## Điểm nổi bật\n1. Thiết kế hiện đại\n2. Dễ sử dụng"} />,
    );

    expect(html).toContain("<h2>Điểm nổi bật</h2>");
    expect(html).toContain("<ol>");
    expect(html).toContain("<li>Thiết kế hiện đại</li>");
  });
});
