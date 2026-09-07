"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { revalidateCatalog } from "./cache";
import { storageExtension, validateImage } from "./file-validation";
import type { ActionState } from "./types";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const categorySchema = z.object({
  id: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2).max(100),
  slug: z.string().trim().regex(slugPattern),
  description: z.string().trim(),
  sortOrder: z.coerce.number().int().min(0),
  isActive: z.boolean(),
});

export async function saveCategory(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = categorySchema.safeParse({
    id: formData.get("id") || "",
    name: formData.get("name"),
    slug: formData.get("slug"),
    description: formData.get("description") || "",
    sortOrder: formData.get("sortOrder") || 0,
    isActive: formData.get("isActive") === "on",
  });
  if (!parsed.success) return { error: "Thông tin danh mục không hợp lệ." };

  const imageValue = formData.get("image");
  const image = imageValue instanceof File && imageValue.size > 0 ? imageValue : null;
  if (image) {
    const imageError = await validateImage(image, 3);
    if (imageError) return { error: imageError };
  }

  const { supabase } = await requireAdmin();
  const { id, ...input } = parsed.data;
  const row = {
    name: input.name,
    slug: input.slug,
    description: input.description,
    sort_order: input.sortOrder,
    is_active: input.isActive,
  };
  let categoryId = id || "";
  let oldImagePath: string | null = null;

  if (categoryId) {
    const { data: current } = await supabase.from("categories").select("image_path").eq("id", categoryId).single();
    oldImagePath = current?.image_path ?? null;
    const { error } = await supabase.from("categories").update(row).eq("id", categoryId);
    if (error) return { error: error.code === "23505" ? "Slug danh mục đã tồn tại." : "Không thể lưu danh mục." };
  } else {
    const { data, error } = await supabase.from("categories").insert(row).select("id").single();
    if (error || !data) return { error: error?.code === "23505" ? "Slug danh mục đã tồn tại." : "Không thể tạo danh mục." };
    categoryId = data.id;
  }

  if (image) {
    const path = `categories/${categoryId}/cover-${crypto.randomUUID()}.${storageExtension(image)}`;
    const { error: uploadError } = await supabase.storage.from("product-assets").upload(path, image, { contentType: image.type, upsert: false });
    if (uploadError) return { error: "Danh mục đã lưu nhưng không thể tải ảnh." };
    const { error: updateError } = await supabase.from("categories").update({ image_path: path }).eq("id", categoryId);
    if (updateError) {
      await supabase.storage.from("product-assets").remove([path]);
      return { error: "Ảnh đã tải nhưng không thể liên kết với danh mục." };
    }
    if (oldImagePath) await supabase.storage.from("product-assets").remove([oldImagePath]);
  }

  revalidateCatalog();
  revalidatePath("/admin/danh-muc");
  return { success: "Đã lưu danh mục." };
}

export async function deleteCategory(formData: FormData) {
  const id = z.string().uuid().parse(formData.get("id"));
  const { supabase } = await requireAdmin();
  const [{ count }, { data: category }] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("category_id", id),
    supabase.from("categories").select("image_path").eq("id", id).single(),
  ]);
  if ((count ?? 0) > 0) redirect("/admin/danh-muc?error=category_in_use");
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) redirect("/admin/danh-muc?error=delete_failed");
  if (category?.image_path) await supabase.storage.from("product-assets").remove([category.image_path]);
  revalidateCatalog();
  revalidatePath("/admin/danh-muc");
  redirect("/admin/danh-muc?deleted=1");
}
