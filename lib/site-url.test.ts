import { afterEach, describe, expect, it } from "vitest";
import { absoluteSiteUrl, getSiteUrl } from "./site-url";

const original = process.env.NEXT_PUBLIC_SITE_URL;

afterEach(() => {
  if (original === undefined) delete process.env.NEXT_PUBLIC_SITE_URL;
  else process.env.NEXT_PUBLIC_SITE_URL = original;
});

describe("site URL", () => {
  it("chuẩn hóa domain cấu hình và loại bỏ đường dẫn thừa", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "https://shouse.example/duong-dan";
    expect(getSiteUrl().toString()).toBe("https://shouse.example/");
    expect(absoluteSiteUrl("/san-pham")).toBe("https://shouse.example/san-pham");
  });

  it("dùng localhost khi cấu hình không hợp lệ", () => {
    process.env.NEXT_PUBLIC_SITE_URL = "khong-phai-url";
    expect(getSiteUrl().origin).toBe("http://localhost:3000");
  });
});
