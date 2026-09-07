import { Activity } from "lucide-react";
import { getAuditLogs } from "@/lib/queries";

const actions={created:"đã tạo",updated:"đã chỉnh sửa",published:"đã xuất bản",hidden:"đã ẩn",deleted:"đã xóa",restored:"đã khôi phục",duplicated:"đã nhân bản"};
const entities={product:"Sản phẩm",category:"Danh mục",site_settings:"Cài đặt"};
export default async function AuditPage(){const logs=await getAuditLogs();return <div className="admin-page"><div className="admin-page-head"><div><span>Kiểm soát thay đổi</span><h1>Nhật ký hoạt động</h1><p>100 thao tác quản trị gần nhất, được ghi trực tiếp trong database.</p></div></div><div className="admin-card audit-list">{logs.map(log=><div key={log.id}><i><Activity/></i><div><p><strong>{log.actorName||"Hệ thống"}</strong> {actions[log.action]} <b>{log.entityLabel||entities[log.entityType]}</b></p><small>{entities[log.entityType]} · {new Intl.DateTimeFormat("vi-VN",{dateStyle:"medium",timeStyle:"short"}).format(new Date(log.createdAt))}</small></div></div>)}{!logs.length&&<p className="empty-admin-state">Chưa có hoạt động nào được ghi nhận.</p>}</div></div>}
