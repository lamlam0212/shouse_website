import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ContactFloat } from "@/components/contact-float";
import { JsonLd } from "@/components/json-ld";
import { WebVitals } from "@/components/web-vitals";
import { getSiteSettings } from "@/lib/queries";
import { absoluteSiteUrl, getSiteUrl } from "@/lib/site-url";
import defaultLogo from "@/reference/logo-shouse.png";

const manrope = Manrope({
  subsets: ["vietnamese"],
  weight: "variable",
  display: "swap",
  variable: "--font-manrope",
  fallback: ["Segoe UI", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: { default: "S HOUSE | Giải pháp thiết bị điện", template: "%s | S HOUSE" },
  description: "Website giới thiệu sản phẩm bộ chống giật S HOUSE.",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "S HOUSE",
    title: "S HOUSE | Giải pháp thiết bị điện",
    description: "Khám phá sản phẩm và giải pháp thiết bị điện từ S HOUSE.",
    url: "/",
    images: [{ url: "/opengraph-image", width: 1200, height: 630, alt: "S HOUSE — Giải pháp thiết bị điện" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "S HOUSE | Giải pháp thiết bị điện",
    description: "Khám phá sản phẩm và giải pháp thiết bị điện từ S HOUSE.",
    images: ["/opengraph-image"],
  },
  icons: {
    icon: [{ url: defaultLogo.src, type: "image/png" }],
    shortcut: [{ url: defaultLogo.src, type: "image/png" }],
    apple: [{ url: defaultLogo.src, type: "image/png" }],
  },
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const settings=await getSiteSettings();
  const organization={"@context":"https://schema.org","@type":"Organization",name:"S HOUSE",url:getSiteUrl().toString(),logo:absoluteSiteUrl(defaultLogo.src),email:settings.email||undefined,address:settings.address||undefined,contactPoint:settings.hotline?{"@type":"ContactPoint",telephone:settings.hotline,contactType:"customer service",availableLanguage:"Vietnamese"}:undefined};
  return <html lang="vi" className={manrope.variable} data-scroll-behavior="smooth"><body><JsonLd data={organization}/><Header settings={settings}/><main>{children}</main><Footer settings={settings}/><ContactFloat settings={settings}/><WebVitals/></body></html>;
}
