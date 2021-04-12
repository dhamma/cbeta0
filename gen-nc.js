'use stricts';
const fs=require("fs");
const Sax=require("sax");
// const folder="../../CBReader2X/Bookcase/CBETA/XML/N/";
const folder="cbeta-dvd/N/";
const allfiles=fs.readFileSync("./nanchuan.lst","utf8").split(/\r?\n/);
const NOTESEP='|||';
const set='nc';
//var textbody=require("./textbody");
const files=allfiles;//allfiles.splice(56,34);

//files=allfiles;
// files.length=20;
const context={text:[],pts:[],mulu:[]};

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
const cnum={'Ò»':'1','¶þ':'2','Èý':'3','ËÄ':'4','Îå':'5',
'Áù':'6','Æß':'7','°Ë':'8','¾Å':'9','©–':'0','£¨':'','£©':''};
const parseChiNum=str=>{
	let o='',s=str;
	for (var c in cnum){
		s=s.replace(c,cnum[c]);
	}
	return parseInt(s);
}
let in_l=false,pagenum;
var p5tojson=function(content,vol,file){
	let inbody=false,innote=false;
	let linetext='',notetext='',paranum='',pparanum='';
	let notes={};
	var tagstack=[],gref='',textpiece='' ,replacechar={},drop=false;
	
	var onopentag=function(e){
		tagstack.push([e.name,JSON.stringify(e.attributes)]);

		if (tagstack.length==3 && e.name=="body") {
			inbody=true;
		} else if (e.name=="cb:div" ) {
		    linetext+='\t';
			if (tagstack.length==5 && e.attributes.type=="taisho-notes") {
				//notes(context,parser,"cb:div");
			}
		} else if (e.name=="lb") {

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

		} else if (e.name=="p") {
			if (e.attributes['xml:id']) {
				const m=e.attributes['xml:id'].match(/p(\d\d\d\d)a(\d\d)/);
				if (!m) throw 'invalid p xml:id'+e
				paranum=parseInt(m[1],10).toString()+String.fromCharCode(parseInt(m[2],10)+0x40);
			}
		} else if (e.name=='l') {
			linetext+='\t';
		    in_l=true;
		}
		 

	}
	const extractNote=text=>{
		if (text.indexOf('^')>-1) { //replace note to offset
			let note='';
			text=text.split('\n').map(line=>{
				let noteptrlen=0;
				let t=line.replace(/\^(\d+)/g,(m,m1,off)=>{
					note+=(off - noteptrlen)+'^'+notes[m1]+' ';
					noteptrlen+=m.length;
					return '';
				})
				if (note) {
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
			out+=text[i];
			i++;
		}
		return out;
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
		} else if (name=="p") {
			if (paranum) {
				let linet=linetext.trim().replace(/\t+/g,'\n');
				linet=extractNote(linet);
				linet=extractRef(linet,vol+'_'+paranum);
				const header=pparanum==paranum?'':(vol+'_'+paranum+'|');
				context.text.push(header+linet);
				pparanum=paranum;
				notes={};
			}
			linetext='';
		} else if (name=="mapping") {
			if (gref&&tagattributes.type=="normal_unicode"){
				replacechar[gref]=tounicodechar(textpiece);
				gref='';
			}
		} else if (name=="rdg") { //drop rdg, use lem
			drop=false;
			textpiece='';
		} else if (name=="head") {
			//head innertext is redundant
			// linetext=linetext.substr( 0, linetext.length-textpiece.length);
		} else if (name=="cb:mulu") {
			const lv=tagattributes.level;
			
			let num=parseChiNum(textpiece);
			if (num) {
				context.mulu.push([paranum+'\t'+lv+"@"+num]);
			} else {
				context.mulu.push([paranum+'\t'+lv+"@"+textpiece]);
			}
			linetext=linetext.substr( 0, linetext.length-textpiece.length);
			textpiece='';
		}
		tagstack.pop();
	}

	var ontext=function(t){
		textpiece=t.replace(/\r?\n/g,'');
		if (!innote) {
			textpiece=textpiece.replace(/(。[」』〕]*)/g,'$1\n')
			.replace(/([！？][」』〕]+)/g,'$1\n')
	        .replace(/([」』：])([「『〔])/g,'$1\n$2')
	        .replace(/？([，\u3400-\u9FFF\uD800-\uDFFF]{1,4})！/g,'？\n$1！');
		}

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
	const content=fs.readFileSync(folder+file,"utf8")
	process.stdout.write("\r"+file);
	p5tojson(content, vol, file);
}

files.forEach(dofile)

fs.writeFileSync(set+"-raw.txt",context.text.join("\n"),'utf8');
//fs.writeFileSync(set+"-note.txt",context.notes.join("\n"),'utf8');
fs.writeFileSync(set+"-pts.txt",context.pts.join('\n'),'utf8');//
fs.writeFileSync(set+"-mulu.txt",context.mulu.join('\n'),'utf8');
