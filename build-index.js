'use strict';
const {readFileSync,writeFileSync}=require('fs');
const {fromObj, alphabetically0}=require('pengine/arrutil')
const {lineBody}=require('pengine/textutil')
const rawcontent=readFileSync('nc-raw.txt','utf8');//.substr(0,100000);
const MAXCHARPERLINE=1024;
const contentlines=rawcontent.split(/\r?\n/);

const ngram=[];

const processLine=(linetext,pass)=>{
    let i=0;
    let phrase='';
    const tokens=ngram[pass];
    while (i<linetext.length) {
        const code=linetext.charCodeAt(i);
        let ch=linetext.substr(i,1);
        if (code <0x3400 || code>0x9fff) {
            ch='';
        }
        if (code>=0xd800 && code<=0xdfff) {
            ch=linetext.substr(i,2);
            i++;
        }
        
        if (ch) {
            phrase+=ch;
            const parenttk=phrase.substr(phrase.length-pass-1,pass);
            const tk=phrase.substr(phrase.length-pass-1);
            let canadd=pass==0;
            if (pass) {
                canadd=ngram[pass-1][parenttk]>10 && tk.length>pass;
            }
            // if (pass) console.log(tk,parenttk,phrase)
            if (canadd) {
                // if (pass) console.log('add',tk)
                if (!tokens[tk]) tokens[tk]=0;
                tokens[tk]++;     
            }
        } else {
            phrase='';
        }
        i++;
    }
}

const processFile=(lines,pass)=>{
    ngram[pass]={};
    for (let i=0;i<lines.length;i++) {
        const body=lineBody(lines[i]);
        if (body.length>MAXCHARPERLINE) console.log('line too long',body.length);
        processLine(body,pass);
    }
    if (pass) {
        const tokens=ngram[pass];
        const minoccur= (7-pass)*10;
        for (let key in tokens) {
            if (tokens[key]<minoccur) delete tokens[key];
        }
        const arr=fromObj(tokens,(k,v)=>[k,v]);
        // arr.sort(alphabetically0);
        arr.sort((a,b)=>b[1]-a[1])
        console.log(arr)        
    }
}

processFile(contentlines,0);
processFile(contentlines,1);
processFile(contentlines,2);
processFile(contentlines,3);
processFile(contentlines,4);
processFile(contentlines,5);
processFile(contentlines,6);

