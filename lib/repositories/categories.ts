import "server-only";

import { unstable_cache } from "next/cache";
import type { Category } from "@/lib/models";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { mapSignedUrls, publicImageUrl } from "./assets";

async function loadCategories(admin = false): Promise<Category[]> {
  const supabase = admin ? await createServerClient() : createPublicClient();
  const { data, error } = await supabase.from("categories")
    .select("id,name,slug,description,image_path,sort_order,is_active")
    .order("sort_order")
    .order("name");
  if (error) throw new Error("Không thể tải danh mục.");

  const rows = data ?? [];
  const paths = admin
    ? rows.flatMap((category) => category.image_path ? [category.image_path] : [])
    : [];
  const { data: signedData } = paths.length
    ? await supabase.storage.from("product-assets").createSignedUrls(paths, 600)
    : { data: [] };
  const signed = mapSignedUrls(paths, signedData);

  return rows.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    imagePath: category.image_path ?? undefined,
    imageUrl: category.image_path
      ? (admin ? signed.get(category.image_path) : publicImageUrl(category.image_path))
      : undefined,
    sortOrder: category.sort_order,
    isActive: category.is_active,
  }));
}

const getCachedCategories = unstable_cache(
  () => loadCategories(false),
  ["public-categories"],
  { tags: ["categories"], revalidate: 3600 },
);

export async function getCategories(admin = false): Promise<Category[]> {
  return admin ? loadCategories(true) : getCachedCategories();
}
