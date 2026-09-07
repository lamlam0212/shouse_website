"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import type { Database, Json } from "@/lib/supabase/database.types";
import type { SupabaseClient } from "@supabase/supabase-js";
import { revalidateAdminProducts, revalidateCatalog } from "./cache";

type ProductSnapshot = {
  product?: { pdf_path?: string | null };
  images?: { storage_path?: string | null }[];
};

export async function cleanupProductAssets(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  productId: string,
) {
  const [{ data: product }, { data: images }, { data: versions }, imageFiles, documentFiles] = await Promise.all([
    supabase.from("products").select("pdf_path").eq("id", productId).maybeSingle(),
    supabase.from("product_images").select("storage_path").eq("product_id", productId),
    supabase.from("product_versions").select("snapshot").eq("product_id", productId),
    supabase.storage.from("product-assets").list(`products/${productId}/images`, { limit: 1000 }),
    supabase.storage.from("product-assets").list(`products/${productId}/documents`, { limit: 1000 }),
  ]);
  const referenced = new Set<string>();
  if (product?.pdf_path) referenced.add(product.pdf_path);
  for (const image of images ?? []) referenced.add(image.storage_path);
  for (const version of versions ?? []) {
    const snapshot = version.snapshot as ProductSnapshot;
    if (snapshot.product?.pdf_path) referenced.add(snapshot.product.pdf_path);
    for (const image of snapshot.images ?? []) if (image.storage_path) referenced.add(image.storage_path);
  }
  const stored = [
    ...(imageFiles.data ?? []).map(file => `products/${productId}/images/${file.name}`),
    ...(documentFiles.data ?? []).map(file => `products/${productId}/documents/${file.name}`),
  ];
  const obsolete = stored.filter(path => !referenced.has(path));
  if (obsolete.length) await supabase.storage.from("product-assets").remove(obsolete);
}

type DbClient = SupabaseClient<Database>;
type Snapshot = {
  product: Database["public"]["Tables"]["products"]["Row"];
  specs: Database["public"]["Tables"]["product_specs"]["Row"][];
  images: Database["public"]["Tables"]["product_images"]["Row"][];
};

export async function recordProductSnapshot(
  supabase: DbClient,
  productId: string,
  userId: string,
  changeType: "update" | "status" | "image" | "restore",
) {
  const [{ data: product }, { data: specs }, { data: images }, { data: latest }] = await Promise.all([
    supabase.from("products").select("*").eq("id", productId).single(),
    supabase.from("product_specs").select("*").eq("product_id", productId).order("sort_order"),
    supabase.from("product_images").select("*").eq("product_id", productId).order("sort_order"),
    supabase.from("product_versions").select("version_number").eq("product_id", productId).order("version_number", { ascending: false }).limit(1).maybeSingle(),
  ]);
  if (!product) return;
  const snapshot: Snapshot = { product, specs: specs ?? [], images: images ?? [] };
  const { error } = await supabase.from("product_versions").insert({
    product_id: productId,
    version_number: (latest?.version_number ?? 0) + 1,
    change_type: changeType,
    snapshot: snapshot as unknown as Json,
    created_by: userId,
  });
  if (error) throw new Error("Không thể tạo phiên bản dự phòng cho sản phẩm.");
}

export async function restoreProductVersion(formData: FormData) {
  const versionId = z.string().uuid().parse(formData.get("versionId"));
  const { user, supabase } = await requireAdmin();
  const { data: version } = await supabase.from("product_versions").select("product_id,snapshot,version_number").eq("id", versionId).single();
  if (!version) throw new Error("Không tìm thấy phiên bản cần khôi phục.");
  const snapshot = version.snapshot as unknown as Snapshot;
  if (!snapshot?.product || snapshot.product.id !== version.product_id) throw new Error("Dữ liệu phiên bản không hợp lệ.");

  await recordProductSnapshot(supabase, version.product_id, user.id, "restore");
  const product = snapshot.product;
  const { error: productError } = await supabase.from("products").update({
    category_id: product.category_id,
    name: product.name,
    code: product.code,
    slug: product.slug,
    short_description: product.short_description,
    description: product.description,
    price: product.price,
    status: product.status,
    featured: product.featured,
    pdf_path: product.pdf_path,
    published_at: product.published_at,
    updated_by: user.id,
  }).eq("id", version.product_id);
  if (productError) throw new Error("Không thể khôi phục thông tin sản phẩm.");

  await supabase.from("product_specs").delete().eq("product_id", version.product_id);
  if (snapshot.specs.length) {
    const { error } = await supabase.from("product_specs").insert(
      snapshot.specs.map((spec) => ({ product_id:spec.product_id,name:spec.name,value:spec.value,unit:spec.unit,sort_order:spec.sort_order })),
    );
    if (error) throw new Error("Đã khôi phục sản phẩm nhưng chưa thể khôi phục thông số.");
  }

  await supabase.from("product_images").delete().eq("product_id", version.product_id);
  if (snapshot.images.length) {
    const { error } = await supabase.from("product_images").insert(snapshot.images.map((image) => ({
      id:image.id,product_id:version.product_id,storage_path:image.storage_path,alt_text:image.alt_text,
      sort_order:image.sort_order,is_cover:image.is_cover,created_at:image.created_at,
    })));
    if (error) throw new Error("Đã khôi phục sản phẩm nhưng chưa thể khôi phục bộ ảnh.");
  }

  await supabase.from("audit_logs").insert({
    entity_type: "product",
    entity_id: version.product_id,
    entity_label: product.name,
    action: "restored",
    actor_id: user.id,
    details: { restored_version: version.version_number },
  });
  await cleanupProductAssets(supabase, version.product_id);
  revalidateCatalog();
  revalidateAdminProducts();
  revalidatePath(`/admin/san-pham/${version.product_id}`);
  redirect(`/admin/san-pham/${version.product_id}?restored=${version.version_number}`);
}
