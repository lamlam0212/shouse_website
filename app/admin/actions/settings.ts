"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { revalidateSiteSettings } from "./cache";
import { storageExtension, validateImage } from "./file-validation";
import type { ActionState } from "./types";

const settingsSchema = z.object({
  hotline: z.string().trim().max(30),
  zalo: z.string().trim().max(30),
  address: z.string().trim().max(300),
  email: z.union([z.literal(""), z.email()]),
  heroKicker: z.string().trim().min(2).max(80),
  heroTitle: z.string().trim().min(2).max(120),
  heroHighlight: z.string().trim().min(2).max(100),
  heroDescription: z.string().trim().min(10).max(500),
  heroPrimaryLabel: z.string().trim().min(2).max(60),
  heroSecondaryLabel: z.string().trim().min(2).max(60),
  heroCardTitle: z.string().trim().min(2).max(80),
  heroCardDescription: z.string().trim().min(2).max(180),
  heroTrustItems: z.array(z.string().trim().min(2).max(80)).min(1).max(3),
  about: z.string().trim().max(3000),
  aboutKicker: z.string().trim().min(2).max(80),
  aboutTitle: z.string().trim().min(5).max(180),
  aboutCtaLabel: z.string().trim().min(2).max(60),
  aboutFeatures: z.array(z.object({
    title: z.string().trim().min(2).max(100),
    description: z.string().trim().min(2).max(240),
  })).min(1).max(3),
});

async function uploadSiteImage(
  file: File,
  prefix: string,
  supabase: Awaited<ReturnType<typeof requireAdmin>>["supabase"],
) {
  const path = `site/${prefix}-${crypto.randomUUID()}.${storageExtension(file)}`;
  const { error } = await supabase.storage.from("product-assets").upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  return { path, error };
}

