import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/queries";
import { getSiteUrl } from "@/lib/site-url";
export default async function sitemap():Promise<MetadataRoute.Sitemap>{const base=getSiteUrl().origin;const products=await getProducts();return[{url:base,lastModified:new Date(),priority:1},{url:`${base}/san-pham`,lastModified:new Date(),priority:.8},...products.map(product=>({url:`${base}/san-pham/${product.slug}`,lastModified:new Date(product.createdAt||Date.now()),priority:.7}))]}
