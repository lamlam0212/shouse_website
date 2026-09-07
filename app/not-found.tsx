import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";
export default function NotFound(){return <section className="not-found"><div><span className="not-found-code">404</span><SearchX/><h1>Không tìm thấy trang</h1><p>Đường dẫn có thể đã thay đổi hoặc nội dung không còn tồn tại.</p><Link href="/" className="button button-primary"><ArrowLeft size={18}/> Về trang chủ</Link></div></section>}
