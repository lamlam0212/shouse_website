import { notFound } from "next/navigation";
import { ProductDetailView } from "@/components/product-detail-view";
import { requireAdmin } from "@/lib/auth";
import { getAdminProduct, getSiteSettings } from "@/lib/queries";

export const dynamic="force-dynamic";
export default async function ProductPreview({params}:{params:Promise<{id:string}>}){
  await requireAdmin();
  const {id}=await params;
  const [product,settings]=await Promise.all([getAdminProduct(id),getSiteSettings(true)]);
  if(!product)notFound();
  return <div className="admin-preview"><ProductDetailView product={product} settings={settings} preview/></div>;
}
