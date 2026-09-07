import type { Metadata } from "next";
import { ArrowDown, Boxes, CircuitBoard, FolderTree } from "lucide-react";
import { ProductBrowser } from "@/components/product-browser";
import { getCategories, getPublishedProductsPage } from "@/lib/queries";

export const metadata: Metadata = { title: "Sản phẩm", description: "Khám phá danh mục sản phẩm S HOUSE." };
type SearchParams = { "danh-muc"?: string; q?: string; trang?: string };

export default async function ProductsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const params = await searchParams;
  const categories = await getCategories();
  const selectedCategory = categories.find((category) => category.slug === params["danh-muc"]);
  const requestedPage = Number.parseInt(params.trang || "1", 10);
  const result = await getPublishedProductsPage({ search: params.q, categoryId: selectedCategory?.id, page: Number.isFinite(requestedPage) ? requestedPage : 1 });
  return <>
    <section className="page-hero"><div className="container catalog-hero-grid"><div className="catalog-hero-copy"><span className="section-kicker">Danh mục S HOUSE</span><h1>Khám phá <span>sản phẩm</span></h1><p>Tìm kiếm và khám phá các nhóm sản phẩm phù hợp với nhu cầu của bạn.</p><div className="catalog-hero-meta"><div><strong>{result.total}</strong><span>Sản phẩm</span></div><div><strong>{categories.length}</strong><span>Danh mục</span></div><a href="#danh-sach-san-pham">Xem danh sách <ArrowDown/></a></div></div><div className="catalog-hero-visual" aria-hidden="true"><span className="catalog-orbit"/><div className="catalog-device"><CircuitBoard/><span>S HOUSE</span><strong>Thiết bị điện</strong></div><div className="catalog-chip catalog-chip-products"><Boxes/><span><strong>{result.total}</strong> sản phẩm</span></div><div className="catalog-chip catalog-chip-categories"><FolderTree/><span><strong>{categories.length}</strong> danh mục</span></div></div></div></section>
    <section className="section" id="danh-sach-san-pham"><div className="container"><ProductBrowser result={result} categories={categories} initialCategory={selectedCategory?.slug || "all"} initialSearch={params.q || ""}/></div></section>
  </>;
}
