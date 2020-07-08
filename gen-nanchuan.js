'use stricts';
const fs=require("fs");
const Sax=require("sax");
const folder="../../CBReader2X/Bookcase/CBETA/XML/N/";
const allfiles=fs.readFileSync("./nanchuan.lst","utf8").split(/\r?\n/);
//const files=allfiles.splice(56,34);
const {LANGSEP}=require("dengine")
const set='nanchuan';
//var notes=require("./notes");
//var textbody=require("./textbody");
files=allfiles;
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
	let notes=[];
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
		} else if (tagstack.length==5 && e.name=="cb:div" ) {
			if (e.attributes.type=="taisho-notes") {
				//notes(context,parser,"cb:div");
			}
		} else if (e.name=="lb") {
			//if (lb=="13:39.01") debugger
			let linet=linetext.trim().replace(/\r?\n/g,"");
			if (notes.length) {
				linet+=LANGSEP+notes.join("^^");
				notes.length=0;
			}
			if (lb) context.text.push([lb,linet]);
			lb=vol+":"+pagenum+"."+e.attributes.n.substr(5);
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
				linetext+="^"+n;
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
			if (e.attributes.style && e.attributes.style.indexOf('text-indent:2em')>0){
				linetext+='　　';
			}
		}

	}
	var onclosetag=function(name){
		const tagattributes=JSON.parse(tagstack[tagstack.length-1][1]);
		if (tagstack[tagstack[tagstack.length-1][0] != name]) {
			throw "unbalance tag"
		}
		if (name=="l"){
			linetext="　"+linetext.trim();
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
			notes.push([ n+"^"+nt]);
		} else if (name=="p") {
			linetext+=' '
		} else if (name=="mapping") {
			if (gref&&tagattributes.type=="normal_unicode"){
				replacechar[gref]=tounicodechar(textpiece);
				gref='';
			}
		} else if (name=="head") {
			//head innertext is redundant
			//linetext=linetext.substr( 0, linetext.length-textpiece.length);
		} else if (name=="cb:mulu") {

			const lv=tagattributes.level;
			let num=parseChiNum(textpiece);
			if (num) {
				context.mulu.push([lb,lv+"@"+num]);
			} else {
				context.mulu.push([lb,lv+"@"+textpiece]);
			}
			linetext=linetext.substr( 0, linetext.length-textpiece.length);
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
