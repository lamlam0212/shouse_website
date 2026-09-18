export type Category = { id:string; name:string; slug:string; description:string; imagePath?:string; imageUrl?:string; sortOrder:number; isActive:boolean };
export type ProductSpec = { id?:string; name:string; value:string; unit?:string; sortOrder?:number };
export type ProductImage = { id:string; storagePath:string; url?:string; altText:string; sortOrder:number; isCover:boolean };
export type Product = {
  id:string; name:string; code:string; slug:string; categoryId:string; category:string; categoryName:string;
  shortDescription:string; description:string; price?:number; status:"published"|"draft"|"hidden";
  featured:boolean; tone:"green"|"dark"|"light"|"red"; specs:ProductSpec[]; images:ProductImage[];
  pdfPath?:string; pdfUrl?:string; createdAt?:string; displayOrder:number;
};
export type ProductVersion = { id:string; productId:string; versionNumber:number; changeType:"update"|"status"|"image"|"restore"; createdBy?:string; createdByName?:string; createdAt:string };
export type AuditLog = { id:number; entityType:"product"|"category"|"site_settings"; entityId?:string; entityLabel:string; action:"created"|"updated"|"published"|"hidden"|"deleted"|"restored"|"duplicated"; actorId?:string; actorName?:string; createdAt:string };
export type AboutFeature = { title:string; description:string };
export const defaultAboutFeatures:AboutFeature[]=[
  {title:"Sản phẩm trình bày trực quan",description:"Ảnh lớn, thông số dạng bảng và tài liệu tải về khi có."},
  {title:"Tư vấn thuận tiện",description:"Hotline và Zalo hiển thị thuận tiện trên mọi thiết bị."},
  {title:"Nội dung có kiểm soát",description:"Thông tin được quản lý tập trung bởi S HOUSE."},
];
export const defaultHeroTrustItems=["Thông tin rõ ràng","Hỗ trợ trực tiếp","Tài liệu dễ tra cứu"];
export type SiteSettings = { logoPath?:string; logoUrl?:string; heroImagePath?:string; heroImageUrl?:string; heroKicker:string; heroTitle:string; heroHighlight:string; heroDescription:string; heroPrimaryLabel:string; heroSecondaryLabel:string; heroCardTitle:string; heroCardDescription:string; heroTrustItems:string[]; aboutImagePath?:string; aboutImageUrl?:string; hotline:string; zalo:string; address:string; email:string; about:string; aboutKicker:string; aboutTitle:string; aboutFeatures:AboutFeature[]; aboutCtaLabel:string };
export const emptySiteSettings:SiteSettings={hotline:"",zalo:"",address:"",email:"",heroKicker:"Giải pháp thiết bị điện hiện đại",heroTitle:"An tâm hơn cho",heroHighlight:"mỗi mái nhà.",heroDescription:"S HOUSE giới thiệu các giải pháp bộ chống giật với thông tin trực quan, dễ tìm hiểu và đội ngũ sẵn sàng tư vấn.",heroPrimaryLabel:"Khám phá sản phẩm",heroSecondaryLabel:"Liên hệ tư vấn",heroCardTitle:"S HOUSE",heroCardDescription:"Giải pháp thiết bị điện cho không gian hiện đại",heroTrustItems:defaultHeroTrustItems,about:"",aboutKicker:"Về S HOUSE",aboutTitle:"Thông tin vừa đủ để bạn dễ dàng lựa chọn",aboutFeatures:defaultAboutFeatures,aboutCtaLabel:"Tìm hiểu sản phẩm"};
export const formatPrice=(price?:number)=>price!=null?`${new Intl.NumberFormat("vi-VN").format(price)} ₫`:"Liên hệ báo giá";
