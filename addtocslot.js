'use strict'
const {readFileSync,writeFileSync}=require('fs');
const lines=readFileSync('csmap_mn.txt','utf8').split(/\r?\n/);

let ppn=0;
const out=[];
lines.forEach(line=>{
    const [nc,vri]=line.split('\t');
    const pn=parseInt(vri);
    const at=nc.indexOf('_');
    const vol=nc.substr(0,at);
    if (pn!==1 && pn>ppn+1) {
        for (let i=ppn+1;i<pn;i++) {
            out.push(vol+'_\t'+i);
        }
    }
    out.push(nc+'\t'+vri);
    ppn=pn;
})
writeFileSync('csmap_mn.ori.js',out.join('\n'),'utf8')