"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { revalidateAdminProducts, revalidateCatalog } from "./cache";
import { cleanupProductAssets, recordProductSnapshot } from "./product-history";
import type { ActionState } from "./types";
import { slugifyVietnamese } from "@/lib/slugify";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const productSchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2).max(180),
  code: z.string().trim().min(1).max(60),
  slug: z.string().trim().min(2).max(180).regex(slugPattern),
  categoryId: z.string().uuid(),
  shortDescription: z.string().trim().max(500),
  description: z.string().trim(),
  price: z.union([z.literal(""), z.coerce.number().min(0)]),
  status: z.enum(["draft", "published", "hidden"]),
  featured: z.boolean(),
});
const specsSchema = z.array(z.object({
  name: z.string().trim().min(1).max(120),
  value: z.string().trim().min(1).max(300),
  unit: z.string().trim().max(40),
})).max(60);

export async function saveProduct(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = productSchema.safeParse({
    id: formData.get("id") || "",
    name: formData.get("name"),
    code: formData.get("code"),
    slug: formData.get("slug"),
    categoryId: formData.get("categoryId"),
    shortDescription: formData.get("shortDescription") || "",
    description: formData.get("description") || "",
    price: formData.get("price") || "",
    status: formData.get("status"),
    featured: formData.get("featured") === "on",
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message || "Dữ liệu sản phẩm không hợp lệ." };
  }

  let specs: unknown;
  try {
    specs = JSON.parse(String(formData.get("specs") || "[]"));
  } catch {
    return { error: "Thông số kỹ thuật không hợp lệ." };
  }
  const parsedSpecs = specsSchema.safeParse(specs);
  if (!parsedSpecs.success) {
    return { error: "Hãy nhập đầy đủ tên và giá trị cho từng thông số." };
  }

  const { supabase } = await requireAdmin();
  const input = parsed.data;
  const { data: productId, error: saveError } = await supabase.rpc("admin_save_product", {
    // PostgreSQL cho phép NULL ở tham số hàm; type generator hiện biểu diễn tham số này là string.
    p_product_id: input.id || null!,
    p_category_id: input.categoryId,
    p_name: input.name,
    p_code: input.code,
    p_slug: input.slug,
    p_short_description: input.shortDescription,
    p_description: input.description,
    p_price: input.price === "" ? null! : input.price,
    p_status: input.status,
    p_featured: input.featured,
    p_specs: parsedSpecs.data,
  });
  if (saveError || !productId) {
    if (saveError?.code === "PGRST202") return { error: "Hãy chạy migration 010 trước khi lưu sản phẩm." };
    return { error: saveError?.code === "23505" ? "Mã hoặc slug đã tồn tại." : "Không thể lưu sản phẩm và thông số." };
  }

  const existingImageAlts = [...formData.entries()].filter(([key]) => key.startsWith("imageAlt:"));
  for (const [key, value] of existingImageAlts) {
    const imageId = key.slice("imageAlt:".length);
    const altText = String(value).trim().slice(0, 250);
    if (z.string().uuid().safeParse(imageId).success) {
      await supabase.from("product_images").update({ alt_text: altText }).eq("id", imageId).eq("product_id", productId);
    }
  }

  await cleanupProductAssets(supabase, productId);

  revalidateCatalog();
  revalidateAdminProducts();
  return { success: "Đã lưu dữ liệu sản phẩm.", productId };
}

export async function updateProductPrice(productIdValue: string, priceValue: string): Promise<ActionState> {
  const productId = z.string().uuid().safeParse(productIdValue);
  const rawPrice = priceValue.trim();
  if (!productId.success || (rawPrice !== "" && !/^\d{1,12}(?:\.\d{1,2})?$/.test(rawPrice))) {
    return { error: "Giá phải là số không âm, tối đa 12 chữ số và 2 chữ số thập phân." };
  }

  const price = rawPrice === "" ? null : Number(rawPrice);
  const { user, supabase } = await requireAdmin();
  const { data: product, error: readError } = await supabase.from("products")
    .select("price,slug").eq("id", productId.data).maybeSingle();
  if (readError || !product) return { error: "Không tìm thấy sản phẩm để cập nhật giá." };
  if (product.price === price) return { success: "Giá không thay đổi." };

  try {
    await recordProductSnapshot(supabase, productId.data, user.id, "update");
  } catch {
    return { error: "Không thể lưu phiên bản dự phòng. Giá chưa được thay đổi." };
  }
  const { data: updated, error: updateError } = await supabase.from("products")
    .update({ price, updated_by: user.id }).eq("id", productId.data).select("id").maybeSingle();
  if (updateError || !updated) return { error: "Không thể cập nhật giá sản phẩm. Vui lòng thử lại." };

  revalidateCatalog();
  revalidateAdminProducts();
  revalidatePath(`/san-pham/${product.slug}`);
  revalidatePath(`/admin/san-pham/${productId.data}`);
  return { success: "Đã cập nhật giá sản phẩm." };
}

