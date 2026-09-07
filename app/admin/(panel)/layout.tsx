import { AdminSidebar } from "@/components/admin/sidebar";
import { requireAdmin } from "@/lib/auth";
import { getSiteSettings } from "@/lib/queries";
export default async function AdminPanelLayout({children}:{children:React.ReactNode}){const[admin,settings]=await Promise.all([requireAdmin(),getSiteSettings(true)]);return <div className="admin-shell"><AdminSidebar name={admin.profile.display_name||"Quản trị viên"} email={admin.user.email||""} logoUrl={settings.logoUrl}/><div className="admin-main">{children}</div></div>}
