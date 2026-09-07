"use client";
import Image from "next/image";
import { ImageUp,Save,Trash2 } from "lucide-react";
import { useActionState, useEffect, useId, useState, type ChangeEvent } from "react";
import { deleteCategory, saveCategory } from "@/app/admin/actions/categories";
import type { ActionState } from "@/app/admin/actions/types";
import type { Category } from "@/lib/models";
import { slugifyVietnamese } from "@/lib/slugify";
const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maxCategoryImageSize = 3 * 1024 * 1024;

function CategoryForm({category,productCount=0}:{category?:Category;productCount?:number}) {
  const [state,action,pending]=useActionState(saveCategory,{} as ActionState);
  const inputId=useId();
  const [previewUrl,setPreviewUrl]=useState<string>();
  const [fileName,setFileName]=useState("");
  const [fileError,setFileError]=useState("");
  const [name,setName]=useState(category?.name||"");
  const [slug,setSlug]=useState(category?.slug||"");
  const [slugManual,setSlugManual]=useState(Boolean(category));

  useEffect(()=>()=>{if(previewUrl)URL.revokeObjectURL(previewUrl)},[previewUrl]);

  function handleImageChange(event:ChangeEvent<HTMLInputElement>){
    const file=event.target.files?.[0];
    if(previewUrl)URL.revokeObjectURL(previewUrl);
    setPreviewUrl(undefined);setFileName("");setFileError("");
    if(!file)return;
    if(!acceptedImageTypes.includes(file.type)){event.target.value="";setFileError("Ảnh phải là JPG, PNG hoặc WebP.");return}
    if(file.size>maxCategoryImageSize){event.target.value="";setFileError("Ảnh danh mục tối đa 3 MB.");return}
    setFileName(file.name);setPreviewUrl(URL.createObjectURL(file));
  }

  const displayedImage=previewUrl||category?.imageUrl;
  return <form action={action} className="category-editor">
    <input type="hidden" name="id" value={category?.id||""}/>
    <div className="field"><label>Tên danh mục</label><input name="name" required maxLength={100} value={name} onChange={event=>{const value=event.target.value;setName(value);if(!slugManual)setSlug(slugifyVietnamese(value))}}/></div>
    <div className="field"><label>Slug</label><input name="slug" required pattern="[a-z0-9]+(?:-[a-z0-9]+)*" value={slug} onChange={event=>{setSlug(slugifyVietnamese(event.target.value));setSlugManual(Boolean(event.target.value))}}/><small>Tự tạo từ tên danh mục.</small></div>
    <div className="field category-description"><label>Mô tả</label><input name="description" defaultValue={category?.description}/></div>
    <div className="field order-field"><label>Thứ tự</label><input name="sortOrder" type="number" min="0" defaultValue={category?.sortOrder||0}/></div>
    <label className="check-field"><input name="isActive" type="checkbox" defaultChecked={category?.isActive??true}/> Hiển thị</label>
    <div className="category-image-field">
      <div className="category-image-preview">{displayedImage?<Image src={displayedImage} alt={`Ảnh danh mục ${category?.name||"mới"}`} width={96} height={96} unoptimized/>:<span>Chưa có ảnh</span>}</div>
      <div className="category-image-picker">
        <label htmlFor={inputId} className="button button-secondary"><ImageUp/> {category?.imagePath?"Thay ảnh":"Chọn ảnh"}</label>
        <input id={inputId} name="image" type="file" accept="image/jpeg,image/png,image/webp" onChange={handleImageChange}/>
        <small className={fileName?"selected-file":undefined}>{fileName||"JPG, PNG hoặc WebP · tối đa 3 MB"}</small>
        {fileError&&<small className="file-error" role="alert">{fileError}</small>}
      </div>
    </div>
    <div className="category-actions">
      <button type="submit" className="button button-primary" disabled={pending||Boolean(fileError)}><Save/> {pending?"Đang lưu...":"Lưu"}</button>
      {category&&<button type="submit" formAction={deleteCategory} className="button button-danger" disabled={pending||productCount>0} title={productCount>0?`Danh mục đang có ${productCount} sản phẩm`:"Xóa danh mục"} aria-label={`Xóa danh mục ${category.name}`} onClick={e=>{if(!confirm("Xóa vĩnh viễn danh mục này?"))e.preventDefault()}}><Trash2/></button>}
    </div>
    {category&&<p className="category-usage">{productCount>0?`${productCount} sản phẩm đang sử dụng danh mục này`:"Danh mục trống — có thể xóa"}</p>}
    {state.error&&<p className="form-error">{state.error}</p>}{state.success&&<p className="form-success">{state.success}</p>}
  </form>
}
export function CategoryManager({categories,productCounts}:{categories:Category[];productCounts:Record<string,number>}){return <div className="category-manager"><div className="admin-card form-card"><h2>Thêm danh mục</h2><CategoryForm/></div>{categories.map(category=><div className="admin-card form-card" key={category.id}><h2>{category.name}</h2><CategoryForm category={category} productCount={productCounts[category.id]||0}/></div>)}</div>}
