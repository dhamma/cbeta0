'use strict'
const {readFileSync,writeFileSync}=require('fs');
const { openDBX } = require("pengine");
const { unique1 } = require('pengine/arrutil');

const lines=readFileSync('nc/addvoc.txt','utf8').split(/\r?\n/)
// lines.length=3;
const db=openDBX('cbeta0nc');
//色究竟天 色,究竟,天
//舍衛國
// const res=db.findWord({tofind:"比丘"});
const out=[];
for (let i=0;i<lines.length;i++) {
    if (i%256==0) process.stdout.write('\r'+i+'/'+lines.length+'   '); 
    const items=lines[i].split(/[\t\,]/);
    const tofind=(items.length>1?items[1]:items[0]).trim();
    if (!tofind) continue;
    const res=db.findWord({tofind});
    if (!res) throw 'error '+i+' '+lines[i]
    else  {
        if (res.words.length==0) {
            console.log('no result',tofind);
        } else {
            out.push([res.words[0].hit,tofind]);
        }
    }
}
const out2=unique1(out);
// out2.sort((a,b)=>b[0]-a[0]);

writeFileSync('newvoc.txt',out2.join('\n'),'utf8');