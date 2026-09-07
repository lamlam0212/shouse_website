import { notFound } from "next/navigation";
import { ProductEditorV2 } from "@/components/admin/product-editor-v2";
import { getAdminProduct,getCategories } from "@/lib/queries";
export default async function EditProduct({params}:{params:Promise<{id:string}>}){const{id}=await params;const[product,categories]=await Promise.all([getAdminProduct(id),getCategories(true)]);if(!product)notFound();return <div className="admin-page"><ProductEditorV2 product={product} categories={categories}/></div>}
