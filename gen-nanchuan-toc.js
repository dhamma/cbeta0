const fs=require("fs");
const folder="./cbeta-dvd/toc/"; //copy from CBReaderX/toc/N
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
	'1_1':'律藏',
	'6_1':'長部',	'9_1':'中部',	'13_1':'相應部',	'19_1':'增支部',
	'26_1':'-1小部\n26_1,2小誦經','26_13':'法句經','26_57':'自說經','26_173':'如是語',
	'27_1':'經集','27_322':'天宮事經',	'28_1':'餓鬼事經',
	'28_77':'長老偈經','28_239':'長老尼偈',
	'29_1':'譬喻經',	'31_1':'本生經',	'43_1':'無礙解道',	'44_164':'佛種性經',
	'44_266':'所行藏經',	'45_1':'大義釋','47_1':'小義釋',
	'48_1':'-1論藏\n48:1,2法集論',
	'49_1':'分別論','50_187':'界論',
	'50_329':'人施設論',
	'51_1':'雙論',
	'54_1':'發趣論','61_1':'論事',
	'63_1':'彌蘭王問經','65_1':'島王統史','66_1':'小王統史','67_1':'清淨道論',
	'70_1':'一切善見律註序','70_107':'攝阿毘達磨義論','70_195':'阿育王刻文'


}

const out=['1_1	0	南傳大藏經'];
const linkexp=/N(\d\d)n\d+_\d+\.xml#p(\d+)a(\d+)/
let deeper=0;
const dofile=fn=>{
	const content=fs.readFileSync(fn,"utf8");
	const tagstack=[];
	let textpiece='';
	let lastvol=-1;
	
	const onopentag=function(e){
	    	textpiece='';
		tagstack.push(e);
	}
	const onclosetag=function(name){
		let e=tagstack.pop();
		if (name=="cblink") {
			let link=e.attributes.href;
			let m=link.match(linkexp);
			let depth=2+(tagstack.length-5)/2;
			const vol=parseInt(m[1]);
			let id=vol+"_"+parseInt(m[2])+"x"+(parseInt(m[3])-1); //zero base
			let pagenum=vol+"_"+parseInt(m[2]);
			if (pagenum=="26_1") deeper=1;
			if (inserts[pagenum]) {
				let ins=inserts[pagenum];
				const d=parseInt(ins)?parseInt(ins):0;
				if (d) {
					ins=ins.substr( d.toString().length);
				};
				if (ins) out.push(pagenum+"\t"+(1+d+deeper)+ins+'\t');
				inserts[pagenum]=null;
			}
			out.push(id+"\t"+(depth+deeper)+"\t"+textpiece.trim()+'\t');
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
const {writeExtra}=require("pengine/builder");

writeExtra(set+"/"+set+".toc.orig.js",
	{"name":"cbeta0"+set,"type":"toc","field":["txt"]},out);