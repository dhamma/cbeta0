'use strict';

const {readlines,openDB}=require('pengine');
const {parsePTS}=require('./ptsvolpg');
const db=openDB('cbeta0nanchuan');
// console.log(db.getAsset('pts'))
const cap=parsePTS('m1,160');
const cap2=parsePTS('m1,161');

const line=readlines(db,cap.x0,cap2.x0-cap.x0+1);

console.log(line)