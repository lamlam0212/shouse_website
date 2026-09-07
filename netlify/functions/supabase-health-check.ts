import { createClient } from "@supabase/supabase-js";

const schedule = "17 1 * * *";

export default async function supabaseHealthCheck() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !publishableKey) {
    throw new Error("Thiếu cấu hình Supabase cho tác vụ kiểm tra định kỳ.");
  }

  const startedAt = Date.now();
  const supabase = createClient(url, publishableKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { count, error } = await supabase
    .from("site_settings")
    .select("id", { count: "exact", head: true });

  if (error) {
    console.error(JSON.stringify({
      event: "supabase_health_check_failed",
      durationMs: Date.now() - startedAt,
      message: error.message,
    }));
    throw new Error("Supabase không phản hồi kiểm tra định kỳ.");
  }

  console.info(JSON.stringify({
    event: "supabase_health_check_succeeded",
    durationMs: Date.now() - startedAt,
    rows: count ?? 0,
  }));

  return new Response(null, { status: 204 });
}

export const config = { schedule };
