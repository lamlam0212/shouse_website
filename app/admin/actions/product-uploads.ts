"use server";

import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { cleanupProductAssets } from "./product-history";
import { revalidateAdminProducts, revalidateCatalog } from "./cache";
import { validateImage, validatePdf } from "./file-validation";

const imageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const imageExtensions: Record<(typeof imageTypes)[number], string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};
const uploadDescriptorSchema = z.object({
  name: z.string().min(1).max(255),
  size: z.number().int().positive(),
  type: z.string().min(1).max(100),
});
const prepareSchema = z.object({
  images: z.array(uploadDescriptorSchema).max(8),
  pdf: uploadDescriptorSchema.nullable(),
});
const uploadedAssetSchema = z.object({
  path: z.string().min(1).max(500),
  name: z.string().min(1).max(255),
  size: z.number().int().positive(),
  type: z.string().min(1).max(100),
});
const finalizeSchema = z.object({
  images: z.array(uploadedAssetSchema.extend({ altText: z.string().trim().max(250) })).max(8),
  pdf: uploadedAssetSchema.nullable(),
});

function fileExtension(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

function validateImageDescriptor(file: z.infer<typeof uploadDescriptorSchema>) {
  if (!imageTypes.includes(file.type as (typeof imageTypes)[number])) return "Ảnh phải là JPG, PNG hoặc WebP.";
  if (file.size > 5 * 1024 * 1024) return "Ảnh tối đa 5 MB.";
  const allowed = imageExtensions[file.type as (typeof imageTypes)[number]];
  if (!allowed.includes(fileExtension(file.name))) return "Phần mở rộng ảnh không khớp định dạng.";
  return null;
}

function validatePdfDescriptor(file: z.infer<typeof uploadDescriptorSchema>) {
  if (file.type !== "application/pdf" || fileExtension(file.name) !== "pdf") return "Tài liệu phải là file PDF.";
  if (file.size > 10 * 1024 * 1024) return "PDF tối đa 10 MB.";
  return null;
}

function storageExtension(type: string) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "pdf";
}

export async function prepareProductUploads(productIdValue: string, inputValue: unknown) {
  const productId = z.string().uuid().safeParse(productIdValue);
  const input = prepareSchema.safeParse(inputValue);
  if (!productId.success || !input.success) return { error: "Danh sách file tải lên không hợp lệ." };
  if (!input.data.images.length && !input.data.pdf) return { images: [], pdf: null };

  for (const image of input.data.images) {
    const error = validateImageDescriptor(image);
    if (error) return { error };
  }
  if (input.data.pdf) {
    const error = validatePdfDescriptor(input.data.pdf);
    if (error) return { error };
  }

  const { supabase } = await requireAdmin();
  const { data: product } = await supabase.from("products").select("id").eq("id", productId.data).maybeSingle();
  if (!product) return { error: "Không tìm thấy sản phẩm để tải file." };

  const imagePaths = input.data.images.map(file =>
    `products/${productId.data}/images/${crypto.randomUUID()}.${storageExtension(file.type)}`,
  );
  const pdfPath = input.data.pdf
    ? `products/${productId.data}/documents/${crypto.randomUUID()}.pdf`
    : null;
  const paths = [...imagePaths, ...(pdfPath ? [pdfPath] : [])];
  const signed = await Promise.all(paths.map(path =>
    supabase.storage.from("product-assets").createSignedUploadUrl(path, { upsert: false }),
  ));
  const failed = signed.find(result => result.error || !result.data?.token);
  if (failed) return { error: "Không thể cấp quyền tải file lên Supabase." };

  const tickets = signed.map((result, index) => ({
    path: paths[index],
    token: result.data!.token,
  }));
  return {
    images: tickets.slice(0, imagePaths.length),
    pdf: pdfPath ? tickets[tickets.length - 1] : null,
  };
}

async function validateStoredAsset(
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
  asset: z.infer<typeof uploadedAssetSchema>,
  kind: "image" | "pdf",
) {
  const { data, error } = await supabase.storage.from("product-assets").download(asset.path);
  if (error || !data || data.size !== asset.size) return "File tải lên không đầy đủ hoặc không tồn tại.";
  const file = new File([data], asset.path.split("/").pop() ?? asset.name, {
    type: data.type || asset.type,
  });
  if (file.type !== asset.type) return "MIME của file tải lên không khớp.";
  return kind === "image" ? validateImage(file) : validatePdf(file);
}

export async function finalizeProductUploads(productIdValue: string, inputValue: unknown) {
  const productId = z.string().uuid().safeParse(productIdValue);
  const input = finalizeSchema.safeParse(inputValue);
  if (!productId.success || !input.success) return { error: "Thông tin file đã tải lên không hợp lệ." };

  const imagePrefix = `products/${productId.data}/images/`;
  const documentPrefix = `products/${productId.data}/documents/`;
  if (input.data.images.some(asset => !asset.path.startsWith(imagePrefix)) ||
      (input.data.pdf && !input.data.pdf.path.startsWith(documentPrefix))) {
    return { error: "Đường dẫn file không thuộc sản phẩm này." };
  }

  const { supabase } = await requireAdmin();
  const uploadedPaths = [
    ...input.data.images.map(image => image.path),
    ...(input.data.pdf ? [input.data.pdf.path] : []),
  ];
  for (const image of input.data.images) {
    const error = await validateStoredAsset(supabase, image, "image");
    if (error) {
      await supabase.storage.from("product-assets").remove(uploadedPaths);
      return { error };
    }
  }
  if (input.data.pdf) {
    const error = await validateStoredAsset(supabase, input.data.pdf, "pdf");
    if (error) {
      await supabase.storage.from("product-assets").remove(uploadedPaths);
      return { error };
    }
  }

  const { error: attachError } = await supabase.rpc("admin_attach_product_assets", {
    p_product_id: productId.data,
    p_images: input.data.images.map(image => ({
      storage_path: image.path,
      alt_text: image.altText,
    })),
    p_pdf_path: input.data.pdf?.path ?? null!,
  });
  if (attachError) {
    await supabase.storage.from("product-assets").remove(uploadedPaths);
    if (attachError.code === "PGRST202") return { error: "Hãy chạy migration 011 trước khi tải file." };
    return { error: "File đã tải lên nhưng không thể gắn với sản phẩm." };
  }

  await cleanupProductAssets(supabase, productId.data);
  revalidateCatalog();
  revalidateAdminProducts();
  return { success: true };
}

export async function discardProductUploads(productIdValue: string, pathsValue: unknown) {
  const productId = z.string().uuid().safeParse(productIdValue);
  const paths = z.array(z.string().min(1).max(500)).max(9).safeParse(pathsValue);
  if (!productId.success || !paths.success) return;
  const root = `products/${productId.data}/`;
  const safePaths = paths.data.filter(path =>
    path.startsWith(`${root}images/`) || path.startsWith(`${root}documents/`),
  );
  if (!safePaths.length) return;
  const { supabase } = await requireAdmin();
  await supabase.storage.from("product-assets").remove(safePaths);
}
