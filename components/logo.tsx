import Image from "next/image";
import Link from "next/link";
import defaultLogo from "@/reference/logo-shouse.png";

export function Logo({ admin = false, logoUrl }: { admin?: boolean; logoUrl?: string }) {
  return (
    <Link href={admin ? "/admin" : "/"} className="logo" aria-label={admin ? "Quản trị S HOUSE" : "Trang chủ S HOUSE"}>
      <Image src={logoUrl || defaultLogo} alt="S HOUSE" width={189} height={106} loading="eager" unoptimized={logoUrl?.startsWith("http")} />
      {admin && <span>Quản trị</span>}
    </Link>
  );
}
