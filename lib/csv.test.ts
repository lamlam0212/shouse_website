import { describe,expect,it } from "vitest";
import { parseCsv,stringifyCsv } from "./csv";

describe("CSV sản phẩm",()=>{
  it("giữ nguyên dấu phẩy, xuống dòng và dấu ngoặc kép",()=>{
    const rows=[["name","description"],["Bộ chống giật","Dòng 1, có dấu phẩy\nDòng 2 \"an toàn\""]];
    expect(parseCsv(stringifyCsv(rows))).toEqual(rows);
  });
  it("thêm ký tự bảo vệ công thức bảng tính",()=>{
    expect(stringifyCsv([["=SUM(1,2)"]])).toContain("'=SUM");
  });
  it("báo lỗi khi dấu ngoặc kép chưa đóng",()=>{
    expect(()=>parseCsv('name\n"chưa đóng')).toThrow();
  });
});
