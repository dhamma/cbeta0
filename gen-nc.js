'use strict';
const fs=require("fs");
const Sax=require("sax");
// const folder="../../CBReader2X/Bookcase/CBETA/XML/N/";
const fixerror=require('./errata');
const set=process.argv[2]||'nc' ;

const folder="cbeta-dvd/"+ {nc:'N',t:'T'}[set] +"/";
const allfiles=fs.readFileSync("./"+{nc:'nanchuan',t:'taisho'}[set]+".lst","utf8").split(/\r?\n/);

const NOTESEP='|||';
//var textbody=require("./textbody");
const files=allfiles;//.splice(56,34); 
//splice(56,34) DN 有段號，但有些大經分誦，重新算號
//splice(90,16) MN 中部無號

//files=allfiles;
// files.length=215;
const context={text:[],pts:[],mulu:[],headers:[],cnum:0,cnums:[],cnumwarning:[]};

const tounicodechar=str=>{
	if (str[0]!=="U")return '';
	let uni=parseInt('0x'+str.substr(2));
	if (uni<0xffff) {
		return String.fromCharCode(uni);
	} else {
		let U=uni-0x10000;
		return String.fromCharCode(0xd800+(U>>10),0xdc00+(U& 0x3ff));
	}
}

let in_l=false;
const makeParanum=xmlid=>{
	const m=xmlid.match(/(\d\d\d\d)([abc])(\d\d)(\d\d)?/);
	if (!m) throw 'invalid p xml:id'+xmlid;
	

	if (set=='nc') {
		return parseInt(m[1],10).toString()+String.fromCharCode(parseInt(m[3],10)+0x40);	
	} else if (set=='t') {
		return parseInt(m[1],10).toString()+(m[2]+(parseInt(m[3],10)).toString(36)).toUpperCase(); 
	}
}
const cnum={'一':'1','二':'2','三':'3','四':'4','五':'5',
'六':'6','七':'7','八':'8','九':'9','〇':'0','十':'1'};
const parseChiNum=str=>{
	let o='',f=0,s=str,floating=false;
	for (let i=0;i<str.length;i++){
		if (s[i] =='～') {
			floating=true;
			continue;
		}
		if (!cnum[s[i]]) return str;
		if (floating) {
			f=10*f+parseInt(cnum[s[i]])
		} else {
			if (!cnum[s[i]]) {
				// console.log(s[i],'not num')
			}
			o+=cnum[ s[i] ]||'';
		}
	}
	if (floating) { //一定比整數部大。不必前綴0
		o+='.'+f;
	}
	return parseFloat(o);
}
const tryCnum=(_t,vpn)=>{
	let t=_t;
	const at=_t.indexOf("|||");
	if (at>-1) {
		t=t.substr(0,at);
	}
	// const at=_t.match('〔原本無')
	if (t.length<10
		&&isNaN(t)
		&&t.indexOf('　')==-1
		&&t[0]!=='|'
		// &&linet.match(/[一二三四五六七八九十]/)
		&&parseChiNum(t)) {
		const cnum=parseChiNum(t);
		
		if (parseFloat(cnum)) {
			if (context.cnum+1!= Math.floor(cnum) &&Math.floor(cnum)!=1) {
				context.cnumwarning.push([vpn]);
				// console.log('not continous cnum',context.cnum,cnum,vpn)
			}
			if (parseInt(cnum) !== parseFloat(cnum)) {
				const int=parseInt(cnum)
				let end=(cnum-int).toFixed(3);
				while ( int >= Math.floor(end) ) end=end*10;
				context.cnum=Math.floor(end);
				// console.log(Math.floor(end))
			} else {
				context.cnum=parseInt(cnum);
			}
			return cnum.toString();	
		}
	}
	return _t;
}
var p5tojson=function(content,vol,file){
	let inbody=false,innote=false;
	let linetext='',notetext='',pagenum=0,
	lb_n='',// n of current lb
	mulu_n='', //n of mulu start
	p_n='', // n of current p
	ppn=''; // last output pn
	let notes={};
	var tagstack=[],gref='',textpiece='' ,replacechar={},drop=false;
	// if (vol!==9 && vol!==10) return;
	var onopentag=function(e){
		tagstack.push([e.name,JSON.stringify(e.attributes)]);
		if (tagstack.length==3 && e.name=="body") {
			inbody=true;
		} else if (e.name=="cb:div" ) {
			// if (tagstack.length==5 && e.attributes.type=="taisho-notes") {}
		} else if (e.name=="lb") {
			const m=e.attributes.n.match(/(\d\d\d\d)[abc](\d\d)/);
			if (!m) throw 'invalid lb n'+e.attributes.n
			lb_n=makeParanum(e.attributes.n);
		} else if (e.name=="pb"){
			pagenum=parseInt(e.attributes.n);
		} else if (e.name=="ref"){
			let ref=e.attributes.cRef;
			if (ref.substr(0,3)=="PTS")	linetext+='{'+ref+'}';
		} else if (e.name=="note") {
			innote=true;
			if (!e.attributes.n) return;
			if (e.attributes.type!=='orig')return;
			let n=e.attributes.n;
			if (n)linetext+='^'+n;
		} else if (e.name=="g") {
			let ref=e.attributes.ref.substr(1);
			if (replacechar[ref]) {
				linetext+=replacechar[ref];
			}

		} else if (e.name=='rdg'){
			drop=true;
		} else if (e.name=="char"){
			gref=e.attributes['xml:id'];
		} else if (e.name=="p" || e.name=='lg' ) {
			if (linetext) {
				emitPara(); //輸出第一個p之前，即目錄行的文字。
			}
			const pn=e.attributes['xml:id'];
			if (!pn)return;
			p_n=makeParanum(pn)
		} else if (e.name=='l') {
			linetext+='\t';
		    in_l=true;
		}
	}
	const emitPara=()=>{
		let linet=linetext;//breakText(linetext).replace(/\t+/g,'\n');
		linet=extractNote(linet).trim();
		if (linet) {
			const pn=mulu_n?mulu_n:p_n;
			const vpn=vol+'_'+pn;
			linet=extractRef(linet,vpn);
			
			if ( vpn=='6_41I') debugger;
			const r=tryCnum(linet,vpn);
			if (r!==linet) {
				context.cnums.push([vpn,r]);
				linetext=r+' ';
				return;
			}
			const header=(ppn==pn)?'':(vol+'_'+pn+'|');
			context.text.push(header+linet);
			if (header) {
				const padHeader= vol.toString().padStart(2,'0')+'_'+pn.padStart(4,'0');
				context.headers.push( padHeader);
			}
			ppn=pn;
			notes={};
			linetext='';
		}
		mulu_n='';
	}

	const extractNote=text=>{
		if (text.indexOf('^')>-1) { //replace note to offset
			let note='';
			text=text.split('\n').map(line=>{
				let noteptrlen=0;
				let t=line.replace(/\^(\d+)/g,(m,m1,off)=>{
					if (!notes[m1]) return ''; //deal with drop table in vol 52, note 0122013 and so on
					note+=(off - noteptrlen)+'^'+notes[m1]+' ';
					noteptrlen+=m.length;
					return '';
				})
				if (note) {
					if (!t) t="*";//若有注釋，本文不得為空 see 52_237H
					t+=NOTESEP+note;
					note='';
				}
				return t;
			}).join('\n');
		} 
		return text;
	}
	const extractRef=(text,vpn)=>{
		if (text.indexOf('{')==-1) return text;
		let out='',i=0,linecount=0;
		while (i<text.length) {
			const ch=text[i];
			if (ch=='\n') linecount++;
			else if (ch=='{') {
				let ref='';
				i++; //drop {}
				while (i<text.length&&text[i]!=='}') {
					ref+=text[i];
					i++;
				}
				if (text[i]!=='}') console.log('error ref',text)
				i++; //drop }
				if (ref.substr(0,3)=='PTS') {
					context.pts.push([vpn+(linecount?'x'+linecount:'')+','+ref.substr(4)]);
				}
			}
			out+=text[i]||'';
			i++;
		}
		return out.trim();
	}
	
	var onclosetag=function(name){
		const tagattributes=JSON.parse(tagstack[tagstack.length-1][1]);
		if (tagstack[tagstack[tagstack.length-1][0] != name]) {
			throw "unbalance tag"
		}
		if (name=="l"){
			in_l=false;
		}else if (name=="note"){
			innote=false;
			let nt=notetext.trim(); //some notes has crlf
			notetext='';
			if (!tagattributes.n) {
				return;
			}
			const type=tagattributes.type;
			
			if (type!=='orig')return;
			
			let n=tagattributes.n;
			if (notes[n]) console.log('repeated note id',file,paranum,n,notes[n]);
			notes[n]=nt;
		} else if (name=="p" || name=="lg") {
			emitPara();
		} else if (name=="mapping") {
			if (gref&&(tagattributes.type=="normal_unicode"||tagattributes.type=="unicode")){
				replacechar[gref]=tounicodechar(textpiece);
				// console.log(replacechar,gref)
				gref='';
			} else {
				if (tagattributes.type!=='PUA') console.log('unknown mapping',tagattributes,gref)
			}
		} else if (name=="rdg") { //drop rdg, use lem
			drop=false;
			textpiece='';
		} else if (name=="head") {
			//head innertext is redundant
			// linetext=linetext.substr( 0, linetext.length-textpiece.length);
		} else if (name=="cb:mulu") {
			const lv=tagattributes.level;
			context.mulu.push([lb_n+'\t'+lv+"@"+textpiece]);
			if (!mulu_n) mulu_n=lb_n; //record n of mulu line group
			linetext=linetext.substr( 0, linetext.length-textpiece.length);
			linetext+= String.fromCharCode(0x2460+ (parseInt(lv)-1));
			textpiece='';
		} else if (name=='body') {
			emitPara();
		}
		tagstack.pop();
	}

	var ontext=function(t){
		textpiece=t.replace(/\r?\n/g,'');
		if (!inbody)return;

		if (innote) {
			notetext+=textpiece;
		} else {
			if (!drop) linetext+=textpiece;
		}
	}

	var parser=Sax.parser(true);
	parser.onopentag=onopentag;
	parser.onclosetag=onclosetag;
	parser.ontext=ontext;
	parser.write(content);
	
}
const dofile=file=>{
	let vol=parseInt(file.substr(1));
	const content=fixerror(file.substr(4), fs.readFileSync(folder+file,"utf8"))
	process.stdout.write("\r"+file);
	p5tojson(content, vol, file);
}

files.forEach(dofile)


fs.writeFileSync(set+"-raw.txt",context.text.join("\n"),'utf8');
fs.writeFileSync(set+"-headers.txt",context.headers.join("\n"),'utf8'); //bsearch ok
fs.writeFileSync(set+"-pts.txt",context.pts.join('\n'),'utf8');//
fs.writeFileSync(set+"-mulu.txt",context.mulu.join('\n'),'utf8');
fs.writeFileSync(set+"-cnum.txt",context.cnums.join('\n'),'utf8');
fs.writeFileSync(set+"-cnumwarning.txt",context.cnumwarning.join('\n'),'utf8');
