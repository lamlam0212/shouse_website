import { ProductEditorV2 } from "@/components/admin/product-editor-v2";
import { getCategories } from "@/lib/queries";
export default async function NewProduct(){const categories=await getCategories(true);return <div className="admin-page"><ProductEditorV2 categories={categories}/></div>}
