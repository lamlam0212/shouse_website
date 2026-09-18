"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState, useTransition, type FormEvent } from "react";
import { updateProductPrice } from "@/app/admin/actions/products";
import { formatPrice } from "@/lib/models";

export function ProductPriceEditor({ id, name, price }: { id: string; name: string; price: number | null }) {
  const [currentPrice, setCurrentPrice] = useState(price);
  const [value, setValue] = useState(price == null ? "" : String(price));
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function cancel() {
    setValue(currentPrice == null ? "" : String(currentPrice));
    setError("");
    setEditing(false);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const result = await updateProductPrice(id, value);
        if (result.error) {
          setError(result.error);
          return;
        }
        setCurrentPrice(value.trim() === "" ? null : Number(value));
        setEditing(false);
      } catch {
        setError("Không thể kết nối để lưu giá. Vui lòng thử lại.");
      }
    });
  }

  return <div className="product-price-editor">
    {editing ? <form onSubmit={save} className="product-price-form">
      <label className="sr-only" htmlFor={`price-${id}`}>Giá sản phẩm {name}, đơn vị đồng</label>
      <input id={`price-${id}`} autoFocus type="number" inputMode="decimal" min="0" max="999999999999.99" step="0.01" value={value} onChange={event => setValue(event.target.value)} disabled={pending} placeholder="Liên hệ báo giá" title="Để trống nếu sản phẩm không hiển thị giá" />
      <button type="submit" disabled={pending} aria-label={`Lưu giá ${name}`} title="Lưu giá"><Check aria-hidden="true" /></button>
      <button type="button" disabled={pending} onClick={cancel} aria-label={`Hủy sửa giá ${name}`} title="Hủy"><X aria-hidden="true" /></button>
    </form> : <button type="button" className="product-price-trigger" onClick={() => { setError(""); setEditing(true); }} aria-label={`Sửa giá ${name}: ${formatPrice(currentPrice ?? undefined)}`} title="Nhấn để sửa giá">
      <span>{formatPrice(currentPrice ?? undefined)}</span><Pencil aria-hidden="true" />
    </button>}
    {error && <span className="product-price-error" role="alert">{error}</span>}
  </div>;
}
