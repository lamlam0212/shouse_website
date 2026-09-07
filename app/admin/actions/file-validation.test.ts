import { describe, expect, it } from "vitest";
import { storageExtension, validateImage, validatePdf } from "./file-validation";

function createFile(bytes: number[], name: string, type: string) {
  return new File([new Uint8Array(bytes)], name, { type });
}

describe("kiểm tra file tải lên", () => {
  it("chấp nhận ảnh JPEG có đúng chữ ký và phần mở rộng", async () => {
    const file = createFile([0xff, 0xd8, 0xff, 0xe0], "san-pham.jpg", "image/jpeg");
    await expect(validateImage(file)).resolves.toBeNull();
    expect(storageExtension(file)).toBe("jpg");
  });

  it("từ chối ảnh có phần mở rộng không khớp MIME", async () => {
    const file = createFile([0x89, 0x50, 0x4e, 0x47], "san-pham.jpg", "image/png");
    await expect(validateImage(file)).resolves.toContain("không khớp");
  });

  it("từ chối file giả ảnh", async () => {
    const file = createFile([1, 2, 3, 4], "san-pham.webp", "image/webp");
    await expect(validateImage(file)).resolves.toContain("không đúng định dạng");
  });

  it("chấp nhận PDF có đúng chữ ký", async () => {
    const file = createFile([0x25, 0x50, 0x44, 0x46, 0x2d], "tai-lieu.pdf", "application/pdf");
    await expect(validatePdf(file)).resolves.toBeNull();
  });

  it("từ chối file đổi đuôi thành PDF", async () => {
    const file = createFile([1, 2, 3, 4], "tai-lieu.pdf", "application/pdf");
    await expect(validatePdf(file)).resolves.toContain("không hợp lệ");
  });
});
