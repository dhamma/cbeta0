'use strict'
const {readFileSync,writeFileSync}=require('fs')
const {sameLeadingChar,compress}=require('pengine/tokentable')
const {reverseStr}=require('pengine/textutil')
const {alphabetically1, fromObj}=require('pengine/arrutil')
const tokensfreq=readFileSync('tokentable-raw.txt','utf8').split(/\r?\n/);
const leadStat={};
const discount=()=>{
    for (let i=1;i<T.length;i++) {
        let j=i-1;
        // idx, t, freq, forward_t , deduct 
        while (j && T[j][1][0]==T[i][1][0]) {
            const same=sameLeadingChar(T[i][1],T[j][1]);
            if (same==T[j][1].length) {
                T[j][2]-=T[i][2]; //freq
                T[i][4].push(  T[j][0]  )   //deduct
                break;
            }
            j--;
        }
    }
}


const T=tokensfreq.map((item,idx)=>{
    const [tk,freq]=item.split(',');
    const first=tk[0];
    if (!leadStat[first])leadStat[first]=0;
    leadStat[first]++;

    return [idx,tk,parseInt(freq),tk,[]];
})

//檢查構詞能力
/*
const arr=fromObj(leadStat,(k,v)=>[k,v])
const totalfreq=arr.reduce( (acc,item)=>acc+item[1] ,0);
arr.sort((a,b)=>b[1]-a[1])
const averagepower=totalfreq/arr.length;
*/

discount();
for (let i=0;i<T.length;i++)  T[i][1]=reverseStr(T[i][3]);
T.sort(alphabetically1);
discount();
T.sort((a,b)=>a[0]-b[0]).forEach( item=>{item.shift();item.shift()});


const MINTHRESHOLD=7;
for (let i=0;i<T.length;i++) {
    const t=T[i][1], freq=T[i][0], deductfrom=T[i][2];
    if (t.length==1 || (t.charCodeAt(0)>=0xd800&& t.charCodeAt(0)<=0xdfff) ) {
        T[i].length=2;
        continue;
    }
    // const adjust= 2*Math.log(averagepower/leadStat[t[0]])  ;// 依構詞能力調整
    // const adjust=0;
    if (freq<MINTHRESHOLD) {
        for (let j=0;j<deductfrom.length;j++) {
            const idx=deductfrom[j];
            if (freq>0) {
                T[idx][0] += freq; //put back
                T[i][0]=0;
            }
        }
    }
    T[i].length=2;
}

const out=T.filter(([f,t])=> f && t.length>1&&((f+t.length>MINTHRESHOLD /*|| t.length==1*/)));
out.sort((a,b)=>b[0]-a[0]);
writeFileSync('tokentable.txt',out.join('\n'),'utf8')
// const compressed=compress(out.map(item=>item[1]));
// writeFileSync('tokentable-compress.txt',compressed.join('\n'),'utf8')
console.log('before compress',tokensfreq.length)
console.log('count',out.length)


// console.log(phase1)
// writeFileSync('tokentable-discount.txt',out.join('\n'),'utf8')
// writeFileSync('tokentable-rev.txt',phase1.join('\n'),'utf8')