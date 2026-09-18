import Image from "next/image";
import { Check, Headphones, Home, MessageCircle, Phone, RefreshCw, ShieldCheck, X } from "lucide-react";
import { RichDescription } from "@/components/rich-description";
import { splitWarrantyContent } from "@/lib/format-about-content";
import { parseWarrantyEditorContent } from "@/lib/warranty-editor-content";
import type { SiteSettings } from "@/lib/models";

export function WarrantySection({ settings }: { settings: SiteSettings }) {
  const policyContent = settings.about || "Thông tin chính sách đang được cập nhật.";
  const { groups } = splitWarrantyContent(policyContent);
  const { intro, highlights, coveredItems, excludedItems } = parseWarrantyEditorContent(policyContent);
  const phone = settings.hotline.replace(/[^\d+]/g, "");
  const zalo = settings.zalo.replace(/\D/g, "");
  const showSupport = groups.length === 2
    && groups.some((group) => group.kind === "covered")
    && groups.some((group) => group.kind === "excluded")
    && excludedItems.length - coveredItems.length >= 2
    && Boolean(phone || zalo);

  return (
    <section className="section section-soft warranty-section" id="gioi-thieu">
      <div className="container">
        <div className="warranty-intro">
          <div className={`warranty-media about-visual${settings.aboutImageUrl ? " has-image" : ""}`}>
            {settings.aboutImageUrl ? (
              <Image
                src={settings.aboutImageUrl}
                alt="Hình ảnh sản phẩm S HOUSE trong khu vực chính sách bảo hành"
                fill
                sizes="(max-width: 900px) 100vw, 48vw"
              />
            ) : (
              <>
                <div className="about-pattern" />
                <div className="about-house"><Home /></div>
                <div className="about-card"><strong>S HOUSE</strong><span>{settings.aboutTitle}</span></div>
              </>
            )}
          </div>
          <div className={`warranty-overview${intro ? " has-note" : ""}`}>
            <svg className="warranty-overview-leaves" viewBox="0 0 160 170" fill="none" aria-hidden="true" focusable="false">
              <path d="M91 118C91 69 105 26 151 8C145 53 126 92 91 118Z" fill="currentColor" />
              <path d="M88 119C54 115 31 93 23 62C57 69 79 85 88 119Z" fill="currentColor" />
              <path d="M97 150C114 126 134 113 158 111C151 139 132 154 97 150Z" fill="currentColor" />
            </svg>
            <span className="section-kicker">{settings.aboutKicker}</span>
            <h2>{settings.aboutTitle}</h2>
            {intro && <div className="warranty-overview-note"><RichDescription content={intro} separateLines /></div>}
            {highlights.length > 0 && <div className="warranty-summary-cards">
              {highlights.map((highlight, index) => <div className="warranty-summary-card" key={`${index}-${highlight}`}>
                <span className="warranty-summary-icon" aria-hidden="true">{index === 0 ? <ShieldCheck /> : <RefreshCw />}</span>
                <RichDescription content={highlight} separateLines />
              </div>)}
            </div>}
          </div>
        </div>

        {groups.length > 0 && (
          <div className={`warranty-policy-grid${showSupport ? " with-support" : ""}`}>
            {groups.map((group, index) => (
              <article className={`warranty-policy-card warranty-policy-card--${group.kind}`} key={`${group.title}-${index}`}>
                <header>
                  <span className="warranty-policy-icon" aria-hidden="true">
                    {group.kind === "covered" ? <Check /> : <X />}
                  </span>
                  <h3>{group.title}</h3>
                </header>
                {group.content && <RichDescription content={group.content} separateLines />}
              </article>
            ))}
            {showSupport && <aside className="warranty-support" aria-label="Hỗ trợ về chính sách bảo hành">
              <div className="warranty-support-heading"><span className="warranty-support-icon" aria-hidden="true"><Headphones /></span><div><span>Hỗ trợ trực tiếp</span><h3>Chưa rõ trường hợp của bạn?</h3></div></div>
              <p>Liên hệ S HOUSE để được tư vấn về trường hợp cụ thể.</p>
              <div className="warranty-support-actions">
                {phone && <a className="warranty-support-call" href={`tel:${phone}`}><Phone size={18} /> Gọi hotline</a>}
                {zalo && <a className="warranty-support-zalo" href={`https://zalo.me/${zalo}`} target="_blank" rel="noreferrer"><MessageCircle size={18} /> Nhắn Zalo</a>}
              </div>
            </aside>}
          </div>
        )}
      </div>
    </section>
  );
}