export async function setProductStatus(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const status = z.enum(["draft", "published", "hidden"]).parse(formData.get("status"));
  const { user, supabase } = await requireAdmin();
  await recordProductSnapshot(supabase, id, user.id, "status");
  const { error } = await supabase.from("products").update({
    status,
    updated_by: user.id,
    published_at: status === "published" ? new Date().toISOString() : null,
  }).eq("id", id);
  if (error) throw new Error("Không thể cập nhật trạng thái sản phẩm.");
  revalidateCatalog();
  revalidateAdminProducts();
}

export async function deleteProduct(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { user, supabase } = await requireAdmin();
  const [{ data: product }, { data: images }, { data: versions }] = await Promise.all([
    supabase.from("products").select("pdf_path").eq("id", id).single(),
    supabase.from("product_images").select("storage_path").eq("product_id", id),
    supabase.from("product_versions").select("snapshot").eq("product_id", id),
  ]);
  if (!product) redirect("/admin/san-pham?error=not_found");
  await supabase.from("products").update({ updated_by: user.id }).eq("id", id);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) redirect("/admin/san-pham?error=delete_failed");
  const historicalPaths=(versions??[]).flatMap(version=>{const snapshot=version.snapshot as {product?:{pdf_path?:string|null};images?:{storage_path?:string}[]};return[...(snapshot.images??[]).map(image=>image.storage_path).filter((path):path is string=>Boolean(path)),...(snapshot.product?.pdf_path?[snapshot.product.pdf_path]:[])]});
  const paths = [...new Set([...(images ?? []).map((image) => image.storage_path), ...(product.pdf_path ? [product.pdf_path] : []),...historicalPaths])];
  const { error: storageError } = paths.length
    ? await supabase.storage.from("product-assets").remove(paths)
    : { error: null };
  revalidateCatalog();
  revalidateAdminProducts();
  redirect(`/admin/san-pham?deleted=1${storageError ? "&storage_cleanup=failed" : ""}`);
}

export async function deleteProductImage(imageId: string) {
  const id = z.string().uuid().parse(imageId);
  const { user, supabase } = await requireAdmin();
  const { data: image } = await supabase.from("product_images").select("product_id,storage_path,is_cover").eq("id", id).single();
  if (!image) return;
  await recordProductSnapshot(supabase, image.product_id, user.id, "image");
  await supabase.from("product_images").delete().eq("id", id);
  // Không xóa file vật lý: phiên bản cũ vẫn cần file này khi khôi phục.
  if (image.is_cover) {
    const { data: next } = await supabase.from("product_images").select("id").eq("product_id", image.product_id).order("sort_order").limit(1).maybeSingle();
    if (next) await supabase.from("product_images").update({ is_cover: true }).eq("id", next.id);
  }
  await supabase.from("products").update({ updated_by: user.id }).eq("id", image.product_id);
  await cleanupProductAssets(supabase, image.product_id);
  revalidatePath(`/admin/san-pham/${image.product_id}`);
  revalidateCatalog();
}

export async function setCoverImage(imageId: string) {
  const id = z.string().uuid().parse(imageId);
  const { user, supabase } = await requireAdmin();
  const { data: image } = await supabase.from("product_images").select("product_id").eq("id", id).single();
  if (!image) return;
  await recordProductSnapshot(supabase, image.product_id, user.id, "image");
  await supabase.from("product_images").update({ is_cover: false }).eq("product_id", image.product_id);
  await supabase.from("product_images").update({ is_cover: true }).eq("id", id);
  await supabase.from("products").update({ updated_by: user.id }).eq("id", image.product_id);
  revalidatePath(`/admin/san-pham/${image.product_id}`);
  revalidateCatalog();
}

export async function moveProductImage(imageId: string, formData: FormData) {
  const id = z.string().uuid().parse(imageId);
  const direction = z.enum(["up", "down"]).parse(formData.get("direction"));
  const { supabase } = await requireAdmin();
  const { data: current } = await supabase.from("product_images").select("id,product_id,sort_order").eq("id", id).single();
  if (!current) return;
  const query = supabase.from("product_images").select("id,sort_order").eq("product_id", current.product_id).order("sort_order", { ascending: direction === "down" }).limit(1);
  const { data: other } = direction === "up"
    ? await query.lt("sort_order", current.sort_order).maybeSingle()
    : await query.gt("sort_order", current.sort_order).maybeSingle();
  if (!other) return;
  await supabase.from("product_images").update({ sort_order: other.sort_order }).eq("id", current.id);
  await supabase.from("product_images").update({ sort_order: current.sort_order }).eq("id", other.id);
  revalidatePath(`/admin/san-pham/${current.product_id}`);
}

