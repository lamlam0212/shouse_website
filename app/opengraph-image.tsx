import { ImageResponse } from "next/og";

export const alt = "S HOUSE — Giải pháp thiết bị điện";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    <div style={{display:"flex",width:"100%",height:"100%",padding:"72px 82px",color:"#17251b",background:"linear-gradient(135deg,#ffffff 0%,#f2f7ee 58%,#dbead4 100%)",fontFamily:"Arial, sans-serif"}}>
      <div style={{display:"flex",flexDirection:"column",justifyContent:"space-between",width:"100%"}}>
        <div style={{display:"flex",alignItems:"center",gap:18,fontSize:34,fontWeight:800,letterSpacing:".08em",color:"#24632B"}}><span style={{display:"flex",alignItems:"center",justifyContent:"center",width:70,height:70,color:"white",background:"#24632B",borderRadius:18}}>S</span>S HOUSE</div>
        <div style={{display:"flex",flexDirection:"column",gap:24,maxWidth:900}}><div style={{display:"flex",flexDirection:"column",fontSize:76,fontWeight:800,lineHeight:1.05,letterSpacing:"-.04em"}}><span>Giải pháp thiết bị điện</span><span style={{color:"#5B963B"}}>rõ ràng và đáng tin cậy</span></div><div style={{fontSize:28,color:"#536055"}}>Khám phá sản phẩm và nhận tư vấn phù hợp với nhu cầu thực tế.</div></div>
        <div style={{display:"flex",alignItems:"center",gap:12,fontSize:20,color:"#24632B"}}><span style={{width:54,height:4,background:"#5B963B",borderRadius:99}}/>S HOUSE</div>
      </div>
    </div>,
    size,
  );
}