export async function saveSettings(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const featureTitles = formData.getAll("aboutFeatureTitle");
  const featureDescriptions = formData.getAll("aboutFeatureDescription");
  const aboutFeatures = featureTitles.map((title, index) => ({
    title: String(title),
    description: String(featureDescriptions[index] || ""),
  })).filter((feature) => feature.title.trim() || feature.description.trim());
  const heroTrustItems = formData.getAll("heroTrustItem").map(String).filter((item) => item.trim());
  const parsed = settingsSchema.safeParse({
    hotline: formData.get("hotline") || "",
    zalo: formData.get("zalo") || "",
    address: formData.get("address") || "",
    email: formData.get("email") || "",
    heroKicker: formData.get("heroKicker") || "",
    heroTitle: formData.get("heroTitle") || "",
    heroHighlight: formData.get("heroHighlight") || "",
    heroDescription: formData.get("heroDescription") || "",
    heroPrimaryLabel: formData.get("heroPrimaryLabel") || "",
    heroSecondaryLabel: formData.get("heroSecondaryLabel") || "",
    heroCardTitle: formData.get("heroCardTitle") || "",
    heroCardDescription: formData.get("heroCardDescription") || "",
    heroTrustItems,
    about: formData.get("about") || "",
    aboutKicker: formData.get("aboutKicker") || "",
    aboutTitle: formData.get("aboutTitle") || "",
    aboutCtaLabel: formData.get("aboutCtaLabel") || "",
    aboutFeatures,
  });
  if (!parsed.success) return { error: "Thông tin cài đặt hoặc nội dung giới thiệu không hợp lệ." };

  const fileFrom = (name: string) => {
    const value = formData.get(name);
    return value instanceof File && value.size > 0 ? value : null;
  };
  const logo = fileFrom("logo");
  const heroImage = fileFrom("heroImage");
  const aboutImage = fileFrom("aboutImage");
  const removeHero = formData.get("removeHero") === "on";
  const removeAboutImage = formData.get("removeAboutImage") === "on";

  for (const [file, maxSize] of [[logo, 2], [heroImage, 5], [aboutImage, 5]] as const) {
    if (file) {
      const error = await validateImage(file, maxSize);
      if (error) return { error };
    }
  }

  const { user, supabase } = await requireAdmin();
  const current = await supabase.from("site_settings")
    .select("logo_path,hero_image_path,about_image_path,about_kicker,hero_kicker")
    .eq("id", 1)
    .maybeSingle();
  if (current.error) return { error: "Hãy chạy migration 006 trước khi lưu nội dung đầu trang." };

  const uploaded: string[] = [];
  const upload = async (file: File | null, prefix: string, message: string) => {
    if (!file) return { path: undefined, error: undefined };
    const result = await uploadSiteImage(file, prefix, supabase);
    if (result.error) return { path: undefined, error: message };
    uploaded.push(result.path);
    return { path: result.path, error: undefined };
  };

  const logoUpload = await upload(logo, "logo", "Không thể tải logo.");
  if (logoUpload.error) return { error: logoUpload.error };
  const heroUpload = await upload(heroImage, "homepage-hero", "Không thể tải ảnh trang chủ.");
  if (heroUpload.error) {
    if (uploaded.length) await supabase.storage.from("product-assets").remove(uploaded);
    return { error: heroUpload.error };
  }
  const aboutUpload = await upload(aboutImage, "about", "Không thể tải ảnh giới thiệu.");
  if (aboutUpload.error) {
    if (uploaded.length) await supabase.storage.from("product-assets").remove(uploaded);
    return { error: aboutUpload.error };
  }

  const input = parsed.data;
  const row = {
    hotline: input.hotline,
    zalo: input.zalo,
    address: input.address,
    email: input.email,
    hero_kicker: input.heroKicker,
    hero_title: input.heroTitle,
    hero_highlight: input.heroHighlight,
    hero_description: input.heroDescription,
    hero_primary_label: input.heroPrimaryLabel,
    hero_secondary_label: input.heroSecondaryLabel,
    hero_card_title: input.heroCardTitle,
    hero_card_description: input.heroCardDescription,
    hero_trust_items: input.heroTrustItems,
    about: input.about,
    about_kicker: input.aboutKicker,
    about_title: input.aboutTitle,
    about_features: input.aboutFeatures,
    about_cta_label: input.aboutCtaLabel,
    updated_by: user.id,
    ...(logoUpload.path ? { logo_path: logoUpload.path } : {}),
    ...(heroUpload.path ? { hero_image_path: heroUpload.path } : removeHero ? { hero_image_path: null } : {}),
    ...(aboutUpload.path ? { about_image_path: aboutUpload.path } : removeAboutImage ? { about_image_path: null } : {}),
  };
  const { error } = await supabase.from("site_settings").upsert({ id: 1, ...row });
  if (error) {
    if (uploaded.length) await supabase.storage.from("product-assets").remove(uploaded);
    return { error: "Không thể lưu cài đặt." };
  }

  const obsolete = [
    logoUpload.path && current.data?.logo_path,
    heroUpload.path && current.data?.hero_image_path,
    removeHero && current.data?.hero_image_path,
    aboutUpload.path && current.data?.about_image_path,
    removeAboutImage && current.data?.about_image_path,
  ].filter((path): path is string => Boolean(path));
  if (obsolete.length) await supabase.storage.from("product-assets").remove([...new Set(obsolete)]);

  revalidateSiteSettings();
  revalidatePath("/admin/cai-dat");
  return { success: "Đã lưu cài đặt website." };
}

export async function useDefaultLogo() {
  const { supabase } = await requireAdmin();
  const { data: settings } = await supabase.from("site_settings").select("logo_path").eq("id", 1).maybeSingle();
  const { error } = await supabase.from("site_settings").update({ logo_path: null }).eq("id", 1);
  if (error) redirect("/admin/cai-dat?error=logo_reset_failed");
  if (settings?.logo_path) await supabase.storage.from("product-assets").remove([settings.logo_path]);
  revalidateSiteSettings();
  revalidatePath("/admin/cai-dat");
  redirect("/admin/cai-dat?logo=default");
}
