/* for palipar */
'use strict'
const {readFileSync}=require('fs');
const {createBuilder}=require("pengine/builder");
let dbname='cbeta0nc';
const raw=readFileSync('./nc-raw.txt','utf8').split(/\r?\n/);
// raw.length=7429;
const build=()=>{
	const builder=createBuilder({name:dbname,assets:['toc','pts'],pagepat:"999A"});
	let prevbk=0;
	raw.forEach(line=>{
        const m=line.match(/(\d+)_([\d]+[A-Z])\|/);
        if (m) {
            const [m0,bk,pn]=m;
            line=line.substr(bk.length+1);
	    	if (prevbk&&bk!==prevbk) {
				builder.newpage(-1,0,prevbk); //最後一頁的終結，沒有名字。pagenames 會比 pagelines 少一個
				builder.addbook(prevbk);
			}
            builder.newpage(pn,0,bk);
            prevbk=bk;
        }
        builder.addline(line);
	});
	builder.addbook(prevbk);
	const payload=[];//for PTS mapping
	builder.done(payload,{});
}
build();