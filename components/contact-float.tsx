import { MessageCircle, Phone } from "lucide-react";
import type { SiteSettings } from "@/lib/models";

export function ContactFloat({ settings }: { settings: SiteSettings }) {
  const phone=settings.hotline.replace(/\s/g,""); const zalo=settings.zalo.replace(/\s/g,"");
  if(!phone&&!zalo)return null;
  return <div className="contact-float" aria-label="Liên hệ nhanh">{zalo&&<a href={`https://zalo.me/${zalo}`} target="_blank" rel="noreferrer" className="zalo"><MessageCircle/><span>Zalo</span></a>}{phone&&<a href={`tel:${phone}`} className="call"><Phone/><span>Gọi ngay</span></a>}</div>;
}
