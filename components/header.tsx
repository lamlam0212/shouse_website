"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Phone, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./logo";
import type { SiteSettings } from "@/lib/models";

const nav = [
  { href: "/", label: "Trang chủ" },
  { href: "/san-pham", label: "Sản phẩm" },
  { href: "/#gioi-thieu", label: "Giới thiệu" },
  { href: "/#lien-he", label: "Liên hệ" },
];

export function Header({ settings }: { settings: SiteSettings }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <Logo logoUrl={settings.logoUrl} />
        <nav className={`main-nav ${open ? "open" : ""}`} aria-label="Điều hướng chính">
          {nav.map((item) => (
            <Link key={item.label} href={item.href} onClick={() => setOpen(false)} className={pathname === item.href ? "active" : ""}>{item.label}</Link>
          ))}
          {settings.hotline && <a className="button button-primary mobile-contact" href={`tel:${settings.hotline.replace(/\s/g, "")}`}><Phone size={17} /> Gọi tư vấn</a>}
        </nav>
        {settings.hotline && <a className="header-contact" href={`tel:${settings.hotline.replace(/\s/g, "")}`} aria-label={`Gọi hotline ${settings.hotline}`}><span className="header-contact-icon"><Phone/></span><span className="header-contact-copy"><small>Hotline</small><strong>{settings.hotline}</strong></span></a>}
        <button className="menu-button" onClick={() => setOpen(!open)} aria-label={open ? "Đóng menu" : "Mở menu"}>{open ? <X /> : <Menu />}</button>
      </div>
    </header>
  );
}
