import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductOrderEditor } from "@/components/admin/product-order-editor";
import { getAdminProductOrder } from "@/lib/queries";

export default async function ProductOrderPage() {
  const products = await getAdminProductOrder();
  return <div className="admin-page product-order-page">
    <div className="admin-page-head"><div><Link href="/admin/san-pham" className="back-link"><ArrowLeft/> Quay lại sản phẩm</Link><span>Trang sản phẩm</span><h1>Sắp xếp hiển thị</h1><p>Thay đổi vị trí các sản phẩm đã xuất bản trên trang dành cho khách hàng.</p></div></div>
    <section className="admin-card product-order-card"><ProductOrderEditor products={products.map(({id,name,code,categoryName})=>({id,name,code,categoryName}))}/></section>
  </div>;
}
