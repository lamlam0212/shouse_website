import { createPublicClient } from "@/lib/supabase/public";

const imageExtension = /\.(?:jpe?g|png|webp)$/i;
const allowedRoots = new Set(["products", "categories", "site"]);

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const valid =
    segments.length >= 2 &&
    segments.length <= 8 &&
    allowedRoots.has(segments[0]) &&
    segments.every(
      (segment) =>
        segment.length > 0 &&
        segment.length <= 220 &&
        segment !== "." &&
        segment !== ".." &&
        !segment.includes("/") &&
        !segment.includes("\\"),
    );
  const storagePath = valid ? segments.join("/") : "";

  if (!storagePath || storagePath.length > 1000 || !imageExtension.test(storagePath)) {
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  // Client anon buộc Supabase kiểm tra Storage RLS: file nháp không thể nhận URL ký.
  const supabase = createPublicClient();
  const { data, error } = await supabase.storage
    .from("product-assets")
    .createSignedUrl(storagePath, 60);

  if (error || !data?.signedUrl) {
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  const upstream = await fetch(data.signedUrl, { cache: "no-store" });
  const contentType = upstream.headers.get("content-type") || "";
  if (!upstream.ok || !upstream.body || !contentType.startsWith("image/")) {
    return new Response(null, {
      status: 404,
      headers: { "Cache-Control": "private, no-store" },
    });
  }

  return new Response(upstream.body, {
    status: 200,
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Type": contentType,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
