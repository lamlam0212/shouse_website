import "server-only";

import { unstable_cache } from "next/cache";
import type { Product } from "@/lib/models";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { mapSignedUrls, publicImageUrl } from "./assets";

type RawCategory = { id: string; name: string; slug: string; description: string; sort_order: number; is_active: boolean };
type RawImage = { id: string; storage_path: string; alt_text: string; sort_order: number; is_cover: boolean };
type RawSpec = { id: string; name: string; value: string; unit: string; sort_order: number };
type RawProduct = { id: string; name: string; code: string; slug: string; category_id: string; short_description: string; description: string; price: number | string | null; status: Product["status"]; featured: boolean; pdf_path: string | null; display_order: number; created_at: string; categories: RawCategory | null; product_images: RawImage[] | null; product_specs: RawSpec[] | null };

const PRODUCT_SELECT = "id,name,code,slug,category_id,short_description,description,price,status,featured,pdf_path,display_order,created_at,categories(id,name,slug,description,sort_order,is_active),product_images(id,storage_path,alt_text,sort_order,is_cover),product_specs(id,name,value,unit,sort_order)";
const PRODUCT_LIST_SELECT = "id,name,code,slug,category_id,short_description,description,price,status,featured,display_order,created_at,categories(id,name,slug,description,sort_order,is_active),product_images(id,storage_path,alt_text,sort_order,is_cover)";
const ADMIN_PRODUCT_LIST_SELECT = "id,name,code,slug,category_id,short_description,description,price,status,featured,display_order,created_at,categories(id,name,slug,description,sort_order,is_active)";

export type ProductPage = { items: Product[]; page: number; pageSize: number; total: number; totalPages: number };
export type AdminProductStatus = Product["status"] | "all";
export type AdminProductDashboard = { total: number; published: number; draft: number; hidden: number; recent: Product[] };

async function mapProducts(raw: RawProduct[], authenticated = false): Promise<Product[]> {
  const supabase = authenticated ? await createServerClient() : createPublicClient();
  const imagePaths = raw.flatMap((product) => (product.product_images ?? []).map((image) => image.storage_path));
  const pdfPaths = raw.flatMap((product) => product.pdf_path ? [product.pdf_path] : []);
  const paths = authenticated ? [...imagePaths, ...pdfPaths] : pdfPaths;
  const { data } = paths.length
    ? await supabase.storage.from("product-assets").createSignedUrls(paths, 600)
    : { data: [] };
  const signed = mapSignedUrls(paths, data);
  const tones: Product["tone"][] = ["green", "light", "dark", "red"];

  return raw.map((product, index) => ({
    id: product.id,
    name: product.name,
    code: product.code,
    slug: product.slug,
    categoryId: product.category_id,
    category: product.categories?.slug ?? "",
    categoryName: product.categories?.name ?? "Chưa phân loại",
    shortDescription: product.short_description,
    description: product.description,
    price: product.price == null ? undefined : Number(product.price),
    status: product.status,
    featured: product.featured,
    displayOrder: product.display_order,
    tone: tones[index % tones.length],
    createdAt: product.created_at,
    images: (product.product_images ?? [])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((image) => ({
        id: image.id,
        storagePath: image.storage_path,
        url: authenticated ? signed.get(image.storage_path) : publicImageUrl(image.storage_path),
        altText: image.alt_text,
        sortOrder: image.sort_order,
        isCover: image.is_cover,
      })),
    specs: (product.product_specs ?? []).sort((a, b) => a.sort_order - b.sort_order).map((spec) => ({
      id: spec.id,
      name: spec.name,
      value: spec.value,
      unit: spec.unit,
      sortOrder: spec.sort_order,
    })),
    pdfPath: product.pdf_path ?? undefined,
    pdfUrl: product.pdf_path ? signed.get(product.pdf_path) : undefined,
  }));
}

async function loadProducts(admin = false): Promise<Product[]> {
  const supabase = admin ? await createServerClient() : createPublicClient();
  let query = supabase.from("products").select(PRODUCT_LIST_SELECT)
    .eq("product_images.is_cover", true)
    .order("display_order")
    .order("created_at", { ascending: false });
  if (!admin) query = query.eq("status", "published");
  const { data, error } = await query;
  if (error) throw new Error("Không thể tải sản phẩm.");
  return mapProducts((data ?? []) as unknown as RawProduct[], admin);
}

const getCachedProducts = unstable_cache(
  () => loadProducts(false),
  ["public-products"],
  { tags: ["products", "categories"], revalidate: 3600 },
);

export async function getProducts(admin = false): Promise<Product[]> {
  return admin ? loadProducts(true) : getCachedProducts();
}

