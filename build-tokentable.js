'use strict';
const {readFileSync,writeFileSync}=require('fs');
const {fromObj, alphabetically0, alphabetically}=require('pengine/arrutil')
const {lineBody}=require('pengine/textutil');
const { big } = require('../palipar/chunk_cs0m');
const rawcontent=readFileSync('nc-raw.txt','utf8');//.substr(0,200000);
const MAXCHARPERLINE=1024;
const contentlines=rawcontent.split(/\r?\n/);

const ngram=[];
const THRESHOLD=5;
const BigramCount={}; //後字有幾種？字可形成的bigram 數，構詞力
let BigramCountRev={}; //前字有幾種？
const processLine=(linetext,pass)=>{
    let i=0;
    let phrase='';
    const tokens=ngram[pass];
    while (i<linetext.length) {
        const code=linetext.charCodeAt(i);
        let ch=linetext.substr(i,1);
        if (code <0x3400 || code>0x9fff) {
            ch='';
        } if (code>=0xd800 && code<=0xdfff) {
            ch=linetext.substr(i,2);
            i++;
        }
        
        if (ch.length==1) {
            phrase+=ch;
            const parenttk=phrase.substr(phrase.length-pass-1,pass);
            const tk=phrase.substr(phrase.length-pass-1);
            let canadd=pass==0;
            if (pass) {
                if (pass==1&&tk.length==2) {
                    if (!BigramCount[parenttk]) BigramCount[parenttk]={};
                    if (!BigramCountRev[tk[1]]) BigramCountRev[tk[1]]={};
                    BigramCount[parenttk][tk[1]]=true;
                    BigramCountRev[tk[1]][parenttk]=true;
                }
                canadd=ngram[pass-1][parenttk]>=THRESHOLD && tk.length>pass;
            }
            if (canadd) {
                if (!tokens[tk]) tokens[tk]=0;
                tokens[tk]++;     
            }
        } else {
            if ((ch.length && ch.length==pass-1)) { // extension B
                if (!tokens[ch]) tokens[ch]=0;
                tokens[ch]++;     
            }
            phrase='';
        }
        i++;
    }
}
const tokentable=[]
const processFile=(lines,pass)=>{
    console.log('pass',pass)
    ngram[pass]={};
    for (let i=0;i<lines.length;i++) {
        const body=lineBody(lines[i]);
        if (body.length>MAXCHARPERLINE) console.log('line too long',body.length);
        processLine(body,pass);
    }
    /*
    if (pass==1) {//
        for (let tk in BigramCount) {
            const aftercount=Object.keys(BigramCount[tk]).length;
            const beforecount=(BigramCountRev[tk]) ?Object.keys(BigramCountRev[tk]).length:1;
            BigramCount[tk]= [ aftercount, beforecount , (aftercount/beforecount)||0 ] ;
        }

        const bc=fromObj(BigramCount,(k,v)=>[k,v[0], v[1],v[2]]);
        bc.sort((a,b)=>b[3]-a[3]);
        // writeFileSync('bigramcount.txt',bc.join('\n'),'utf8')
        BigramCountRev=null;
    }
    */
    const ratios=[0,0.02,0.1,0.2,0.3,0.4,0.6];
    const tokens=ngram[pass];
    if (pass) {
        //詞越長，延伸詞占比要求越高。盡量濾掉非詞
        const minratio=ratios[pass]||0.6;
        for (let key in tokens) {
            const parenttk=key.substr(0,key.length-1);
            const parentFreq=ngram[pass-1][parenttk];
            // const lastch=key[key.length-1];
            // const stickyness=BigramCount[lastch]?BigramCount[lastch][3]:1;// 可組合的前字越少，越「黏」
            if (parenttk=='提婆達多') debugger;
            const ratio=(tokens[key]/parentFreq)  ;//去除占比太少的延伸詞
            if (tokens[key]<THRESHOLD || minratio>ratio ) delete tokens[key];
        }
    }
    const arr=fromObj(tokens,(k,v)=>[k,v]);
    arr.sort((a,b)=>b[1]-a[1])
    console.log(arr)
    
    for (let i=0;i<arr.length;i++) {
        tokentable.push(arr[i]);
    }
}

processFile(contentlines,0);
processFile(contentlines,1);
processFile(contentlines,2);
processFile(contentlines,3);
processFile(contentlines,4);
processFile(contentlines,5);
/*
processFile(contentlines,6);
processFile(contentlines,7);
processFile(contentlines,8);
processFile(contentlines,9);

processFile(contentlines,10);
processFile(contentlines,11);

processFile(contentlines,12);
processFile(contentlines,13);
processFile(contentlines,14);
processFile(contentlines,15);
processFile(contentlines,16);
processFile(contentlines,17);
processFile(contentlines,18);
processFile(contentlines,19);
processFile(contentlines,20);
*/
tokentable.sort(alphabetically)

writeFileSync('tokentable-raw.txt',tokentable.join('\n'),'utf8')