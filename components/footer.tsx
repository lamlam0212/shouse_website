import Link from "next/link";
import { ArrowUpRight, Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "./logo";
import type { SiteSettings } from "@/lib/models";

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="footer" id="lien-he">
      <span className="footer-glow" aria-hidden="true"/>
      <div className="container footer-grid">
        <div className="footer-brand"><Logo logoUrl={settings.logoUrl}/><p>{settings.about || "S HOUSE — giải pháp thiết bị điện được trình bày rõ ràng và dễ tiếp cận."}</p><span className="footer-brand-line">Giải pháp thiết bị điện</span></div>
        <nav className="footer-nav" aria-label="Điều hướng chân trang"><h3>Điều hướng</h3><Link href="/"><span>Trang chủ</span><ArrowUpRight/></Link><Link href="/san-pham"><span>Sản phẩm</span><ArrowUpRight/></Link><Link href="/#gioi-thieu"><span>Giới thiệu</span><ArrowUpRight/></Link><Link href="/admin/login"><span>Quản trị</span><ArrowUpRight/></Link></nav>
        <div className="footer-contact"><h3>Liên hệ</h3><div className="footer-contact-list">{settings.hotline&&<a href={`tel:${settings.hotline.replace(/\s/g,"")}`}><i><Phone/></i><span><small>Hotline</small>{settings.hotline}</span></a>}{settings.email&&<a href={`mailto:${settings.email}`}><i><Mail/></i><span><small>Email</small>{settings.email}</span></a>}{settings.address&&<div><i><MapPin/></i><span><small>Địa chỉ</small>{settings.address}</span></div>}{!settings.hotline&&!settings.email&&!settings.address&&<p>Thông tin liên hệ đang được cập nhật.</p>}</div></div>
      </div>
      <div className="container footer-bottom"><span>© {new Date().getFullYear()} S HOUSE. Bảo lưu mọi quyền.</span><span>Website giới thiệu sản phẩm S HOUSE</span></div>
    </footer>
  );
}
