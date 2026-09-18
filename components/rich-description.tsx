import type { ReactNode } from "react";

const inlinePattern=/(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\)|https?:\/\/[^\s<>]+)/g;
function inline(text:string):ReactNode[]{
  return text.split(inlinePattern).filter(Boolean).map((part,index)=>{
    if(part.startsWith("**")&&part.endsWith("**"))return <strong key={index}>{part.slice(2,-2)}</strong>;
    const link=part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if(link){
      const href=/^(https?:\/\/|mailto:)/i.test(link[2])?link[2]:"#";
      return <a key={index} href={href} target={href.startsWith("http")?"_blank":undefined} rel={href.startsWith("http")?"noreferrer":undefined}>{link[1]}</a>;
    }
    if(/^https?:\/\//i.test(part)){
      let label=part;
      try{label=new URL(part).hostname.replace(/^www\./,"")}catch{}
      return <a className="raw-link" key={index} href={part} target="_blank" rel="noreferrer">Xem tại {label}<span aria-hidden="true">↗</span></a>;
    }
    return part;
  });
}

export function RichDescription({ content, separateLines = false }: { content:string; separateLines?:boolean }){
  const normalized=(content.trim()||"Nội dung đang được cập nhật.")
    .replace(/[ \t]+▪[ \t]+/g,"\n- ")
    .replace(/[ \t]+(?=🎁|👉)/g,"\n\n");
  const lines=normalized.split(/\r?\n/);
  const nodes:ReactNode[]=[];let index=0;
  while(index<lines.length){
    const line=lines[index].trim();
    if(!line){index+=1;continue}
    if(line.startsWith("### ")){nodes.push(<h3 key={index}>{inline(line.slice(4))}</h3>);index+=1;continue}
    if(line.startsWith("## ")){nodes.push(<h2 key={index}>{inline(line.slice(3))}</h2>);index+=1;continue}
    if(/^[-*] /.test(line)){
      const items:ReactNode[]=[];const key=index;
      while(index<lines.length&&/^[-*] /.test(lines[index].trim())){items.push(<li key={index}>{inline(lines[index].trim().slice(2))}</li>);index+=1}
      nodes.push(<ul key={key}>{items}</ul>);continue;
    }
    if(/^\d+\. /.test(line)){
      const items:ReactNode[]=[];const key=index;
      while(index<lines.length&&/^\d+\. /.test(lines[index].trim())){items.push(<li key={index}>{inline(lines[index].trim().replace(/^\d+\. /,""))}</li>);index+=1}
      nodes.push(<ol key={key}>{items}</ol>);continue;
    }
    const paragraph=[line];const key=index;index+=1;
    while(!separateLines&&index<lines.length&&lines[index].trim()&&!/^(#{2,3} |[-*] |\d+\. )/.test(lines[index].trim())){paragraph.push(lines[index].trim());index+=1}
    const paragraphText=paragraph.join(" ");
    const className=paragraphText.startsWith("🎁")?"description-highlight":paragraphText.startsWith("👉")?"description-cta":undefined;
    nodes.push(<p className={className} key={key}>{inline(paragraphText)}</p>);
  }
  return <div className="product-description">{nodes}</div>;
}
