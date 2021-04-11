'use strict'
const pat=/([a-z\d]+),(\d+)/
const {openDB,parseCAP}=require('pengine');
const {unpackvolpg}=require('pengine/pts')
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
                if (!out[arr[i]]) out[arr[i]]={};
                out[arr[i]][0]=bk+','+i; //y=0,只指到行開頭, 
            };
        }
    }
    return out;
}
module.exports={parsePTS,PTSInRange}