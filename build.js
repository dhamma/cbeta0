/* for palipar */
const {readFileSync}=require('fs');
const {createbuilder}=require("pengine");
let dbname='cbeta0nanchuan';
const raw=readFileSync('./nanchuan-raw.txt','utf8').split(/\r?\n/);
const build=()=>{
	const builder=createbuilder({name:dbname});
	let prevbk=0,prevpg=0;
	raw.forEach(line=>{
		const m=line.match(/(\d+)\:(\d+)\.(\d+)\,(.*)/);
		if (!m) throw 'error line '+line;
		const [mm,bk,pg,ln,text]=m;
		if (prevbk&&bk!==prevbk) builder.addbook(prevbk);
		if (prevpg&&pg!==prevpg) builder.newpage(-1,prevpg,prevbk);
		builder.addline(text);
		prevpg=pg; prevbk=bk;
	});
	builder.addbook(prevbk);
	const payload=[];//for PTS mapping
	builder.done(payload,{});
}
build();