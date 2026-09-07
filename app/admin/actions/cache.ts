import { revalidatePath, revalidateTag } from "next/cache";

export function revalidateCatalog() {
  revalidateTag("products", "max");
  revalidateTag("categories", "max");
  revalidatePath("/");
  revalidatePath("/san-pham");
}

export function revalidateSiteSettings() {
  revalidateTag("site-settings", "max");
  revalidatePath("/", "layout");
}

export function revalidateAdminProducts() {
  revalidatePath("/admin");
  revalidatePath("/admin/san-pham");
}
