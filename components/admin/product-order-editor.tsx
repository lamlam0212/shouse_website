"use client";

import { ArrowDown, ArrowUp, GripVertical, Save } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { reorderProducts } from "@/app/admin/actions/products";

type OrderItem = {
  id: string;
  name: string;
  code: string;
  categoryName: string;
};

export function ProductOrderEditor({ products }: { products: OrderItem[] }) {
  const [items, setItems] = useState(products);
  const [draggedId, setDraggedId] = useState<string>();
  const [dirty, setDirty] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string }>();
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return;
      event.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function move(from: number, to: number) {
    if (from === to || from < 0 || to < 0 || to >= items.length) return;
    setItems((current) => {
      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
    setDirty(true);
    setMessage(undefined);
  }

  function dropOn(targetId: string) {
    if (!draggedId) return;
    move(items.findIndex((item) => item.id === draggedId), items.findIndex((item) => item.id === targetId));
    setDraggedId(undefined);
  }

  function save() {
    startTransition(async () => {
      const result = await reorderProducts(items.map((item) => item.id));
      if (result.error) {
        setMessage({ type: "error", text: result.error });
        return;
      }
      setDirty(false);
      setMessage({ type: "success", text: result.success || "Đã lưu thứ tự." });
    });
  }

  return <>
    <div className="product-order-toolbar">
      <div><strong>Thứ tự từ trên xuống</strong><span>Kéo thả hoặc dùng nút mũi tên. Sản phẩm đầu tiên sẽ xuất hiện trước.</span></div>
      <button className="button button-primary" type="button" onClick={save} disabled={pending||!dirty}><Save/> {pending?"Đang lưu...":"Lưu thứ tự"}</button>
    </div>
    {message&&<p className={message.type==="success"?"form-success":"form-error"} role="status">{message.text}</p>}
    {items.length?<ol className="product-order-list">
      {items.map((product,index)=><li
        key={product.id}
        draggable={!pending}
        onDragStart={()=>setDraggedId(product.id)}
        onDragEnd={()=>setDraggedId(undefined)}
        onDragOver={(event)=>event.preventDefault()}
        onDrop={()=>dropOn(product.id)}
        className={draggedId===product.id?"dragging":""}
      >
        <span className="product-order-handle" aria-hidden="true"><GripVertical/></span>
        <span className="product-order-number">{index+1}</span>
        <span className="product-order-name"><strong>{product.name}</strong><small>{product.code} · {product.categoryName}</small></span>
        <span className="product-order-buttons">
          <button type="button" onClick={()=>move(index,index-1)} disabled={pending||index===0} aria-label={`Đưa ${product.name} lên`} title="Đưa lên"><ArrowUp/></button>
          <button type="button" onClick={()=>move(index,index+1)} disabled={pending||index===items.length-1} aria-label={`Đưa ${product.name} xuống`} title="Đưa xuống"><ArrowDown/></button>
        </span>
      </li>)}
    </ol>:<p className="empty-admin-state">Chưa có sản phẩm đã xuất bản để sắp xếp.</p>}
  </>;
}
