'use stricts';
const standoffNotePtr=true; //use string offset as note ptr



const fs=require("fs");
const Sax=require("sax");
// const folder="../../CBReader2X/Bookcase/CBETA/XML/N/";
const folder="cbeta-dvd/N/";
const allfiles=fs.readFileSync("./nanchuan.lst","utf8").split(/\r?\n/);


const LANGSEP='|||';
const set='nanchuan';
//var notes=require("./notes");
//var textbody=require("./textbody");
const files=allfiles;//allfiles.splice(56,34);

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
let lb='',pagenum;
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
			//if (lb=="13:39.01") debugger
			let linet=linetext.replace(/\r?\n/g,"");
			
			if (notes.length) {
				const notesuffix=notes.map(note=>{
					const nid=(standoffNotePtr?standoffets[note[0]]:note[0])
					return nid+'^'+note[1];
				}).join("^^");
				linet+=LANGSEP+notesuffix;
				notes.length=0;
			}
			standoffets={};
			if (lb) context.text.push(lb+'\t'+linet);
			lb=vol+"_"+pagenum+"x"+(parseInt(e.attributes.n.substr(5))-1);
			linetext='';
		} else if (e.name=="pb"){
			pagenum=parseInt(e.attributes.n);
		} else if (e.name=="ref"){
			let ref=e.attributes.cRef;
			if (ref.substr(0,3)=="PTS"){
				if (lb) context.pts.push([lb,ref.substr(4)])
			}
		} else if (e.name=="note") {
			if (!e.attributes.n) {
				return;
			}
			let n=parseInt(e.attributes.n.substr(4));
			if (n){
				if (standoffNotePtr) {
					// if (standoffets[n]) {
						//type="mod" override type="orig" note
						//console.log('warning repeat note',n,file+'@'+lb);
					// }
					standoffets[n]=linetext.length;
				} else {
					linetext+="^"+n;
				}
			}
			innote=true;
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
			let nt=notetext.trim(); //some notes has crlf
			notetext='';
			if (!tagattributes.n) {
				return;
			}
			const ty=tagattributes.type;
			innote=false;
			if (ty=="add"||ty=="cf1"||ty=="star"||ty=="inline"||ty=="mod") {
				return; //added by cbeta
			}
			
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
			if (innote) {
				notetext=notetext.substr(0, notetext.length-textpiece.length);
			} else {
				linetext=linetext.substr(0, linetext.length-textpiece.length);
			}
			textpiece='';
		} else if (name=="head") {
			//head innertext is redundant
			linetext=linetext.substr( 0, linetext.length-textpiece.length);
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
		}
		tagstack.pop();
	}
	var ontext=function(t){
		textpiece=t;
		if (!inbody)return;

		if (innote) {
			notetext+=t;
		} else {
			linetext+=t;
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
