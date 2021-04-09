'use strict'
const pat=/([a-z\d]+),(\d+)/
const {openDB,bsearch,parseCAP}=require('pengine');
let prevbk='';
const unpackvolpg=(db,str)=>{ //unpack to x0 for faster match
    const arr=str.split(','), out=[];
    let prevx0=0;
    for (let i=0;i<arr.length;i++) {
        let addr=arr[i];
        const at=addr.indexOf('_');
        if (at>0) {
            prevbk=addr.substr(0,at);
        } else {
            addr=prevbk+'_'+addr;
        }
        const cap=parseCAP(addr,db);
        if (!cap && i) {
            console.log('unable to parse addr',addr)
        }
        out.push(cap?cap.x0: prevx0); //empty slot are fill with nearest x0
        prevx0=cap?cap.x0:prevx0; 
    }
    return out;
}
const parsePTS=pts=>{
    const m=pts.match(pat);
    if (!m) {
        console.log("invalid pts ",pts);
        return;
    }
    const bk=m[1], page=parseInt(m[2]);
	const db=openDB("cbeta0nanchuan");
	const ptsvolpg=db.getAsset('pts');
	if (!ptsvolpg) {
		throw "not pts mapping in db"
		return;
	}
    if (typeof ptsvolpg[bk]=='string') ptsvolpg[bk]=unpackvolpg(db,ptsvolpg[bk]);
    const x0=ptsvolpg[bk][page];
    return parseCAP(x0,db);
}
const PTSInRange=(db,x0,w)=>{
    const ptsvolpg=db.getAsset('pts');
    const out={};
    for (let bk in ptsvolpg) {
        if (typeof ptsvolpg[bk]=='string') {
            ptsvolpg[bk]=unpackvolpg(db,ptsvolpg[bk]);
        }
        const arr=ptsvolpg[bk];

        if (arr[1]-10>x0)continue; // 有時差幾行才是第一筆，如 dn1
        if (x0>arr[arr.length-1])continue;
        for (let i=1;i<arr.length;i++) { //i==0 always zero
            if (arr[i]>=x0 && arr[i]<x0+w) {
                if (!out[arr[i]]) out[arr[i]]=[];
                out[arr[i]].push(bk+','+i);
            };
        }
    }
    return out;
}
module.exports={parsePTS,PTSInRange}