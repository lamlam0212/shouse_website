"use client";
import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/lib/models";
import { ProductVisual } from "./product-visual";

export function ProductGallery({product}:{product:Product}){
 const images=product.images.filter(image=>image.url);const [selected,setSelected]=useState(()=>Math.max(0,images.findIndex(image=>image.isCover)));
 if(!images.length)return <div className="gallery"><ProductVisual tone={product.tone} label={product.name}/></div>;
 const current=images[Math.min(selected,images.length-1)];
 return <div className="gallery"><div className="gallery-main"><Image src={current.url!} alt={current.altText||product.name} width={1000} height={800} sizes="(max-width: 900px) calc(100vw - 28px), 50vw" loading="eager"/>{images.length>1&&<span className="gallery-count">{selected+1} / {images.length}</span>}</div>{images.length>1&&<div className="gallery-thumbs">{images.map((image,index)=><button key={image.id} className={selected===index?"active":""} onClick={()=>setSelected(index)} aria-label={`Xem ảnh ${index+1}`}><Image src={image.url!} alt={image.altText||`${product.name} - ảnh ${index+1}`} width={240} height={180} sizes="(max-width: 600px) 30vw, 160px"/><span>Ảnh {index+1}</span></button>)}</div>}</div>
}
