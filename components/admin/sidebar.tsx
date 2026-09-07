"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Activity, Boxes, FolderTree, LayoutDashboard, LogOut, Menu, Settings, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "@/components/logo";
import { logout } from "@/app/admin/actions/auth";

const links=[{href:"/admin",label:"Tổng quan",icon:LayoutDashboard},{href:"/admin/san-pham",label:"Sản phẩm",icon:Boxes},{href:"/admin/danh-muc",label:"Danh mục",icon:FolderTree},{href:"/admin/nhat-ky",label:"Nhật ký hoạt động",icon:Activity},{href:"/admin/cai-dat",label:"Cài đặt website",icon:Settings}];
export function AdminSidebar({name,email,logoUrl}:{name:string;email:string;logoUrl?:string}){const pathname=usePathname();const[open,setOpen]=useState(false);return <><button className="admin-menu" onClick={()=>setOpen(!open)}>{open?<X/>:<Menu/>}<span>Menu quản trị</span></button><aside className={`admin-sidebar ${open?"open":""}`}><Logo admin logoUrl={logoUrl}/><div className="admin-user"><span>AD</span><div><strong>{name}</strong><small>{email}</small></div></div><nav>{links.map(item=>{const Icon=item.icon;const active=item.href==="/admin"?pathname===item.href:pathname.startsWith(item.href);return <Link href={item.href} key={item.href} className={active?"active":""} onClick={()=>setOpen(false)}><Icon/>{item.label}</Link>})}</nav><form action={logout}><button className="admin-logout"><LogOut/> Đăng xuất</button></form></aside></>}
