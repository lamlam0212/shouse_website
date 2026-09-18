"use client";

import { Check, Info, Plus, RefreshCw, ShieldCheck, Trash2, X } from "lucide-react";
import { useState } from "react";
import type { SiteSettings } from "@/lib/models";
import { parseWarrantyEditorContent, serializeWarrantyEditorContent, type WarrantyEditorContent } from "@/lib/warranty-editor-content";

type ListField = "highlights" | "coveredItems" | "excludedItems";

export function WarrantyContentEditor({ settings }: { settings: SiteSettings }) {
  const [introOpen, setIntroOpen] = useState(() => Boolean(parseWarrantyEditorContent(settings.about).intro));
  const [content, setContent] = useState<WarrantyEditorContent>(() => {
    const parsed = parseWarrantyEditorContent(settings.about);
    return {
      ...parsed,
      highlights: parsed.highlights.length ? parsed.highlights : [""],
      coveredItems: parsed.coveredItems.length ? parsed.coveredItems : [""],
      excludedItems: parsed.excludedItems.length ? parsed.excludedItems : [""],
    };
  });

  function changeField(field: "intro" | "coveredNote" | "excludedNote", value: string) {
    setContent((current) => ({ ...current, [field]: value }));
  }

  function changeItem(field: ListField, index: number, value: string) {
    setContent((current) => ({
      ...current,
      [field]: current[field].map((item, itemIndex) => itemIndex === index ? value : item),
    }));
  }

  function addItem(field: ListField) {
    const limit = field === "highlights" ? 2 : 20;
    setContent((current) => current[field].length >= limit ? current : { ...current, [field]: [...current[field], ""] });
  }

  function removeItem(field: ListField, index: number) {
    setContent((current) => ({ ...current, [field]: current[field].filter((_, itemIndex) => itemIndex !== index) }));
  }

  const characterCount = serializeWarrantyEditorContent({
    ...content,
    highlights: content.highlights.filter((item) => item.trim()),
    coveredItems: content.coveredItems.filter((item) => item.trim()),
    excludedItems: content.excludedItems.filter((item) => item.trim()),
  }).length;

  function renderItems(field: ListField, label: string, numbered: boolean) {
    return <div className="warranty-admin-items">
      {content[field].map((item, index) => <div className="warranty-admin-item" key={`${field}-${index}`}>
        <span className="warranty-admin-item-badge" aria-hidden="true">{numbered ? index + 1 : index === 0 ? <ShieldCheck size={18}/> : <RefreshCw size={18}/>}</span>
        <textarea name={field} value={item} maxLength={400} rows={2} aria-label={`${label} ${index + 1}`} placeholder={numbered ? "Nhập một trường hợp…" : "Nhập một thông tin tóm tắt…"} onChange={(event) => changeItem(field, index, event.target.value)}/>
        <button type="button" className="warranty-admin-remove" aria-label={`Xóa ${label.toLowerCase()} ${index + 1}`} title="Xóa dòng" onClick={() => removeItem(field, index)}><Trash2 size={17}/></button>
      </div>)}
      <button type="button" className="warranty-admin-add" disabled={content[field].length >= (field === "highlights" ? 2 : 20)} onClick={() => addItem(field)}><Plus size={17}/> {numbered ? "Thêm trường hợp" : "Thêm thẻ"}</button>
    </div>;
  }

  return <>
    <div className="about-settings-fields warranty-admin-overview">
      <input type="hidden" name="warrantyMode" value="structured"/>
      <div className="field"><label htmlFor="aboutKicker">Nhãn nhỏ</label><input id="aboutKicker" name="aboutKicker" required maxLength={80} defaultValue={settings.aboutKicker}/></div>
      <div className="field"><label htmlFor="aboutTitle">Tiêu đề lớn</label><input id="aboutTitle" name="aboutTitle" required maxLength={180} defaultValue={settings.aboutTitle}/></div>
      <div className="warranty-admin-panel">
        <div className="warranty-admin-panel-heading"><span>01</span><div><h3>Thông tin phía trên</h3><p>Hiển thị cạnh ảnh sản phẩm.</p></div></div>
        <div className="field"><label>Hai thẻ tóm tắt cạnh ảnh</label><small>Thẻ đầu nói về thời hạn/tem bảo hành; thẻ sau nói về hình thức bảo hành. Nhập ngắn gọn, không cần dấu đầu dòng.</small>{renderItems("highlights", "Thẻ tóm tắt", false)}</div>
        <details className="warranty-admin-extra" open={introOpen} onToggle={(event) => setIntroOpen(event.currentTarget.open)}><summary>Đoạn dẫn bổ sung (tùy chọn)</summary><div className="field"><label htmlFor="warrantyIntro">Nội dung hiển thị trước hai thẻ</label><textarea id="warrantyIntro" name="warrantyIntro" maxLength={500} rows={2} value={content.intro} placeholder="Để trống nếu muốn bố cục giống mẫu." onChange={(event) => changeField("intro", event.target.value)}/></div></details>
      </div>
      <div className="security-hint"><Info/><p><strong>Lưu ý nội dung</strong><span>Chỉ công bố điều khoản, thông số và cam kết đã được xác nhận. Không cần nhập tiêu đề nhóm hay số thứ tự.</span></p></div>
    </div>
    <div className="warranty-admin-cases">
      <div className="warranty-admin-section-head"><div><span>Dữ liệu chính sách</span><h3>Các trường hợp bảo hành</h3><p>Hai nhóm dưới đây sẽ hiển thị thành hai khối riêng trên trang chủ.</p></div><span className={characterCount > 3000 ? "warranty-admin-count over-limit" : "warranty-admin-count"}>{characterCount}/3000 ký tự</span></div>
      <div className="warranty-admin-case-grid">
        <section className="warranty-admin-case warranty-admin-case--covered" aria-labelledby="covered-heading">
          <div className="warranty-admin-case-title"><span><Check size={20}/></span><h4 id="covered-heading">Các trường hợp được bảo hành</h4></div>
          <div className="field"><label htmlFor="warrantyCoveredNote">Ghi chú đầu nhóm (tùy chọn)</label><textarea id="warrantyCoveredNote" name="warrantyCoveredNote" maxLength={600} rows={2} value={content.coveredNote} onChange={(event) => changeField("coveredNote", event.target.value)}/></div>
          {renderItems("coveredItems", "Trường hợp được bảo hành", true)}
        </section>
        <section className="warranty-admin-case warranty-admin-case--excluded" aria-labelledby="excluded-heading">
          <div className="warranty-admin-case-title"><span><X size={20}/></span><h4 id="excluded-heading">Các trường hợp không được bảo hành</h4></div>
          <div className="field"><label htmlFor="warrantyExcludedNote">Ghi chú đầu nhóm (tùy chọn)</label><textarea id="warrantyExcludedNote" name="warrantyExcludedNote" maxLength={600} rows={2} value={content.excludedNote} onChange={(event) => changeField("excludedNote", event.target.value)}/></div>
          {renderItems("excludedItems", "Trường hợp không được bảo hành", true)}
        </section>
      </div>
      {characterCount > 3000 && <p className="form-error" role="alert">Nội dung vượt giới hạn 3000 ký tự. Hãy rút gọn trước khi lưu.</p>}
    </div>
  </>;
}
