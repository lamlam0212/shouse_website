"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type LoginState={error?:string};
const loginSchema=z.object({email:z.email("Email không hợp lệ").trim(),password:z.string().min(1,"Vui lòng nhập mật khẩu")});
export async function login(_:LoginState,formData:FormData):Promise<LoginState>{const parsed=loginSchema.safeParse({email:formData.get("email"),password:formData.get("password")});if(!parsed.success)return{error:parsed.error.issues[0]?.message||"Dữ liệu không hợp lệ"};const supabase=await createClient();const{data,error}=await supabase.auth.signInWithPassword(parsed.data);if(error||!data.user)return{error:"Email hoặc mật khẩu không đúng."};const{data:profile}=await supabase.from("profiles").select("role").eq("id",data.user.id).maybeSingle();if(!profile||profile.role!=="admin"){await supabase.auth.signOut();return{error:"Tài khoản này không có quyền quản trị."}}redirect("/admin")}
export async function logout(){const supabase=await createClient();await supabase.auth.signOut();redirect("/admin/login")}
