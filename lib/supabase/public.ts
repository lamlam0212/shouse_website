import "server-only";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseConfig } from "./config";
import type { Database } from "./database.types";
export function createPublicClient() { const { url, publishableKey } = getSupabaseConfig(); return createClient<Database>(url,publishableKey,{auth:{persistSession:false,autoRefreshToken:false}}); }
