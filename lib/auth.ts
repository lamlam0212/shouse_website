import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
export async function getAdmin(){const supabase=await createClient();const {data:{user}}=await supabase.auth.getUser();if(!user)return null;const {data:profile}=await supabase.from("profiles").select("id,role,display_name").eq("id",user.id).maybeSingle();if(!profile||profile.role!=="admin")return null;return{user,profile,supabase}}
export async function requireAdmin(){const admin=await getAdmin();if(!admin)redirect("/admin/login?error=unauthorized");return admin}
