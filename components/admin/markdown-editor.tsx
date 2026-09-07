"use client";

import { Bold, Heading2, Heading3, Link as LinkIcon, List, ListOrdered } from "lucide-react";
import { useRef, useState } from "react";

type Tool = { label:string; title:string; icon:typeof Bold; prefix:string; suffix?:string; line?:boolean };
const tools:Tool[] = [
  { label:"H2", title:"Tiêu đề lớn", icon:Heading2, prefix:"## ", line:true },
  { label:"H3", title:"Tiêu đề nhỏ", icon:Heading3, prefix:"### ", line:true },
  { label:"Đậm", title:"In đậm", icon:Bold, prefix:"**", suffix:"**" },
  { label:"Danh sách", title:"Danh sách dấu chấm", icon:List, prefix:"- ", line:true },
  { label:"Đánh số", title:"Danh sách đánh số", icon:ListOrdered, prefix:"1. ", line:true },
  { label:"Liên kết", title:"Chèn liên kết", icon:LinkIcon, prefix:"[", suffix:"](https://)" },
];

export function MarkdownEditor({ defaultValue = "", onDirty }: { defaultValue?:string;onDirty?:()=>void }) {
  const [value,setValue]=useState(defaultValue);
  const ref=useRef<HTMLTextAreaElement>(null);

  function apply(tool:Tool){
    const input=ref.current;if(!input)return;
    const start=input.selectionStart;const end=input.selectionEnd;
    const selected=value.slice(start,end)||"nội dung";
    const lineStart=tool.line?value.lastIndexOf("\n",Math.max(0,start-1))+1:start;
    const prefix=tool.prefix;const suffix=tool.suffix||"";
    const next=value.slice(0,lineStart)+prefix+value.slice(lineStart,start)+selected+suffix+value.slice(end);
    setValue(next);
    onDirty?.();
    requestAnimationFrame(()=>{input.focus();input.setSelectionRange(lineStart+prefix.length,end+prefix.length+suffix.length)});
  }

  return <div className="markdown-editor">
    <div className="markdown-toolbar" role="toolbar" aria-label="Định dạng mô tả">
      {tools.map(tool=>{const Icon=tool.icon;return <button key={tool.label} type="button" title={tool.title} onClick={()=>apply(tool)}><Icon/><span>{tool.label}</span></button>})}
    </div>
    <textarea ref={ref} id="description" name="description" rows={14} value={value} onChange={event=>{setValue(event.target.value);onDirty?.()}} placeholder={"Viết mô tả sản phẩm…\n\nDùng thanh công cụ để thêm tiêu đề, danh sách, chữ đậm và liên kết."}/>
    <small>Nội dung được lưu ở định dạng Markdown an toàn. Không nhập thông số hoặc chứng nhận chưa được xác minh.</small>
  </div>
}
