// 그림책에서 풍이/결이 말을 모두 뽑는다(고른 답에 따라 바뀌는 말은 고를 수 있는 답마다 한 번씩 불러 본다)
const out={};
function keysOf(o,acc,seen=new Set()){ if(!o||typeof o!=='object'||seen.has(o))return; seen.add(o);
  if(o.key&&Array.isArray(o.options)){acc[o.key]=[...(acc[o.key]||[]),...o.options.map(x=>x.id),o.silent].filter(Boolean);}
  for(const v of Array.isArray(o)?o:Object.values(o)) keysOf(v,acc,seen);}
function walk(o,acc,ctxs,seen=new Set()){ if(!o||typeof o!=='object'||seen.has(o))return; seen.add(o);
  if(o.who==='pung'||o.who==='gyeol'){
    if(typeof o.text==='string') acc.push([o.who,o.text]);
    else if(typeof o.text==='function') for(const c of ctxs){ try{const s=o.text(c); if(typeof s==='string') acc.push([o.who,s]);}catch(e){} }
    return;}
  for(const v of Array.isArray(o)?o:Object.values(o)) walk(v,acc,ctxs,seen);}
const kb=await import('/tmp/ld/src/data/book.js');
const packs={ko:{B:kb.getBook(),G:kb.getGameLines(),S:kb.getScenes()},en:(await import('/tmp/ld/src/i18n/book_en.js')).default,ja:(await import('/tmp/ld/src/i18n/book_ja.js')).default};
for(const [l,p] of Object.entries(packs)){const ks={};keysOf(p,ks);const ctxs=[{choice:{}}];for(const [k,ids] of Object.entries(ks)) for(const id of new Set(ids)) ctxs.push({choice:{[k]:id}});
  const acc=[];walk(p,acc,ctxs);out[l]=[...new Map(acc.map(a=>[a.join('|'),a])).values()];}
console.log(JSON.stringify(out));
