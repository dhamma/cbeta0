const indexPhrase_=(phrase,x0,offset)=>{
    const words=[];
    let consumed=1; //at least consumed one char
    for (let i=phrase.length;i>0;i--) {
        const subph=phrase.substr(0,i);
        if (!T[subph] && subph.length==1) T[subph]=[];//must index one character
        if (T[subph]) {
            words.push(subph);
            addPosting( T[subph],x0,offset+1);
            consumed=i;
            break;
        }
    }
    Segmented[x0]+=words.join('/')+' ';
    return consumed;
    /*
            if (ph) {
                do {
                    const subph=ph.substr(j,maxTokenLen);
                    const consumed=cb(subph,x0,offset+j);
                    if (!consumed) throw 'at least consumed one character'
                    j+=consumed;
                } while(j<ph.length);
            }*/
}
/*
const rawtokens=readFileSync('tokentable.txt','utf8').split(/\r?\n/);
 , Segmented=[];
let maxTokenLen=0;
rawtokens.forEach(item=>{
    const tk=item.split(',')[1];
    T[tk]=[];
    if (tk.length>maxTokenLen)maxTokenLen=tk.length;
});