import { getAdmin } from "@/lib/auth";
import { stringifyCsv } from "@/lib/csv";

export const dynamic="force-dynamic";
export async function GET(){
  const admin=await getAdmin();if(!admin)return new Response("Không có quyền truy cập.",{status:401});
  const{data:products,error}=await admin.supabase.from("products").select("name,code,slug,short_description,description,price,status,featured,categories(slug),product_specs(name,value,unit,sort_order)").order("created_at");
  if(error)return new Response("Không thể xuất sản phẩm.",{status:500});
  const rows:(string|number|boolean|null)[][]=[["name","code","slug","category_slug","short_description","description","price","status","featured","specs_json"]];
  for(const product of products??[]){const category=product.categories as {slug:string}|null;const specs=[...(product.product_specs??[])].sort((a,b)=>a.sort_order-b.sort_order).map(({name,value,unit})=>({name,value,unit}));rows.push([product.name,product.code,product.slug,category?.slug??"",product.short_description,product.description,product.price,product.status,product.featured,JSON.stringify(specs)])}
  return new Response(`\uFEFF${stringifyCsv(rows)}`,{headers:{"Content-Type":"text/csv; charset=utf-8","Content-Disposition":`attachment; filename="s-house-products-${new Date().toISOString().slice(0,10)}.csv"`,"Cache-Control":"no-store"}});
}
