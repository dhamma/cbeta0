const {open,readlines}=require("pengine");

const db=open("cbeta0nanchuan");

//reading 9:1 MN

const pagelines=db.getpageline(8);
const start=pagelines[1][0];
const len=pagelines[1][1]-start;
// console.log(pagelines,start,len)
let res=readlines(db,start,len);
console.log(res)
