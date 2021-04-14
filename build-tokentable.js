'use strict';
const {readFileSync,writeFileSync}=require('fs');
const {fromObj, alphabetically0, alphabetically}=require('pengine/arrutil')
const {lineBody}=require('pengine/textutil')
const rawcontent=readFileSync('nc-raw.txt','utf8');//.substr(0,200000);
const MAXCHARPERLINE=1024;
const contentlines=rawcontent.split(/\r?\n/);

const ngram=[];
const THRESHOLD=5;
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
        
        if (ch.length==1) {// && ch!=='之'
            phrase+=ch;
            const parenttk=phrase.substr(phrase.length-pass-1,pass);
            const tk=phrase.substr(phrase.length-pass-1);
            let canadd=pass==0;
            if (pass) {
                canadd=ngram[pass-1][parenttk]>=THRESHOLD && tk.length>pass;
            }
            if (canadd) {
                if (!tokens[tk]) tokens[tk]=0;
                tokens[tk]++;     
            }
        } else {//(pass==0&&ch=='之')|| 
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
    const tokens=ngram[pass];
    if (pass) {
        //詞越長，延伸詞占比要求越高。盡量濾掉非詞
        const minratio=0.03*pass;
        for (let key in tokens) {
            const parenttk=key.substr(0,key.length-pass);
            const parentFreq=ngram[pass-1][parenttk];
            const ratio=tokens[key]/parentFreq;//去除占比太少的延伸詞
            if (tokens[key]<THRESHOLD || ratio<minratio ) delete tokens[key];
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
processFile(contentlines,6);
processFile(contentlines,7);
processFile(contentlines,8);
processFile(contentlines,9);
processFile(contentlines,10);
processFile(contentlines,11);
/*
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