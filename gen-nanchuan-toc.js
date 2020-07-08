const fs=require("fs");
const folder="/CBReader2X/Bookcase/CBETA/toc/N/"; //copy from CBReaderX/toc/N
const Sax=require("sax");
const set='nanchuan';
const genlst=(bookcount)=>{
	let out=[];
	for (let n=1;n<=bookcount;n++) {
		let fn="000"+n;
		fn="N"+fn.substr(fn.length-4,4);
		out.push(folder+fn+".xml");
	}
	return out
}
const inserts={
	'1:1':'律藏',
	'6:1':'長部',	'9:1':'中部',	'13:1':'相應部',	'19:1':'增支部',
	'26:1':'-1小部\n26:1,2小誦經','26:13':'法句經','26:57':'自說經','26:173':'如是語',
	'27:1':'經集','27:322':'天宮事經',	'28:1':'餓鬼事經',
	'29:1':'譬喻經',	'31:1':'本生經',	'43:1':'無礙解道',	'44:164':'佛種性經',
	'44:266':'所行藏經',	'45:1':'大義釋','47:1':'小義釋',
	'48:1':'-1論藏\n48:1,2法集論',
	'49:1':'分別論','50:187':'界論',
	'50:329':'人施設論',
	'51:1':'雙論',
	'54:1':'發趣論','61:1':'論事',
	'63:1':'彌蘭王問經','65:1':'島王統史','66:1':'小王統史','67:1':'清淨道論',
	'70:1':'一切善見律註序','70:107':'攝阿毘達磨義論','70:195':'阿育王刻文'


}

const out=['1:1,0南傳大藏經'];
const linkexp=/N(\d\d)n\d+_\d+\.xml#p(\d+)a(\d+)/
let deeper=0;
const dofile=fn=>{
	const content=fs.readFileSync(fn,"utf8");
	const tagstack=[];
	let textpiece='';
	let lastvol=-1;
	
	const onopentag=function(e){
		tagstack.push(e);
	}
	const onclosetag=function(name){
		let e=tagstack.pop();
		if (name=="cblink") {
			let link=e.attributes.href;
			let m=link.match(linkexp);
			let depth=2+(tagstack.length-5)/2;
			const vol=parseInt(m[1]);
			let id=vol+":"+parseInt(m[2])+"."+parseInt(m[3]);
			let pagenum=vol+":"+parseInt(m[2]);
			if (pagenum=="26:1") deeper=1;
			if (inserts[pagenum]) {
				let ins=inserts[pagenum];
				const d=parseInt(ins)?parseInt(ins):0;
				if (d) {
					ins=ins.substr( d.toString().length);
				};
				if (ins) out.push(pagenum+","+(1+d+deeper)+ins);
				inserts[pagenum]=null;
			}
			out.push(id+","+(depth+deeper)+textpiece.trim());
			textpiece='';
			lastvol=vol;
		}
	}
	const ontext=function(t){
		textpiece+=t;
	}

	var parser=Sax.parser(true);
	parser.onopentag=onopentag;
	parser.onclosetag=onclosetag;
	parser.ontext=ontext;
	parser.write(content);
}
genlst(38).forEach(dofile);
const {writeExtra}=require("pengine");

writeExtra(set+"/"+set+".toc.js",
	{"name":"cbeta0"+set,"type":"toc","field":["txt"]},out);