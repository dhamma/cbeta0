/* for palipar */
'use strict'
const {readFileSync}=require('fs');
const {createBuilder}=require("pengine/builder");
let dbname='cbeta0nc';
const raw=readFileSync('./nc-raw.txt','utf8').split(/\r?\n/);
const build=()=>{
	const builder=createBuilder({name:dbname,assets:[],pagepat:"9A"});
	let prevbk=0;

	builder.newpage(1,0,"1"); //cap._ is zero based, need to add a pseudo page 
	raw.forEach(line=>{
        const m=line.match(/(\d+)_([\d]+[A-Z])\|/);
        if (m) {
            const [m0,bk,pn]=m;
            line=line.substr(bk.length+1);

	    	if (prevbk&&bk!==prevbk) builder.addbook(prevbk);
            builder.newpage(pn,0,prevbk);
            prevbk=bk;
        }
        builder.addline(line);
	});
	builder.addbook(prevbk);
	const payload=[];//for PTS mapping
	builder.done(payload,{});
}
build();