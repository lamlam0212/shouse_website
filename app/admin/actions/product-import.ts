"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { parseCsv } from "@/lib/csv";
import { slugifyVietnamese } from "@/lib/slugify";
import { recordProductSnapshot } from "./product-history";
import { revalidateAdminProducts, revalidateCatalog } from "./cache";
import type { ActionState } from "./types";

const headers=["name","code","slug","category_slug","short_description","description","price","status","featured","specs_json"];
const rowSchema=z.object({
  name:z.string().trim().min(2).max(180),code:z.string().trim().min(1).max(60),slug:z.string().trim().max(180),
  category_slug:z.string().trim().min(1),short_description:z.string().trim().max(500),description:z.string(),
  price:z.string(),status:z.enum(["draft","published","hidden"]),featured:z.string(),specs_json:z.string(),
});
const specsSchema=z.array(z.object({name:z.string().trim().min(1).max(120),value:z.string().trim().min(1).max(300),unit:z.string().trim().max(40).optional().default("")})).max(60);

export async function importProductsCsv(_:ActionState,formData:FormData):Promise<ActionState>{
  const fileValue=formData.get("csv");
  if(!(fileValue instanceof File)||!fileValue.size)return{error:"Hãy chọn file CSV."};
  if(fileValue.size>2*1024*1024||!fileValue.name.toLowerCase().endsWith(".csv"))return{error:"File phải có đuôi .csv và không vượt quá 2 MB."};
  const rows=parseCsv(await fileValue.text());
  if(rows.length<2)return{error:"File CSV chưa có dữ liệu sản phẩm."};
  const actualHeaders=rows[0].map(value=>value.trim().toLowerCase());
  if(headers.some((header,index)=>actualHeaders[index]!==header))return{error:`Thứ tự cột phải là: ${headers.join(", ")}`};
  if(rows.length>501)return{error:"Mỗi lần chỉ nhập tối đa 500 sản phẩm."};

  const {user,supabase}=await requireAdmin();
  const {data:categories}=await supabase.from("categories").select("id,slug");
  const categoryMap=new Map((categories??[]).map(category=>[category.slug,category.id]));
  let created=0;let updated=0;
  for(let index=1;index<rows.length;index+=1){
    const values=Object.fromEntries(headers.map((header,column)=>[header,rows[index][column]??""]));
    const parsed=rowSchema.safeParse(values);if(!parsed.success)return{error:`Dòng ${index+1}: dữ liệu không hợp lệ.`};
    const input=parsed.data;const categoryId=categoryMap.get(input.category_slug);if(!categoryId)return{error:`Dòng ${index+1}: không tìm thấy danh mục “${input.category_slug}”.`};
    let specs:unknown=[];try{specs=input.specs_json?JSON.parse(input.specs_json):[]}catch{return{error:`Dòng ${index+1}: specs_json không phải JSON hợp lệ.`}}
    const parsedSpecs=specsSchema.safeParse(specs);if(!parsedSpecs.success)return{error:`Dòng ${index+1}: thông số không hợp lệ.`};
    const price=input.price.trim()===""?null:Number(input.price);if(price!==null&&(!Number.isFinite(price)||price<0))return{error:`Dòng ${index+1}: giá không hợp lệ.`};
    const slug=input.slug||slugifyVietnamese(input.name);if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug))return{error:`Dòng ${index+1}: slug không hợp lệ.`};
    const {data:existing}=await supabase.from("products").select("id").eq("code",input.code).maybeSingle();
    const row={category_id:categoryId,name:input.name,code:input.code,slug,short_description:input.short_description,description:input.description,price,status:input.status,featured:["1","true","yes","có"].includes(input.featured.toLowerCase()),updated_by:user.id,published_at:input.status==="published"?new Date().toISOString():null};
    let productId:string;
    if(existing){await recordProductSnapshot(supabase,existing.id,user.id,"update");const{error}=await supabase.from("products").update(row).eq("id",existing.id);if(error)return{error:`Dòng ${index+1}: mã hoặc slug bị trùng.`};productId=existing.id;updated+=1}
    else{const{data,error}=await supabase.from("products").insert({...row,created_by:user.id}).select("id").single();if(error||!data)return{error:`Dòng ${index+1}: không thể tạo sản phẩm, hãy kiểm tra mã và slug.`};productId=data.id;created+=1}
    await supabase.from("product_specs").delete().eq("product_id",productId);
    if(parsedSpecs.data.length){const{error}=await supabase.from("product_specs").insert(parsedSpecs.data.map((spec,order)=>({...spec,product_id:productId,sort_order:order})));if(error)return{error:`Dòng ${index+1}: không thể lưu thông số.`}}
  }
  revalidateCatalog();revalidateAdminProducts();revalidatePath("/admin/san-pham");
  return{success:`Đã nhập ${created} sản phẩm mới và cập nhật ${updated} sản phẩm.`};
}
