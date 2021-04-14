'use strict';
const {readFileSync,writeFileSync}=require('fs');
const {fromObj, alphabetically0, alphabetically}=require('pengine/arrutil')
const {lineBody}=require('pengine/textutil')
const {addPosting}=require('pengine/indexer')
const {createBuilder}=require('pengine/builder')
const {pack3,pack}=require('pengine/packintarr')
const contentlines=readFileSync('nc-raw.txt','utf8').split(/\r?\n/);
const rawtokens=readFileSync('tokentable.txt','utf8').split(/\r?\n/);
const T={};
let maxtklen=0;
rawtokens.forEach(item=>{
    const tk=item.split(',')[1];
    T[tk]=[];
    if (tk.length>maxtklen)maxtklen=tk.length;
});
const MAXCHARPERLINE=1024;
maxtklen=10;
const getPhrase=(linetext,i)=>{
    let phrase='',offset=0;
    while (i<linetext.length) {
        const code=linetext.charCodeAt(i);
        let ch=linetext.substr(i,1);
        if ((code <0x3400 || code>0x9fff)) {
            i++
            while (i<linetext.length && (linetext.charCodeAt(i) <0x3400 || linetext.charCodeAt(i)>0x9fff)) i++;
            break;
        } else if (code>=0xd800 && code<=0xdfff) {
            ch=linetext.substr(i,2);
            i+=2;
            break;
        } else {
            if (!phrase) offset=i;
            phrase+=ch;
            i++;
        }
    }
    return [phrase,i,offset]
}
const indexPhrase=(phrase,x0,offset)=>{
    // console.log('indexing',phrase)
    let consumed=1; //at least consumed one char
    for (let i=phrase.length;i>0;i--) {
        const subph=phrase.substr(0,i);
        if (!T[subph] && subph.length==1) T[subph]=[];//must index one character

        if (T[subph]) {
            addPosting( T[subph],x0,offset+1);
            consumed=i;
            break;
        }
    }
    return consumed;
}
const processLine=(body,x0)=>{
    let i=0;
    do{
        const r=getPhrase(body,i);
        i=r[1];
        let j=0,ph=r[0],offset=r[2];
        if (ph) {
            do {
                const subph=ph.substr(j,maxtklen);
                const consumed=indexPhrase(subph,x0,offset+j);
                j+=consumed;
            } while(j<ph.length);    
        }
    } while (i<body.length)
}
const processFile=lines=>{
    for (let i=0;i<lines.length;i++) {
        if (i%4096==0) process.stdout.write('\r'+i+'/'+lines.length+'  ');
        const body=lineBody(lines[i]);
        if (body.length>MAXCHARPERLINE) console.log('line too long',body.length);
        processLine(body,i);
    }
}

const prepareTokenTable=T=>{
    const tokenTable=[],postingsSize=[],postings=[],positions=[];
    const arr=[];
    for (let tk in T) {
        const [posting,position]=T[tk];
        if (posting) arr.push([tk, posting , position, posting.length]);
    }
    arr.sort(alphabetically0);
    arr.forEach(item=>{
        const [tk,posting,position,len]=item;
        tokenTable.push(tk);
        postings.push(posting);
        positions.push(position);
        postingsSize.push(len);
    });
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
    builder.done(tokenTable,{postingsSize:pack(postingsSize)});
}

// contentlines.length=20;
console.log('start index');
processFile(contentlines);
console.log('writing index');
writeIndex(T);