async function loadPublishedProductsPage(search = "", categoryId: string | undefined, page = 1, pageSize = 6): Promise<ProductPage> {
  const supabase = createPublicClient();
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(24, Math.max(1, Math.floor(pageSize)));
  const from = (safePage - 1) * safePageSize;
  const safeSearch = search.trim().slice(0, 80).replace(/[,()%]/g, " ");
  let query = supabase.from("products").select(PRODUCT_LIST_SELECT, { count: "exact" }).eq("status", "published").eq("product_images.is_cover", true).order("display_order").order("created_at", { ascending: false }).range(from, from + safePageSize - 1);
  if (categoryId) query = query.eq("category_id", categoryId);
  if (safeSearch) query = query.or(`name.ilike.%${safeSearch}%,code.ilike.%${safeSearch}%`);
  const { data, count, error } = await query;
  if (error) throw new Error("Không thể tải danh sách sản phẩm.");
  const total = count ?? 0;
  return { items: await mapProducts((data ?? []) as unknown as RawProduct[]), page: safePage, pageSize: safePageSize, total, totalPages: Math.max(1, Math.ceil(total / safePageSize)) };
}

const getCachedPublishedProductsPage = unstable_cache(
  loadPublishedProductsPage,
  ["published-products-page"],
  { tags: ["products", "categories"], revalidate: 1800 },
);

export async function getPublishedProductsPage({ search = "", categoryId, page = 1, pageSize = 6 }: { search?: string; categoryId?: string; page?: number; pageSize?: number }): Promise<ProductPage> {
  return getCachedPublishedProductsPage(search, categoryId, page, pageSize);
}

async function loadProductBySlug(slug: string): Promise<Product | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT)
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();
  if (error) throw new Error("Không thể tải sản phẩm.");
  return data ? (await mapProducts([data as unknown as RawProduct]))[0] : null;
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return unstable_cache(
    () => loadProductBySlug(slug),
    ["published-product", slug],
    { tags: ["products", `product:${slug}`], revalidate: 3600 },
  )();
}

export async function getAdminProduct(id: string): Promise<Product | null> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("products").select(PRODUCT_SELECT).eq("id", id).maybeSingle();
  if (error) throw new Error("Không thể tải sản phẩm quản trị.");
  return data ? (await mapProducts([data as unknown as RawProduct], true))[0] : null;
}

export async function getAdminProductsPage({ search = "", status = "all", page = 1, pageSize = 20 }: { search?: string; status?: AdminProductStatus; page?: number; pageSize?: number }): Promise<ProductPage> {
  const supabase = await createServerClient();
  const safePage = Math.max(1, Math.floor(page));
  const safePageSize = Math.min(100, Math.max(1, Math.floor(pageSize)));
  const from = (safePage - 1) * safePageSize;
  const safeSearch = search.trim().slice(0, 80).replace(/[,()%]/g, " ");
  let query = supabase.from("products").select(ADMIN_PRODUCT_LIST_SELECT, { count: "exact" }).order("created_at", { ascending: false }).range(from, from + safePageSize - 1);
  if (status !== "all") query = query.eq("status", status);
  if (safeSearch) query = query.or(`name.ilike.%${safeSearch}%,code.ilike.%${safeSearch}%`);
  const { data, count, error } = await query;
  if (error) throw new Error("Không thể tải danh sách sản phẩm quản trị.");
  const total = count ?? 0;
  return { items: await mapProducts((data ?? []) as unknown as RawProduct[], true), page: safePage, pageSize: safePageSize, total, totalPages: Math.max(1, Math.ceil(total / safePageSize)) };
}

export async function getAdminProductOrder(): Promise<Product[]> {
  const supabase = await createServerClient();
  const { data, error } = await supabase.from("products")
    .select(ADMIN_PRODUCT_LIST_SELECT)
    .eq("status", "published")
    .order("display_order")
    .order("created_at", { ascending: false });
  if (error) throw new Error("Không thể tải thứ tự sản phẩm.");
  return mapProducts((data ?? []) as unknown as RawProduct[], true);
}

export async function getAdminProductDashboard(): Promise<AdminProductDashboard> {
  const supabase = await createServerClient();
  const count = (status?: Product["status"]) => {
    let query = supabase.from("products").select("id", { count: "exact", head: true });
    if (status) query = query.eq("status", status);
    return query;
  };
  const [totalResult, publishedResult, draftResult, hiddenResult, recentResult] = await Promise.all([
    count(), count("published"), count("draft"), count("hidden"),
    supabase.from("products").select(ADMIN_PRODUCT_LIST_SELECT).order("created_at", { ascending: false }).limit(5),
  ]);
  if (totalResult.error || publishedResult.error || draftResult.error || hiddenResult.error || recentResult.error) throw new Error("Không thể tải số liệu quản trị.");
  return {
    total: totalResult.count ?? 0,
    published: publishedResult.count ?? 0,
    draft: draftResult.count ?? 0,
    hidden: hiddenResult.count ?? 0,
    recent: await mapProducts((recentResult.data ?? []) as unknown as RawProduct[], true),
  };
}
