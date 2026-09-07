import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { LoginForm } from "@/components/admin/login-form";
import { Logo } from "@/components/logo";
import { getAdmin } from "@/lib/auth";
import { redirect } from "next/navigation";
export default async function LoginPage(){if(await getAdmin())redirect("/admin");return <div className="admin-login"><div className="login-brand"><div><Logo/><h1>Quản lý website<br/>gọn gàng, an toàn.</h1><p>Khu vực dành riêng cho quản trị viên S HOUSE.</p><div className="login-security"><ShieldCheck/><span>Phiên đăng nhập và quyền quản trị được kiểm tra ở server và trong database.</span></div></div></div><div className="login-form-wrap"><div className="login-card"><Link href="/" className="back-link"><ArrowLeft/> Về website</Link><span className="section-kicker">S HOUSE ADMIN</span><h2>Đăng nhập quản trị</h2><p>Không có chức năng đăng ký công khai.</p><LoginForm/></div></div></div>}
