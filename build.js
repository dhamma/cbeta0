/* for palipar */
const {readFileSync}=require('fs');
const {createBuilder}=require("pengine/builder");
let dbname='cbeta0nanchuan';
const raw=readFileSync('./nanchuan-raw.txt','utf8').split(/\r?\n/);
const build=()=>{
	const builder=createBuilder({name:dbname,assets:['toc','pts']});
	let prevbk=0,prevpg=0;

	builder.newpage(1,0,"1"); //cap._ is zero based, need to add a pseudo page 
	raw.forEach(line=>{
		const m=line.match(/(\d+)_(\d+)([A-Z])\t(.*)/);
		if (!m) throw 'error line '+line;
		let [mm,bk,pg,ln,text]=m;
		pg=parseInt(pg);
		if (prevpg&&pg!==prevpg) builder.newpage(prevpg+1,0,prevbk);
		if (prevbk&&bk!==prevbk) {
			builder.addbook(prevbk);
			builder.newpage(1,0,bk); //pseudo page
		}
		builder.addline(text);
		prevpg=pg; prevbk=bk;
	});
	builder.addbook(prevbk);
	const payload=[];//for PTS mapping
	builder.done(payload,{});
}
build();