'use stricts';
const fs=require("fs");
const Sax=require("sax");
// const folder="../../CBReader2X/Bookcase/CBETA/XML/N/";
const folder="cbeta-dvd/N/";
const allfiles=fs.readFileSync("./nanchuan.lst","utf8").split(/\r?\n/);


const LANGSEP='|||';
const set='nanchuan';
//var notes=require("./notes");
//var textbody=require("./textbody");
const files=allfiles;//.splice(56,34);
//allfiles.splice(56,34);

//files=allfiles;
//files.length=10;
const textlines=[];
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
const cnum={'一':'1','二':'2','三':'3','四':'4','五':'5',
'六':'6','七':'7','八':'8','九':'9','〇':'0','（':'','）':''};
const parseChiNum=str=>{
	let o='',s=str;
	for (var c in cnum){
		s=s.replace(c,cnum[c]);
	}
	return parseInt(s);
}
let lb='',pagenum,drop=false;

var p5tojson=function(content,vol,file){
	let inbody=false,innote=false;
	let linetext='',notetext='';
	let notes=[],standoffets={};
	var tagstack=[],gref='',textpiece='' ,replacechar={};
	var defaulthandler=function(parser)	{
		parser.onopentag=onopentag;
		parser.onclosetag=onclosetag;
		parser.ontext=ontext;
	}
	const emitLine=(attributes)=>{
		let linet=linetext.replace(/\r?\n/g,"");
		const standoffnotes=[];
		let acclen=0;
		if (notes.length) {
			linet=linet.replace(/\^(\d+)/g,(m,m1,off)=>{
				if (!notes.length) {
					console.log('no more note',file,attributes.n, linet);
					return '';
				}
				standoffnotes.push(off-acclen+'^'+notes[0][1].replace(/>/g,'＞').replace(/</g,'＜'));
					acclen+=m.length;
					notes.shift();
			return '';
			});
			if (notes.length) {
				//if (notes.length!==1) console.log('more than one note for empty line',file,e.attributes.n);
				linet+=LANGSEP+'0^'+notes.map(note=>note[1]).join(' '); //combine
			} else linet+=LANGSEP+standoffnotes.join(' ');
		};
		
		notes.length=0;
	
		if (lb) context.text.push(lb+'\t'+linet);
		lb='';
		if (attributes.n) lb=vol+"_"+pagenum+String.fromCharCode(parseInt(attributes.n.substr(5),10)+0x40)
		linetext='';
	}
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
			// if (e.attributes.n=='0237a14' && vol==14) debugger;
			emitLine(e.attributes);
		} else if (e.name=="pb"){
			pagenum=parseInt(e.attributes.n);
		} else if (e.name=="ref"){
			let ref=e.attributes.cRef;
			if (ref.substr(0,3)=="PTS"){
				if (lb) context.pts.push([lb,ref.substr(4)])
			}
		} else if (e.name=="note") {
			innote=true;

		    if (e.attributes.type!=='orig')return;
			if (!e.attributes.n) {
				return;
			}
			let n=parseInt(e.attributes.n.substr(4));
			if (n){
				linetext+="^"+n;
			}
			
		} else if (e.name=="g") {
			let ref=e.attributes.ref.substr(1);
			if (replacechar[ref]) {
				linetext+=replacechar[ref];
			}

		} else if (e.name=="char"){
			gref=e.attributes['xml:id'];

		} else if (e.name=="p") {
		//	if (e.attributes.style && e.attributes.style.indexOf('text-indent:2em')>0){
				linetext+='\t';
			//}
		} else if (e.name=='l') {
		    linetext+='\t　';
		} else if (e.name=='rdg'){
			drop=true;
		}
	}
	var onclosetag=function(name){
		const tagattributes=JSON.parse(tagstack[tagstack.length-1][1]);
		if (tagstack[tagstack[tagstack.length-1][0] != name]) {
			throw "unbalance tag"
		}
		if (name=="l"){
			//linetext="　"+linetext.trim();
		}else if (name=="note"){
			innote=false;
			let nt=notetext.trim(); //some notes has crlf
			notetext='';
			if (!tagattributes.n) return;
			const type=tagattributes.type;
			
			if (type!=='orig')return;
			
			let n=parseInt(tagattributes.n.substr(4));
			if (isNaN(n)){
				console.log("pro note ",vol,tagattributes.n,file);
				return;
			}
			notes.push([ n, nt ]);
		} else if (name=="p") {
			//linetext+=' '
		} else if (name=="mapping") {
			if (gref&&(tagattributes.type=="normal_unicode"||tagattributes.type=="unicode")){
				replacechar[gref]=tounicodechar(textpiece);
				gref='';
			}
		} else if (name=="rdg") { //drop rdg, use lem
			drop=false;
			textpiece='';
		} else if (name=="head") {
			//head innertext is redundant
			if (linetext.endsWith(textpiece)) { //  fixed for N14p0237a14 , <head> contains notes
				linetext=linetext.substr( 0, linetext.length-textpiece.length);
			}
		} else if (name=="cb:mulu") {
			const lv=tagattributes.level;
			
			let num=parseChiNum(textpiece);
			if (num) {
				context.mulu.push([lb+'\t'+lv+"@"+num]);
			} else {
				context.mulu.push([lb+'\t'+lv+"@"+textpiece]);
			}
			//linetext=linetext.substr( 0, linetext.length-textpiece.length);
			textpiece='';
		} else if (name=='body') {
			emitLine({}); //attributes is invalid at end of file
		}
		tagstack.pop();
	}
	var ontext=function(t){
		textpiece=t;
		if (!inbody)return;

		if (innote) {
			notetext+=t;
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
