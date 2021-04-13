'use strict';
/* generate nanchuan.pts.js from nanchuan-pts*/

const {readFileSync}=require('fs');
const {writeExtra}=require('pengine/builder')
const dbname='nc';  // or nanchuan

const lines=readFileSync(dbname+'-pts.txt','utf8').split(/\r?\n/);

const renames={
    Vin: 'v',   
    D: 'd',   M: 'm', S: 's',A: 'a',
    Khp: 'kp', Dhp: 'dhp',    Ud: 'ud',    It: 'iti',    Sn: 'snp',
    Vv: 'vv',  Pv: 'pv',  Th: 'thag', 'Thī': 'thig',
    Ap: 'thap',   Ja: 'ja', 'Paṭis': 'ps',   Bv: 'bv', Cp: 'cp',
    Nidd: 'mnd',   Dhs: 'ds',   Vibh: 'vb',
    'Dhātuk': 'dt',  DhkA: 'dt0a',//頁碼從 114 開始, pts 版dt 與 dt0a 同一冊
    Pp: 'pp',    Yam: 'ya',    'Paṭṭh': 'pt',    PA: 'pt0a',
    Kv: 'kv',    Mil: 'mil',    Dv: 'dv', 
    Vism: 'vism',    'Abhi-s': 'abhas',

    // Mhv: '','Cūl': '',//島王統史,小王統史
    Sp: '',//一切善見律 
  }
  const pat1=/(.+),([^\d]+?)\.(\d+)\.(\d+)/
  const pat2=/(.+),([^\d]+?)\.(\d+)/
const ptspages={};
let prevbk='',prevptsbk;
lines.forEach(line=>{
    let mm, addr, ptsbk, vol=0, page;
    let m=line.match(pat1)
    if (m) [mm, addr, ptsbk, vol, page]=m;
    else {
        m=line.match(pat2);
        if (m) [mm, addr, ptsbk, page]=m;
        else throw 'wrong format '+line;
    }
    ptsbk=renames[ptsbk];
    if (!ptsbk)return;
    if (vol) ptsbk+=vol;
    const ma=addr.match(/^(\d+)_/);

    if (ptspages[ptsbk]&&ma[1]==prevbk && prevptsbk==ptsbk) { //第一筆不可省略, PTS 版 發趣論 與注夾雜  ,換書時也不可省  ( 55_358x3,Paṭṭh.2.243  55_359x8,PA.653 )
       addr=addr.substr( ma[0].length );
    }
    addr=addr.replace(/x0$/,'');
    prevbk=ma[1];
    prevptsbk=ptsbk;
    page=parseInt(page);
    if (!ptspages[ptsbk]) {
        ptspages[ptsbk]=[];
    }
    // console.log(addr,bk,vol,parseInt(page))
    if (ptspages[ptsbk][page]) {
        //第一次出現的才是正確位置
      //  console.log('repeated',line, ptspages[bk][page], addr)
    } else ptspages[ptsbk][page]=addr;
})

for (let bk in ptspages) {
    ptspages[bk]=ptspages[bk].join(',');
}
writeExtra(dbname+'/'+dbname+'.pts.js',
{"name":"cbeta0"+dbname,"type":"pts"},JSON.stringify(ptspages));