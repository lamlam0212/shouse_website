import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import type { Product } from "@/lib/models";
import { formatPrice } from "@/lib/models";
import { ProductVisual } from "./product-visual";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="product-card">
      <Link href={`/san-pham/${product.slug}`} className="product-image-link">{product.images[0]?.url?<Image className="real-product-image" src={product.images[0].url} alt={product.images[0].altText||product.name} width={760} height={540} sizes="(max-width: 600px) calc(100vw - 48px), (max-width: 900px) 45vw, 380px"/>:<ProductVisual tone={product.tone} label={product.name} compact/>}{product.featured&&<span className="featured-badge">Nổi bật</span>}</Link>
      <div className="product-card-body"><div className="product-meta-row"><span className="eyebrow">{product.categoryName}</span><span className="product-code-chip">{product.code}</span></div><h3><Link href={`/san-pham/${product.slug}`}>{product.name}</Link></h3><p>{product.shortDescription||"Thông tin sản phẩm đang được cập nhật."}</p><div className="product-card-bottom"><strong>{formatPrice(product.price)}</strong><Link className="round-link" href={`/san-pham/${product.slug}`} aria-label={`Xem ${product.name}`}><span>Chi tiết</span><ArrowRight /></Link></div></div>
    </article>
  );
}
