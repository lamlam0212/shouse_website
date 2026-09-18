import { describe, expect, it } from "vitest";
import { formatAboutContent, splitWarrantyContent } from "./format-about-content";

describe("warranty content layout", () => {
  it("separates legacy policy text without changing its wording", () => {
    const source = "- Bảo hành theo tem trên hộp - Đổi sản phẩm mới - Các trường hợp được bảo hành: 1. Thiết bị không hoạt động. 2. Ổ cắm không ổn định. - Các trường hợp không được bảo hành: 1. Vỏ bị vỡ.";
    const result = splitWarrantyContent(source);

    expect(result.overview).toContain("Bảo hành theo tem trên hộp");
    expect(result.overview).toContain("Đổi sản phẩm mới");
    expect(result.groups).toEqual([
      { kind: "covered", title: "Các trường hợp được bảo hành", content: "1. Thiết bị không hoạt động.\n2. Ổ cắm không ổn định." },
      { kind: "excluded", title: "Các trường hợp không được bảo hành", content: "1. Vỏ bị vỡ." },
    ]);
  });

  it("keeps custom Markdown and unrelated headings in their original section", () => {
    const source = "## Giới thiệu\nNội dung mở đầu.\n### Các trường hợp được bảo hành\n- Mục một\n### Lưu ý\nNội dung thêm.\n### Các trường hợp không được bảo hành\n- Mục hai";
    const result = splitWarrantyContent(source);

    expect(result.overview).toBe("## Giới thiệu\nNội dung mở đầu.");
    expect(result.groups[0].content).toContain("### Lưu ý\nNội dung thêm.");
    expect(result.groups[1].content).toBe("- Mục hai");
  });

  it("falls back to the full text when no warranty headings exist", () => {
    const source = "Nội dung chưa chia mục.\nDòng tiếp theo.";
    expect(splitWarrantyContent(source)).toEqual({ overview: source, groups: [] });
    expect(formatAboutContent(source)).toBe(source);
  });

  it("recognizes bold, colon-terminated headings and CRLF from the published policy", () => {
    const source = "* Sản phẩm được bảo hành lên đến **2 năm**.\r\n* Hình thức bảo hành: **Đổi sản phẩm mới**.\r\n\r\n**Các trường hợp được bảo hành:**\r\n\r\n1. Aptomat không hoạt động.\r\n2. Ổ điện không ổn định.\r\n\r\n**Các trường hợp không được bảo hành:**\r\n\r\n1. Vỏ bị vỡ.";
    const result = splitWarrantyContent(source);

    expect(result.overview).toBe("* Sản phẩm được bảo hành lên đến **2 năm**.\n* Hình thức bảo hành: **Đổi sản phẩm mới**.");
    expect(result.groups).toHaveLength(2);
    expect(result.groups[0]).toEqual({ kind: "covered", title: "Các trường hợp được bảo hành", content: "1. Aptomat không hoạt động.\n2. Ổ điện không ổn định." });
    expect(result.groups[1]).toEqual({ kind: "excluded", title: "Các trường hợp không được bảo hành", content: "1. Vỏ bị vỡ." });
  });
});
