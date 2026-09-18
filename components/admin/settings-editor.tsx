"use client";
import Image from "next/image";
import { ImageUp,MapPin,MessageCircle,Phone,Save } from "lucide-react";
import { useActionState, useEffect, useState, type ChangeEvent } from "react";
import { saveSettings, useDefaultLogo } from "@/app/admin/actions/settings";
import type { ActionState } from "@/app/admin/actions/types";
import type { SiteSettings } from "@/lib/models";
import { WarrantyContentEditor } from "@/components/admin/warranty-content-editor";
import defaultLogo from "@/reference/logo-shouse.png";
export function SettingsEditor({settings}:{settings:SiteSettings}){
  const[state,action,pending]=useActionState(saveSettings,{} as ActionState);
  const[heroPreview,setHeroPreview]=useState<string>();
  const[heroFileName,setHeroFileName]=useState("");
  const[heroError,setHeroError]=useState("");
  const[aboutPreview,setAboutPreview]=useState<string>();
  const[aboutFileName,setAboutFileName]=useState("");
  const[aboutImageError,setAboutImageError]=useState("");
  useEffect(()=>()=>{if(heroPreview)URL.revokeObjectURL(heroPreview)},[heroPreview]);
  useEffect(()=>()=>{if(aboutPreview)URL.revokeObjectURL(aboutPreview)},[aboutPreview]);
  function selectHeroImage(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];if(heroPreview)URL.revokeObjectURL(heroPreview);setHeroPreview(undefined);setHeroFileName("");setHeroError("");if(!file)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){event.target.value="";setHeroError("Ảnh phải là JPG, PNG hoặc WebP.");return}
    if(file.size>5*1024*1024){event.target.value="";setHeroError("Ảnh trang chủ tối đa 5 MB.");return}
    setHeroFileName(file.name);setHeroPreview(URL.createObjectURL(file));
  }
  function selectAboutImage(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];if(aboutPreview)URL.revokeObjectURL(aboutPreview);setAboutPreview(undefined);setAboutFileName("");setAboutImageError("");if(!file)return;
    if(!["image/jpeg","image/png","image/webp"].includes(file.type)){event.target.value="";setAboutImageError("Ảnh phải là JPG, PNG hoặc WebP.");return}
    if(file.size>5*1024*1024){event.target.value="";setAboutImageError("Ảnh giới thiệu tối đa 5 MB.");return}
    setAboutFileName(file.name);setAboutPreview(URL.createObjectURL(file));
  }
  const displayedHero=heroPreview||settings.heroImageUrl;
  const displayedAboutImage=aboutPreview||settings.aboutImageUrl;
  return <form action={action}>
    <div className="admin-page-head"><div><span>Cấu hình chung</span><h1>Cài đặt website</h1><p>Cập nhật nhận diện, nội dung và thông tin liên hệ toàn website.</p></div><button className="button button-primary" disabled={pending||Boolean(heroError)||Boolean(aboutImageError)}><Save/> {pending?"Đang lưu...":"Lưu thay đổi"}</button></div>
    {state.error&&<p className="form-error">{state.error}</p>}{state.success&&<p className="form-success">{state.success}</p>}
    <div className="settings-grid">
      <div className="admin-card form-card"><h2>Logo & nhận diện</h2><div className="logo-preview"><Image src={settings.logoUrl||defaultLogo} alt="Logo S HOUSE hiện tại" width={284} height={160} unoptimized={Boolean(settings.logoUrl)}/></div><div className="logo-actions"><label className="button button-secondary file-button"><ImageUp/> Thay logo<input name="logo" type="file" accept="image/jpeg,image/png,image/webp"/></label>{settings.logoPath&&<button type="submit" formAction={useDefaultLogo} className="button button-secondary" onClick={event=>{if(!confirm("Dùng logo PNG mới trong thư mục reference?"))event.preventDefault()}}>Dùng logo mặc định mới</button>}</div><p className="field-help">Giữ nguyên tỷ lệ và màu logo. Nền trong suốt được hỗ trợ với PNG hoặc WebP, tối đa 2 MB.</p></div>
      <div className="admin-card form-card"><h2>Thông tin liên hệ</h2><div className="field icon-field"><label htmlFor="hotline">Hotline</label><span><Phone/><input id="hotline" name="hotline" maxLength={30} defaultValue={settings.hotline}/></span></div><div className="field icon-field"><label htmlFor="zalo">Số Zalo</label><span><MessageCircle/><input id="zalo" name="zalo" maxLength={30} defaultValue={settings.zalo}/></span></div><div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={settings.email}/></div><div className="field icon-field"><label htmlFor="address">Địa chỉ</label><span><MapPin/><input id="address" name="address" maxLength={300} defaultValue={settings.address}/></span></div></div>
      <div className="admin-card form-card settings-hero">
        <div className="card-head"><div><h2>Khu vực đầu trang</h2><p>Chỉnh ảnh và toàn bộ nội dung nổi bật đầu tiên khách hàng nhìn thấy.</p></div></div>
        <div className="hero-settings-grid">
          <div className="hero-settings-media">
            <div className="hero-settings-preview">{displayedHero?<Image src={displayedHero} alt="Ảnh lớn trang chủ S HOUSE" fill sizes="(max-width: 760px) 100vw, 45vw" unoptimized/>:<div><ImageUp/><strong>Chưa có ảnh riêng</strong><span>Trang chủ sẽ dùng ảnh sản phẩm nổi bật đầu tiên.</span></div>}</div>
            <div className="hero-settings-actions"><label className="button button-secondary file-button"><ImageUp/> {settings.heroImagePath?"Thay ảnh":"Chọn ảnh"}<input name="heroImage" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectHeroImage}/></label>{settings.heroImagePath&&<label className="check-field"><input name="removeHero" type="checkbox" disabled={Boolean(heroPreview)}/> Xóa ảnh hiện tại</label>}</div>
            <p className="field-help">Nên dùng ảnh ngang rõ nét, JPG/PNG/WebP, tối đa 5 MB. {heroFileName&&<strong>Đã chọn: {heroFileName}</strong>}</p>{heroError&&<p className="form-error" role="alert">{heroError}</p>}
          </div>
          <div className="hero-settings-fields">
            <div className="field"><label htmlFor="heroKicker">Nhãn nhỏ</label><input id="heroKicker" name="heroKicker" required maxLength={80} defaultValue={settings.heroKicker}/></div>
            <div className="two-fields"><div className="field"><label htmlFor="heroTitle">Tiêu đề chữ đen</label><input id="heroTitle" name="heroTitle" required maxLength={120} defaultValue={settings.heroTitle}/></div><div className="field"><label htmlFor="heroHighlight">Tiêu đề chữ xanh</label><input id="heroHighlight" name="heroHighlight" required maxLength={100} defaultValue={settings.heroHighlight}/></div></div>
            <div className="field"><label htmlFor="heroDescription">Đoạn giới thiệu</label><textarea id="heroDescription" name="heroDescription" required maxLength={500} rows={4} defaultValue={settings.heroDescription}/></div>
            <div className="two-fields"><div className="field"><label htmlFor="heroPrimaryLabel">Chữ nút sản phẩm</label><input id="heroPrimaryLabel" name="heroPrimaryLabel" required maxLength={60} defaultValue={settings.heroPrimaryLabel}/></div><div className="field"><label htmlFor="heroSecondaryLabel">Chữ nút liên hệ</label><input id="heroSecondaryLabel" name="heroSecondaryLabel" required maxLength={60} defaultValue={settings.heroSecondaryLabel}/></div></div>
            <div className="field"><label>Ba lợi ích phía dưới</label><div className="hero-trust-editors">{settings.heroTrustItems.slice(0,3).map((item,index)=><div key={index}><span>{index+1}</span><input name="heroTrustItem" required maxLength={80} aria-label={`Lợi ích đầu trang ${index+1}`} defaultValue={item}/></div>)}</div></div>
            <div className="two-fields"><div className="field"><label htmlFor="heroCardTitle">Tiêu đề thẻ trên ảnh</label><input id="heroCardTitle" name="heroCardTitle" required maxLength={80} defaultValue={settings.heroCardTitle}/></div><div className="field"><label htmlFor="heroCardDescription">Mô tả thẻ trên ảnh</label><input id="heroCardDescription" name="heroCardDescription" required maxLength={180} defaultValue={settings.heroCardDescription}/></div></div>
          </div>
        </div>
      </div>
      <div className="admin-card form-card settings-about">
        <div className="card-head"><div><h2>Chính sách mua hàng và bảo hành</h2><p>Chỉnh ảnh và nội dung chính sách hiển thị trên trang chủ.</p></div></div>
        <div className="about-settings-grid">
          <div className="about-settings-media">
            <div className="about-settings-preview">{displayedAboutImage?<Image src={displayedAboutImage} alt="Ảnh giới thiệu S HOUSE" fill sizes="(max-width: 760px) 100vw, 42vw" unoptimized/>:<div><ImageUp/><strong>Chưa có ảnh giới thiệu</strong><span>Trang chủ sẽ dùng nền minh họa mặc định.</span></div>}</div>
            <div className="hero-settings-actions"><label className="button button-secondary file-button"><ImageUp/> {settings.aboutImagePath?"Thay ảnh":"Chọn ảnh"}<input name="aboutImage" type="file" accept="image/jpeg,image/png,image/webp" onChange={selectAboutImage}/></label>{settings.aboutImagePath&&<label className="check-field"><input name="removeAboutImage" type="checkbox" disabled={Boolean(aboutPreview)}/> Xóa ảnh hiện tại</label>}</div>
            <p className="field-help">Nên dùng ảnh dọc hoặc vuông, JPG/PNG/WebP, tối đa 5 MB. {aboutFileName&&<strong>Đã chọn: {aboutFileName}</strong>}</p>
            {aboutImageError&&<p className="form-error" role="alert">{aboutImageError}</p>}
          </div>
          <WarrantyContentEditor key={settings.about} settings={settings}/>
        </div>
      </div>
    </div>
  </form>
}
