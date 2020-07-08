const fs=require("fs");
const set="nanchuan";
let rawfn=set+"-raw.txt"
const raw=fs.readFileSync(rawfn,"utf8").split(/\r?\n/);

const {build,writeExtra}=require("dengine");

build({name:set,outdir:set+"/", textonly:true, 
	withtoc:true,withxref:true,continuouspage:true , fields:["chi","notes"] },raw);

const rawxref=fs.readFileSync(set+"-pts.txt","utf8").split(/\r?\n/);
const ptsvolname=require("./ptsvolname");
const {SEGSEP,LEVELSEP}=require("dengine");
const Name={};

REGEXP1=/^(\d+):(\d+).(\d+),(\S+)\.(\d+)\.(\d+)/ //see gen-nanchuan.js 
REGEXP2=/^(\d+):(\d+).(\d+),(\S+)(\.)(\d+)/

let lastv, lastptsv,lastptsp;
const xref=[];
rawxref.forEach(item=>{
	let m=item.match(REGEXP1);
	if (!m) m=item.match(REGEXP2);
	if (!m) throw "error item "+item;

	let v=parseInt(m[1]),p=parseInt(m[2]),l=parseInt(m[3]);
	let bk=m[4],bkn=parseInt(m[5]),ptsp=parseInt(m[6]);
	if (isNaN(bkn))bkn=1; //bk has only one volumn

	if (!ptsvolname[bk]) throw "error name "+bk;
	if (ptsvolname[bk]==-1) return;

	const ptsv       =     Math.floor(ptsvolname[bk]);
	const ptsv_start =     Math.round((ptsvolname[bk]-ptsv)*10000);

	ptsp-=ptsv_start;

	let pts_v=ptsv+(bkn-1);

	let nanchuan='',pts='';
	if (lastv!==v) {
		nanchuan=v+SEGSEP+p+LEVELSEP+l;
	}else nanchuan=p+LEVELSEP+l;

	if (lastptsv!==pts_v){
		pts=pts_v+SEGSEP+ptsp;
	} else {
		if (ptsp-1!=lastptsp) {
			pts=ptsp;
		} else {
			pts="";//incremental
		}
	}
	xref.push(nanchuan+(pts?("="+pts):""));

	lastptsp=ptsp;
	lastptsv=pts_v;
	lastv=v;
})
writeExtra(set+"/"+set+".xref.js",{name:set,type:"xref",target:"mul"},xref);