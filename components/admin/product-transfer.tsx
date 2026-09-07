"use client";

import { Download,Upload } from "lucide-react";
import Link from "next/link";
import { useActionState } from "react";
import { importProductsCsv } from "@/app/admin/actions/product-import";
import type { ActionState } from "@/app/admin/actions/types";

export function ProductTransfer(){const[state,action,pending]=useActionState(importProductsCsv,{} as ActionState);return <div className="product-transfer admin-card">
  <div><strong>Nhập / xuất dữ liệu</strong><span>CSV hỗ trợ Excel; ảnh và PDF không nằm trong file xuất.</span></div>
  <div className="transfer-actions"><Link className="button button-secondary" href="/admin/san-pham/export"><Download/> Xuất CSV</Link><form action={action}><label className="button button-secondary"><Upload/> {pending?"Đang nhập…":"Nhập CSV"}<input type="file" name="csv" accept=".csv,text/csv" disabled={pending} onChange={event=>event.currentTarget.form?.requestSubmit()}/></label></form></div>
  {state.error&&<p className="form-error">{state.error}</p>}{state.success&&<p className="form-success">{state.success}</p>}
 </div>}
