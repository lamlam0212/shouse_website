export function parseCsv(input:string){
  const rows:string[][]=[];let row:string[]=[];let cell="";let quoted=false;
  const text=input.replace(/^\uFEFF/,"");
  for(let index=0;index<text.length;index+=1){const char=text[index];
    if(quoted){if(char==='"'&&text[index+1]==='"'){cell+='"';index+=1}else if(char==='"'){quoted=false}else{cell+=char}continue}
    if(char==='"'){quoted=true}else if(char===','){row.push(cell);cell=""}else if(char==='\n'){row.push(cell.replace(/\r$/, ""));rows.push(row);row=[];cell=""}else{cell+=char}
  }
  if(cell||row.length){row.push(cell.replace(/\r$/, ""));rows.push(row)}
  if(quoted)throw new Error("File CSV có dấu ngoặc kép chưa đóng.");
  return rows.filter(item=>item.some(value=>value.trim()));
}

export function stringifyCsv(rows:(string|number|boolean|null|undefined)[][]){
  return rows.map(row=>row.map(value=>{
    let cell=String(value??"");
    if(/^[=+\-@]/.test(cell))cell=`'${cell}`;
    return /[",\r\n]/.test(cell)?`"${cell.replace(/"/g,'""')}"`:cell;
  }).join(",")).join("\r\n")+"\r\n";
}
