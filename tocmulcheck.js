'use strict'
/* check the correctness of mula pointer in nanchuan toc by using pts page number*/
const {openDB,parseCAP}=require('pengine');
const {PTSInRange}=require('../cs0/ptsvolpg');
const NCptsvolpg=require('./ptsvolpg');
const cs0m=openDB('cs0m');
const nc=openDB('cbeta0nanchuan');
console.log('nc toc',nc.toc.length,'mul toc',cs0m.toc.length);


const getptsrange_y=x0y_pts=>{ //return pts range from mulx0y structure
    const ptsrange=[];
    for (let x0 in x0y_pts){
        for (let y in x0y_pts[x0]) {
            ptsrange.push(x0y_pts[x0][y]);
        }
    }
    while (ptsrange.length>2) ptsrange.splice(1,1); //just keep head and tail
    return ptsrange;
}
const getptsrange=x0_pts=>{ //return pts range from mulx0 structure (no y)
    let ptsrange=[];
    for (let x0 in x0_pts) {
        ptsrange.push(x0_pts[x0]);
    }
    ptsrange=ptsrange.flat();
    while (ptsrange.length>2) ptsrange.splice(1,1);
    return ptsrange;
}
const maxcount=100000;
let count=0;
for (let bk in nc.toc.mula){
    // if (bk!=='vv') continue;
    for (let i=0;i<nc.toc.mula[bk].bk0.length-1;i++) {
        const maddr=bk+'_x'+nc.toc.mula[bk].bk0[i];
        const naddr=bk+'_x'+nc.toc.mula[bk].bk0[i+1];
        const toci=nc.toc.mula[bk].idx[i];
        const cap=parseCAP(maddr,cs0m);
        const cap2=parseCAP(naddr,cs0m);
        const x0y_pts=PTSInRange(cs0m,cap.x0,cap2.x0-cap.x0);
        const ptsrange=getptsrange_y(x0y_pts);
        const nccap=parseCAP(nc.toc[toci].l,nc);
        const nexttoci=nc.toc.mula[bk].idx[i+1];
        const nccap2=parseCAP(nc.toc[nexttoci].l,nc);
        const ncpts=NCptsvolpg.PTSInRange(nc,nccap.x0,nccap2.x0-nccap.x0);
        const ncptsrange=getptsrange(ncpts);

        if (ncptsrange.length&&ptsrange.length&&ncptsrange.join(',')!==ptsrange.join(',')) {
            console.log(ncptsrange , nc.toc[toci].l,nc.toc[toci].t, ptsrange,maddr)
        }
    }
    if (count>maxcount) break;
}