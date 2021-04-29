'use strict';
//載入所有目錄，將 bk_x(bkx) 改為  bk_(pn)x(-n) 最接近的pn，減去1~2行，
//定址穩定，不因 x0 而改變。

const {readFileSync,writeFileSync}=require('fs');
const { parseCAP,  negXCAP} = require('pengine');

const toclines=readFileSync('nanchuan/nanchuan.toc.js','utf8').split(/\r?\n/);

const out=toclines.map(item=>{
    const fields=item.split('\t');
    const addr=fields[3];
    if (!addr) return item;
    const cap=parseCAP(addr,'cs0m');
    fields[3]=negXCAP(cap)||'';
    return fields.join('\t');
})
writeFileSync('nanchuan/nanchuan.toc-mx.js',out.join('\n'),'utf8');

