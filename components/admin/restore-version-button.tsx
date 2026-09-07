"use client";

import { RotateCcw } from "lucide-react";
import { restoreProductVersion } from "@/app/admin/actions/product-history";

export function RestoreVersionButton({versionId,versionNumber}:{versionId:string;versionNumber:number}){return <form action={restoreProductVersion}><input type="hidden" name="versionId" value={versionId}/><button className="button button-secondary" onClick={event=>{if(!confirm(`Khôi phục phiên bản ${versionNumber}? Phiên bản hiện tại vẫn được sao lưu.`))event.preventDefault()}}><RotateCcw/> Khôi phục</button></form>}
