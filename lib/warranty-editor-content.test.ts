import { describe, expect, it } from "vitest";
import { parseWarrantyEditorContent, serializeWarrantyEditorContent } from "./warranty-editor-content";
import { splitWarrantyContent } from "./format-about-content";

describe("structured warranty editor", () => {
  it("loads the current Markdown policy into matching form sections", () => {
    const source = "**Sản phẩm**\r\n* Hình thức bảo hành: **Đổi sản phẩm mới, không sửa chữa**.\r\n\r\n**Các trường hợp được bảo hành:**\r\n\r\n1. Aptomat không hoạt động đúng chức năng.\r\n2. Ổ điện hoạt động không ổn định.\r\n\r\n**Các trường hợp không được bảo hành:**\r\n\r\n1. Vỏ bị vỡ.";
    expect(parseWarrantyEditorContent(source)).toEqual({
      intro: "",
      highlights: ["Bảo hành theo tem trên hộp", "**Đổi sản phẩm mới, không sửa chữa**."],
      coveredNote: "",
      coveredItems: ["Aptomat không hoạt động đúng chức năng.", "Ổ điện hoạt động không ổn định."],
      excludedNote: "",
      excludedItems: ["Vỏ bị vỡ."],
    });
  });

  it("generates stable headings and numbering without requiring Markdown from the admin", () => {
    const value = {
      intro: "Thông tin đã được kiểm tra.",
      highlights: ["Theo tem trên hộp", "Liên hệ tư vấn"],
      coveredNote: "Áp dụng cho sản phẩm đủ điều kiện.",
      coveredItems: ["Trường hợp A", "Trường hợp B"],
      excludedNote: "",
      excludedItems: ["Trường hợp C"],
    };
    const saved = serializeWarrantyEditorContent(value);
    const rendered = splitWarrantyContent(saved);
    expect(rendered.overview).toContain("- Theo tem trên hộp\n- Liên hệ tư vấn");
    expect(rendered.groups.map((group) => group.kind)).toEqual(["covered", "excluded"]);
    expect(rendered.groups[0].content).toContain("1. Trường hợp A\n2. Trường hợp B");
    expect(parseWarrantyEditorContent(saved)).toEqual(value);
  });

  it("omits empty groups instead of creating blank panels", () => {
    expect(serializeWarrantyEditorContent({ intro: "", highlights: [], coveredNote: "", coveredItems: [], excludedNote: "", excludedItems: [] })).toBe("");
  });
});
