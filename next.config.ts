import type { NextConfig } from "next";

function getSupabaseImagePatterns() {
  const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!value) return [];

  try {
    const url = new URL(value);
    const protocol = url.protocol.slice(0, -1);
    if (protocol !== "http" && protocol !== "https") return [];

    const source = {
      protocol,
      hostname: url.hostname,
      port: url.port,
    } as const;

    return [
      { ...source, pathname: "/storage/v1/object/sign/product-assets/**" },
      { ...source, pathname: "/storage/v1/object/public/product-assets/**" },
    ];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: "52mb" },
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    remotePatterns: getSupabaseImagePatterns(),
  },
};

export default nextConfig;
