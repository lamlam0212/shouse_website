import { describe,expect,it } from "vitest";
import { slugifyVietnamese } from "./slugify";

describe("slug tiếng Việt",()=>{
  it("loại dấu tiếng Việt và ký tự thừa",()=>{
    expect(slugifyVietnamese("Bộ chống giật CT–04")).toBe("bo-chong-giat-ct-04");
  });
  it("xử lý chữ đ và khoảng trắng",()=>{
    expect(slugifyVietnamese("  Đồ điện gia dụng  ")).toBe("do-dien-gia-dung");
  });
});
