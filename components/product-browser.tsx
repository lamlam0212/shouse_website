"use client";

import { Search, SlidersHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { type FormEvent, useState } from "react";
import type { Category } from "@/lib/models";
import type { ProductPage } from "@/lib/queries";
import { ProductCard } from "./product-card";

export function ProductBrowser({ result, categories, initialCategory = "all", initialSearch = "" }: { result: ProductPage; categories: Category[]; initialCategory?: string; initialSearch?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState(initialSearch);
  const [category, setCategory] = useState(initialCategory);
  const navigate = (nextPage = 1, nextCategory = category, nextQuery = query) => {
    const params = new URLSearchParams();
    if (nextQuery.trim()) params.set("q", nextQuery.trim());
    if (nextCategory !== "all") params.set("danh-muc", nextCategory);
    if (nextPage > 1) params.set("trang", String(nextPage));
    const search = params.toString();
    router.push(search ? `/san-pham?${search}` : "/san-pham");
  };
  const submitSearch = (event: FormEvent<HTMLFormElement>) => { event.preventDefault(); navigate(1); };

  return <>
    <form className="product-toolbar" onSubmit={submitSearch}>
      <label className="search-box"><Search size={19}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm theo tên hoặc mã sản phẩm..." maxLength={80}/><span>{result.total} kết quả</span></label>
      <label className="select-box"><SlidersHorizontal size={18}/><select value={category} onChange={(event) => { const value = event.target.value; setCategory(value); navigate(1, value); }}><option value="all">Tất cả danh mục</option>{categories.map((item) => <option value={item.slug} key={item.id}>{item.name}</option>)}</select></label>
      <button className="sr-only" type="submit">Tìm kiếm</button>
    </form>
    {result.items.length ? <div className="product-grid catalog-grid">{result.items.map((product) => <ProductCard key={product.id} product={product}/>)}</div> : <div className="empty-state"><Search/><h3>Không tìm thấy sản phẩm</h3><p>Hãy thử từ khóa khác hoặc chọn tất cả danh mục.</p></div>}
    {result.totalPages > 1 && <div className="pagination" aria-label="Phân trang">{Array.from({ length: result.totalPages }, (_, index) => index + 1).map((number) => <button className={result.page === number ? "active" : ""} key={number} onClick={() => navigate(number)}>{number}</button>)}</div>}
  </>;
}
