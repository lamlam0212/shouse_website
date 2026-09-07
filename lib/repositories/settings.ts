import "server-only";

import { unstable_cache } from "next/cache";
import { defaultAboutFeatures, defaultHeroTrustItems, emptySiteSettings, type AboutFeature, type SiteSettings } from "@/lib/models";
import { createPublicClient } from "@/lib/supabase/public";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { mapSignedUrls, publicImageUrl } from "./assets";

function parseAboutFeatures(value: unknown): AboutFeature[] {
  if (!Array.isArray(value)) return defaultAboutFeatures;
  const features = value.filter((item): item is AboutFeature => Boolean(item) && typeof item === "object" && "title" in item && "description" in item && typeof item.title === "string" && typeof item.description === "string").slice(0, 3);
  return features.length ? features : defaultAboutFeatures;
}

function parseTrustItems(value: unknown): string[] {
  if (!Array.isArray(value)) return defaultHeroTrustItems;
  const items = value.filter((item): item is string => typeof item === "string" && Boolean(item.trim())).slice(0, 3);
  return items.length ? items : defaultHeroTrustItems;
}

async function loadSiteSettings(admin = false): Promise<SiteSettings> {
  const supabase = admin ? await createServerClient() : createPublicClient();
  const { data, error } = await supabase.from("site_settings").select("logo_path,hero_image_path,hero_kicker,hero_title,hero_highlight,hero_description,hero_primary_label,hero_secondary_label,hero_card_title,hero_card_description,hero_trust_items,about_image_path,hotline,zalo,address,email,about,about_kicker,about_title,about_features,about_cta_label").eq("id", 1).maybeSingle();
  if (error) throw new Error("Không thể tải cài đặt website. Hãy kiểm tra các migration đã được chạy đầy đủ.");
  if (!data) return emptySiteSettings;

  const paths = admin ? [data.logo_path, data.hero_image_path, data.about_image_path].filter((path): path is string => Boolean(path)) : [];
  const { data: signedData } = paths.length ? await supabase.storage.from("product-assets").createSignedUrls(paths, 600) : { data: [] };
  const signed = mapSignedUrls(paths, signedData);
  const assetUrl = (path: string | null) => path ? (admin ? signed.get(path) : publicImageUrl(path)) : undefined;

  return {
    logoPath: data.logo_path ?? undefined,
    logoUrl: assetUrl(data.logo_path),
    heroImagePath: data.hero_image_path ?? undefined,
    heroImageUrl: assetUrl(data.hero_image_path),
    heroKicker: data.hero_kicker || emptySiteSettings.heroKicker,
    heroTitle: data.hero_title || emptySiteSettings.heroTitle,
    heroHighlight: data.hero_highlight || emptySiteSettings.heroHighlight,
    heroDescription: data.hero_description || emptySiteSettings.heroDescription,
    heroPrimaryLabel: data.hero_primary_label || emptySiteSettings.heroPrimaryLabel,
    heroSecondaryLabel: data.hero_secondary_label || emptySiteSettings.heroSecondaryLabel,
    heroCardTitle: data.hero_card_title || emptySiteSettings.heroCardTitle,
    heroCardDescription: data.hero_card_description || emptySiteSettings.heroCardDescription,
    heroTrustItems: parseTrustItems(data.hero_trust_items),
    aboutImagePath: data.about_image_path ?? undefined,
    aboutImageUrl: assetUrl(data.about_image_path),
    hotline: data.hotline,
    zalo: data.zalo,
    address: data.address,
    email: data.email,
    about: data.about,
    aboutKicker: data.about_kicker || emptySiteSettings.aboutKicker,
    aboutTitle: data.about_title || emptySiteSettings.aboutTitle,
    aboutFeatures: parseAboutFeatures(data.about_features),
    aboutCtaLabel: data.about_cta_label || emptySiteSettings.aboutCtaLabel,
  };
}

const getCachedSiteSettings = unstable_cache(
  () => loadSiteSettings(false),
  ["public-site-settings"],
  { tags: ["site-settings"], revalidate: 3600 },
);

export async function getSiteSettings(admin = false): Promise<SiteSettings> {
  return admin ? loadSiteSettings(true) : getCachedSiteSettings();
}
