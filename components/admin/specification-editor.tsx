import { Plus, Trash2 } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import type { ProductSpec } from "@/lib/models";

export function SpecificationEditor({ specs, setSpecs, onDirty }: { specs: ProductSpec[]; setSpecs: Dispatch<SetStateAction<ProductSpec[]>>; onDirty: () => void }) {
  const update = (index: number, patch: Partial<ProductSpec>) => {
    setSpecs(items => items.map((item, position) => position === index ? { ...item, ...patch, unit: "" } : item));
    onDirty();
  };
  const remove = (index: number) => {
    setSpecs(items => items.filter((_, position) => position !== index));
    onDirty();
  };
  const add = () => {
    setSpecs(items => [...items, { name: "", value: "", unit: "" }]);
    onDirty();
  };

  return <section className="admin-card form-card spec-card">
    <div className="card-head spec-card-head"><div><span className="section-kicker">Dữ liệu sản phẩm</span><h2>Thông số kỹ thuật tham khảo</h2><p>Nhập tên thông số và toàn bộ nội dung cần hiển thị trong cột chi tiết.</p></div><button type="button" className="button button-secondary spec-add-button" onClick={add}><Plus/> Thêm dòng</button></div>
    <div className="spec-editor" role="table" aria-label="Thông số kỹ thuật">
      <div className="spec-editor-header" role="row"><strong role="columnheader">Thông số</strong><strong role="columnheader">Chi tiết</strong><span aria-hidden="true"/></div>
      <div className="spec-editor-body" role="rowgroup">{specs.map((spec,index)=><div className="spec-editor-row" role="row" key={spec.id||index}><label role="cell"><span>Thông số</span><input aria-label={`Tên thông số dòng ${index+1}`} placeholder="Ví dụ: Điện áp định mức" value={spec.name} onChange={event=>update(index,{name:event.target.value})}/></label><label className="spec-detail-inputs" role="cell"><span>Chi tiết</span><input aria-label={`Chi tiết thông số dòng ${index+1}`} placeholder="Ví dụ: 220V AC – 50Hz" value={spec.value} onChange={event=>update(index,{value:event.target.value})}/></label><button className="spec-delete-button" type="button" aria-label={`Xóa thông số dòng ${index+1}`} title="Xóa dòng" onClick={()=>remove(index)}><Trash2/></button></div>)}</div>
    </div>
  </section>;
}
