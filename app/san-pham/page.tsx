import type { Metadata } from "next";
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
    <section className="section product-list-section" id="danh-sach-san-pham"><div className="container"><ProductBrowser result={result} categories={categories} initialCategory={selectedCategory?.slug || "all"} initialSearch={params.q || ""}/></div></section>
  </>;
}
