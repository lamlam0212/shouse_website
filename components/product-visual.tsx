import { Zap } from "lucide-react";

export function ProductVisual({ tone = "green", label = "S HOUSE", compact = false }: { tone?: "green" | "dark" | "light" | "red"; label?: string; compact?: boolean }) {
  return (
    <div className={`product-visual tone-${tone} ${compact ? "compact" : ""}`} role="img" aria-label={`Ảnh minh họa ${label}`}>
      <div className="device-shadow" />
      <div className="device">
        <div className="device-top"><span>S</span><small>HOUSE</small></div>
        <div className="device-line" />
        <div className="device-switch"><i /><b>ON</b></div>
        <div className="device-detail"><Zap size={14} /><span>PROTECTION</span></div>
        <div className="device-label">CHƯA CÓ ẢNH</div>
      </div>
      <div className="visual-grid" />
    </div>
  );
}
