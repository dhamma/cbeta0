const { openDBX } = require("pengine");

const db=openDBX('cbeta0nc');
//色究竟天 色,究竟,天
//舍衛國
// const res=db.findWord({tofind:"比丘"});
console.time('search')
const res=db.findWord({tofind:"馴鷹"});
console.timeEnd('search')
console.log(res)
