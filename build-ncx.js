'use strict';
const {readFileSync,writeFileSync}=require('fs');
const {alphabetically,alphabetically0}=require('pengine/arrutil')
const {perPhrase}=require('pengine/phraser');
const {addPosting}=require('pengine/indexer')
const {createBuilder}=require('pengine/builder')
const {pack3,pack, pack_delta}=require('pengine/packintarr');
const { HEADSEP ,NOTESEP} = require('pengine/textutil');
const contentlines=readFileSync('nc-raw.txt','utf8').split(/\r?\n/);
// contentlines.length=10000;
const {initVocabulary,segmentText}=require('pengine/segmenter')
const {loadJsonP}=require('pengine/textutil')
const T={} ;       //key 為詞，含posting及position
const BreakPos=[]; //分詞斷點
const MAXCHARPERLINE=4096;
let maxTokenLen=10;

let voc=loadJsonP('nc/nc.voc.js','utf8').split(/\r?\n/).map(item=>{
    const r=item.split(',');
    return [parseInt(r[0]),r[1]]
});
initVocabulary(voc);
const longuni=[];
let wordcount=0,unigramcount=0,wcharcount=0;
const statToken=(tokens,x0)=>{
    let contuni=0;
    for (let i=0;i<tokens.length;i++){
        const tk=tokens[i];
        if (tk.length>1) {
            wordcount++;
            if (contuni>3) {
                longuni.push( [tokens.slice(i-contuni,i).join(''),x0 ]);
            }
            contuni=0;
        } else {
            contuni++;
            unigramcount++;
        }
        wcharcount+=tk.length;    
    }
}
let unigram=0;
const addUnigram=(tokens,x0,offset)=>{
    for (let i=0;i<tokens.length;i++){
        const tk=tokens[i];
        for (let j=0;j<tk.length;j++) {
            const uni=tk[j]+'.';
            if (!T[uni]) {
                T[uni]=[];
                unigram++;
            }
            addPosting(T[uni],x0,offset+j+1);
        }
    }
}
const indexPhrase=(phrase,x0,offset)=>{
    const res=segmentText(phrase,true);//combine chinese number
    let len=0;
    statToken(res,x0);
    //addUnigram(res,x0,offset)
    for (let i=0;i<res.length;i++) {
        const tk=res[i];
        BreakPos[x0].push(offset+len);
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
        
        if (at2>0) text=text.substr(0,at2);
        if ((at>0&&at2!=at)) {
            text=text.substr(at+1);
        }
        
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
const removeDuplicate=T=>{
    let deleteunigram=0;
    for (let tk in T) {
        if (tk[tk.length-1]=='!') {
            const unitk=tk.substr(0,tk.length-1);
            if (T[unitk] && T[tk][0].length == T[unitk][0].length) {
                delete T[tk];
                deleteunigram++;
            }
        }
    }
    return deleteunigram;
}
const writeIndex=T=>{
    const hugePostings=[];
    const {tokenTable,postingsSize,postings,positions}=prepareTokenTable(T);
    const builder=createBuilder({name:'cbeta0ncx',assets:[]});
    for (let i=0;i<postings.length;i++) { // postings and positions is 1-base
        if (postings[i].length>5000) {
            hugePostings.push([tokenTable[i],postings[i].length]);
        }
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
    hugePostings.sort((a,b)=>b[1]-a[1]);
    builder.done(tokenTable,{$postingsSize:pack(postingsSize)});
    return {wcharcount,wordcount,unigramcount,hugePostings};
}

console.time('index');
console.log('start index');
processFile(contentlines);
const deleted=removeDuplicate(T);
const report=writeIndex(T);
report.deletedunigram=deleted;
report.unigram=unigram-deleted;
console.timeEnd('index');
//分析連續的unigram 可能是詞
longuni.sort(alphabetically0);
// writeFileSync('longuni-orig.txt',longuni.join('\n'),'utf8');

console.log(report)