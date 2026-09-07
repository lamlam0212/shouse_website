import Link from "next/link";
import { ArrowLeft,History } from "lucide-react";
import { notFound } from "next/navigation";
import { RestoreVersionButton } from "@/components/admin/restore-version-button";
import { getAdminProduct,getProductVersions } from "@/lib/queries";

const labels={update:"Trước khi chỉnh sửa",status:"Trước khi đổi trạng thái",image:"Trước khi thay đổi ảnh",restore:"Trước khi khôi phục"};
export default async function ProductHistory({params}:{params:Promise<{id:string}>}){const{id}=await params;const[product,versions]=await Promise.all([getAdminProduct(id),getProductVersions(id)]);if(!product)notFound();return <div className="admin-page"><div className="admin-page-head"><div><Link href={`/admin/san-pham/${id}`} className="back-link"><ArrowLeft/> Quay lại sản phẩm</Link><span>Lịch sử chỉnh sửa</span><h1>{product.name}</h1><p>Mỗi phiên bản được tạo tự động trước khi dữ liệu thay đổi.</p></div></div><div className="admin-card history-list">{versions.map(version=><div key={version.id}><i><History/></i><div><strong>Phiên bản {version.versionNumber}</strong><span>{labels[version.changeType]}</span><small>{new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(version.createdAt))} · {version.createdByName||"Quản trị viên"}</small></div><RestoreVersionButton versionId={version.id} versionNumber={version.versionNumber}/></div>)}{!versions.length&&<p className="empty-admin-state">Chưa có phiên bản cũ. Lịch sử sẽ xuất hiện sau lần chỉnh sửa đầu tiên.</p>}</div></div>}
