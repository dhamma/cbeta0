'use strict'
const Errata={
    "N28n0015_001.xml":[
       [ '一一六二～二一六三','一一六二～一一六三']
    ],
    "N06n0004_001.xml":[
        ['〔原本無三一〕','三一']
    ],
    "N06n0004_011.xml":[
        ['五三～五六','五三～六六']
    ]
}
const fixfn=(fn,content)=>{
    if (!Errata[fn])return content;
    // console.log('fix',fn)
    Errata[fn].forEach(repl=>{
        content=content.replace(repl[0],repl[1]);
    })
    return content;
}
module.exports=fixfn;
