'use strict';
const {readFileSync}=require('fs');
const {alphabetically}=require('pengine/arrutil')
const {perPhrase}=require('pengine/phraser');
const {addPosting}=require('pengine/indexer')
const {createBuilder}=require('pengine/builder')
const {pack3,pack, pack_delta}=require('pengine/packintarr');
const { HEADSEP ,NOTESEP} = require('pengine/textutil');
const contentlines=readFileSync('nc-raw.txt','utf8').split(/\r?\n/);
const {initVocabulary,segmentText}=require('pengine/segmenter')
const {loadJsonP}=require('pengine/textutil')
const T={} ;       //key 為詞，含posting及position
const BreakPos=[]; //分詞斷點
const MAXCHARPERLINE=1024;
let maxTokenLen=10;

let voc=loadJsonP('nc/nc.voc.js','utf8').split(/\r?\n/).map(item=>{
    const r=item.split(',');
    return [parseInt(r[0]),r[1]]
});
initVocabulary(voc);
const indexPhrase=(phrase,x0,offset)=>{
    const res=segmentText(phrase);
    let len=0;
    for (let i=0;i<res.length;i++) {
        const tk=res[i];
        if (offset+len) BreakPos[x0].push(offset+len);
        if (!T[tk]) T[tk]=[];
        addPosting(T[tk],x0,offset+len+1);
        len+=res[i].length;
    }
}

const processFile=lines=>{
    for (let i=0;i<lines.length;i++) {
        if (i%4096==0) process.stdout.write('\r'+i+'/'+lines.length+'  ');
        const at=lines[i].indexOf(HEADSEP);
        const at2=lines[i].lastIndexOf(NOTESEP);
        let text=lines[i];
        BreakPos[i]=[];

        if ((at>0&&at2!=at)) {
            text=lines[i].substr(at+1);    
        }
        if (at2>0) text=text.substr(0,at2);
        if (text.length>MAXCHARPERLINE) console.log('line too long',i,text.length);
        perPhrase({text,x0:i,maxTokenLen,lang:'zh'},indexPhrase);
    }
}

const prepareTokenTable=T=>{
    const tokenTable=[],postingsSize=[],postings=[],positions=[];
    const arr=[];
    for (let tk in T) T[tk][0]&&arr.push(tk);
    arr.sort(alphabetically);
    console.log('token count',arr.length)
    for (let i=0;i<arr.length;i++){
        const tk=arr[i];
        tokenTable.push(tk);
        const [posting,position]=T[tk];
        postings.push(posting);
        positions.push(position);
        postingsSize.push(posting.length);
    };
    return {tokenTable,postingsSize,postings,positions};
}
const writeIndex=T=>{
    const {tokenTable,postingsSize,postings,positions}=prepareTokenTable(T);
    const builder=createBuilder({name:'cbeta0ncx',assets:[]});
    for (let i=0;i<postings.length;i++) { // postings and positions is 1-base
        builder.addline( pack3(postings[i]||[]) ); //fix 3 bytes for x0
    }
    builder.addbook('postings');
 
    for (let i=0;i<positions.length;i++) {
        builder.addline( pack(positions[i]||[]) ); //variable length
    }
    builder.addbook('positions');
    
    for (let i=0;i<BreakPos.length;i++)  {
        builder.addline(pack_delta(BreakPos[i]));
    }
    builder.addbook('breakpos');

    builder.done(tokenTable,{postingsSize:pack(postingsSize)});
}

console.time('index');
console.log('start index');
processFile(contentlines);
writeIndex(T);
console.timeEnd('index');
