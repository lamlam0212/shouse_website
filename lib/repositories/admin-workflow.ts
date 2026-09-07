import "server-only";
import type { AuditLog,ProductVersion } from "@/lib/models";
import { createClient } from "@/lib/supabase/server";

async function profileNames(ids:(string|null)[]){
  const unique=[...new Set(ids.filter((id):id is string=>Boolean(id)))];if(!unique.length)return new Map<string,string>();
  const supabase=await createClient();const{data}=await supabase.from("profiles").select("id,display_name").in("id",unique);
  return new Map((data??[]).map(profile=>[profile.id,profile.display_name||"Quản trị viên"]));
}

export async function getProductVersions(productId:string):Promise<ProductVersion[]>{
  const supabase=await createClient();const{data,error}=await supabase.from("product_versions").select("id,product_id,version_number,change_type,created_by,created_at").eq("product_id",productId).order("version_number",{ascending:false});
  if(error)throw new Error("Không thể tải lịch sử sản phẩm.");const names=await profileNames((data??[]).map(item=>item.created_by));
  return(data??[]).map(item=>({id:item.id,productId:item.product_id,versionNumber:item.version_number,changeType:item.change_type as ProductVersion["changeType"],createdBy:item.created_by??undefined,createdByName:item.created_by?names.get(item.created_by):undefined,createdAt:item.created_at}));
}

export async function getAuditLogs(limit=100):Promise<AuditLog[]>{
  const supabase=await createClient();const{data,error}=await supabase.from("audit_logs").select("id,entity_type,entity_id,entity_label,action,actor_id,created_at").order("created_at",{ascending:false}).limit(Math.min(200,Math.max(1,limit)));
  if(error)throw new Error("Không thể tải nhật ký hoạt động.");const names=await profileNames((data??[]).map(item=>item.actor_id));
  return(data??[]).map(item=>({id:item.id,entityType:item.entity_type as AuditLog["entityType"],entityId:item.entity_id??undefined,entityLabel:item.entity_label,action:item.action as AuditLog["action"],actorId:item.actor_id??undefined,actorName:item.actor_id?names.get(item.actor_id):"Hệ thống",createdAt:item.created_at}));
}
