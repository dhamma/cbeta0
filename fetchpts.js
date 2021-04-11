'use strict';

const {readlines,openDB}=require('pengine');
const {parsePTS}=require('pengine/ptsutil');
const db=openDB('cbeta0nanchuan');
// console.log(db.getAsset('pts'))
console.time('pts')
const cap=parsePTS('m1,160',db);
const cap2=parsePTS('m1,161',db);
console.timeEnd('pts')
const line=readlines(db,cap.x0,cap2.x0-cap.x0+1);

console.log(line)