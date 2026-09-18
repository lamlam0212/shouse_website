import Link from "next/link";
import { ArrowUpDown, Plus, Search } from "lucide-react";
import { ProductActions } from "@/components/admin/product-actions";
import { ProductPriceEditor } from "@/components/admin/product-price-editor";
import { ProductTransfer } from "@/components/admin/product-transfer";
import { getAdminProductsPage, type AdminProductStatus } from "@/lib/queries";

type Params = { deleted?: string; error?: string; storage_cleanup?: string; q?: string; status?: string; trang?: string };

function pageHref(page: number, search: string, status: AdminProductStatus) {
  const params = new URLSearchParams();
  if (search) params.set("q", search);
  if (status !== "all") params.set("status", status);
  if (page > 1) params.set("trang", String(page));
  const query = params.toString();
  return query ? `/admin/san-pham?${query}` : "/admin/san-pham";
}

export default async function AdminProducts({ searchParams }: { searchParams: Promise<Params> }) {
  const params = await searchParams;
  const search = (params.q || "").trim().slice(0, 80);
  const status: AdminProductStatus = ["draft", "published", "hidden"].includes(params.status || "") ? params.status as AdminProductStatus : "all";
  const requestedPage = Number.parseInt(params.trang || "1", 10);
  const result = await getAdminProductsPage({ search, status, page: Number.isFinite(requestedPage) ? requestedPage : 1 });

  return <div className="admin-page">
    <div className="admin-page-head"><div><span>Quản lý nội dung</span><h1>Sản phẩm</h1><p>{result.total} sản phẩm phù hợp với bộ lọc hiện tại.</p></div><div className="admin-page-actions"><Link href="/admin/san-pham/sap-xep" className="button button-secondary"><ArrowUpDown/> Sắp xếp hiển thị</Link><Link href="/admin/san-pham/moi" className="button button-primary"><Plus/> Thêm sản phẩm</Link></div></div>
    {params.deleted&&<p className="form-success">Đã xóa vĩnh viễn sản phẩm và dữ liệu liên quan.</p>}
    {params.storage_cleanup&&<p className="form-error">Sản phẩm đã xóa nhưng có file Storage chưa dọn được. Hãy kiểm tra bucket product-assets.</p>}
    {params.error&&<p className="form-error">Không thể xóa sản phẩm. Vui lòng tải lại trang và thử lại.</p>}
    <ProductTransfer/>
    <div className="admin-card">
      <form className="admin-toolbar" method="get"><label><Search/><input name="q" defaultValue={search} placeholder="Tìm theo tên hoặc mã..." maxLength={80}/></label><select name="status" defaultValue={status}><option value="all">Tất cả trạng thái</option><option value="published">Đã xuất bản</option><option value="draft">Bản nháp</option><option value="hidden">Đã ẩn</option></select><button className="button button-secondary" type="submit">Lọc</button></form>
      <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Tên sản phẩm</th><th>Danh mục</th><th>Giá</th><th>Trạng thái</th><th></th></tr></thead><tbody>{result.items.map(product=><tr key={product.id}><td><strong>{product.name}</strong><small>{product.code}</small></td><td>{product.categoryName}</td><td><ProductPriceEditor key={`${product.id}:${product.price}`} id={product.id} name={product.name} price={product.price ?? null}/></td><td><span className={`status ${product.status}`}>{product.status==="published"?"Đã xuất bản":product.status==="draft"?"Bản nháp":"Đã ẩn"}</span></td><td><ProductActions id={product.id} slug={product.slug} status={product.status}/></td></tr>)}{!result.items.length&&<tr><td colSpan={5}>Không tìm thấy sản phẩm phù hợp.</td></tr>}</tbody></table></div>
    </div>
    {result.totalPages>1&&<nav className="admin-pagination" aria-label="Phân trang sản phẩm">{Array.from({length:result.totalPages},(_,index)=>index+1).map(number=><Link className={number===result.page?"active":""} href={pageHref(number,search,status)} key={number} aria-current={number===result.page?"page":undefined}>{number}</Link>)}</nav>}
  </div>;
}
