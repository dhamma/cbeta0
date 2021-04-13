'use strict'
const {readlines,openDB,parseCAP}=require('pengine');
const nc=openDB('cbeta0nc');

const cap=parseCAP('9_226M', nc);
// console.log(cap);
const res=readlines(nc,cap.x0,cap._w);
console.log(res)


