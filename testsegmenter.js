'use strict'
const {initVocabulary,segmentText}=require('pengine/segmenter');
const {loadJsonP}=require('pengine/textutil');

const data=`婆羅門聞：此世尊是阿羅漢  八萬四千 ④一百七十二　迦旃延
彼於此世界——天界、魔界、梵天界及沙門、婆羅門、人、天眾中，自得證悟，為〔他〕宣說正法。
彼說初善、中善、後善及文、義具足之教法，顯示圓滿清淨之梵行。
善哉！得見如是阿羅漢。`
let voc=loadJsonP('nc/nc.voc.js','utf8').split(/\r?\n/).map(item=>{
    const r=item.split(',');
    return [parseInt(r[0]),r[1]]
});
initVocabulary(voc);

const out=segmentText(data);
console.log(out)