export async function reorderProductImages(productIdValue: string, imageIdsValue: string[]) {
  const productId = z.string().uuid().parse(productIdValue);
  const imageIds = z.array(z.string().uuid()).min(1).max(40).parse(imageIdsValue);
  if (new Set(imageIds).size !== imageIds.length) throw new Error("Thứ tự ảnh không hợp lệ.");
  const { user, supabase } = await requireAdmin();
  const { data: images } = await supabase.from("product_images").select("id").eq("product_id", productId);
  const actualIds = new Set((images ?? []).map((image) => image.id));
  if (imageIds.length !== actualIds.size || imageIds.some((id) => !actualIds.has(id))) throw new Error("Danh sách ảnh không hợp lệ.");
  await recordProductSnapshot(supabase, productId, user.id, "image");
  for (let index = 0; index < imageIds.length; index += 1) {
    const { error } = await supabase.from("product_images").update({ sort_order: index }).eq("id", imageIds[index]).eq("product_id", productId);
    if (error) throw new Error("Không thể lưu thứ tự ảnh.");
  }
  await supabase.from("products").update({ updated_by: user.id }).eq("id", productId);
  revalidatePath(`/admin/san-pham/${productId}`);
  revalidateCatalog();
}

export async function reorderProducts(productIdsValue: string[]): Promise<ActionState> {
  const productIds = z.array(z.string().uuid()).max(2000).parse(productIdsValue);
  if (new Set(productIds).size !== productIds.length) {
    return { error: "Danh sách sản phẩm có dữ liệu trùng lặp." };
  }
  const { supabase } = await requireAdmin();
  const { error } = await supabase.rpc("admin_reorder_products", {
    p_product_ids: productIds,
  });
  if (error) {
    if (error.code === "PGRST202") return { error: "Hãy chạy migration 014 trước khi sắp xếp sản phẩm." };
    return { error: "Không thể lưu thứ tự. Hãy tải lại trang và thử lại." };
  }
  revalidateCatalog();
  revalidateAdminProducts();
  revalidatePath("/admin/san-pham/sap-xep");
  return { success: "Đã cập nhật thứ tự hiển thị sản phẩm." };
}

async function uniqueProductValue(kind: "code" | "slug", baseValue: string) {
  const { supabase } = await requireAdmin();
  const cleanBase = baseValue.slice(0, kind === "code" ? 50 : 165);
  for (let number = 1; number < 1000; number += 1) {
    const candidate = `${cleanBase}-${number}`;
    const { count } = await supabase.from("products").select("id", { count: "exact", head: true }).eq(kind, candidate);
    if (!count) return candidate;
  }
  throw new Error("Không thể tạo mã duy nhất cho bản sao.");
}

export async function duplicateProduct(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { user, supabase } = await requireAdmin();
  const [{ data: product }, { data: specs }, { data: images }] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).single(),
    supabase.from("product_specs").select("*").eq("product_id", id).order("sort_order"),
    supabase.from("product_images").select("*").eq("product_id", id).order("sort_order"),
  ]);
  if (!product) throw new Error("Không tìm thấy sản phẩm để nhân bản.");
  const [code, slug] = await Promise.all([
    uniqueProductValue("code", `${product.code}-COPY`),
    uniqueProductValue("slug", slugifyVietnamese(`${product.name}-ban-sao`)),
  ]);
  const { data: copy, error } = await supabase.from("products").insert({
    category_id: product.category_id,
    name: `${product.name} (Bản sao)`, code, slug,
    short_description: product.short_description, description: product.description,
    price: product.price, status: "draft", featured: false,
    created_by: user.id, updated_by: user.id,
  }).select("id").single();
  if (error || !copy) throw new Error("Không thể nhân bản sản phẩm.");
  if (specs?.length) await supabase.from("product_specs").insert(specs.map(spec=>({product_id:copy.id,name:spec.name,value:spec.value,unit:spec.unit,sort_order:spec.sort_order})));

  for (const image of images ?? []) {
    const extension=image.storage_path.split(".").pop()||"jpg";
    const target=`products/${copy.id}/images/${crypto.randomUUID()}.${extension}`;
    const { error: copyError }=await supabase.storage.from("product-assets").copy(image.storage_path,target);
    if (!copyError) await supabase.from("product_images").insert({product_id:copy.id,storage_path:target,alt_text:image.alt_text,sort_order:image.sort_order,is_cover:image.is_cover});
  }
  if(product.pdf_path){
    const target=`products/${copy.id}/documents/${crypto.randomUUID()}.pdf`;
    const {error: copyError}=await supabase.storage.from("product-assets").copy(product.pdf_path,target);
    if(!copyError)await supabase.from("products").update({pdf_path:target,updated_by:user.id}).eq("id",copy.id);
  }
  await supabase.from("audit_logs").insert({entity_type:"product",entity_id:copy.id,entity_label:`${product.name} (Bản sao)`,action:"duplicated",actor_id:user.id,details:{source_product_id:id}});
  revalidateAdminProducts();
  redirect(`/admin/san-pham/${copy.id}?duplicated=1`);
}
