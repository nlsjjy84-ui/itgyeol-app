const out={};
function walk(o,acc,seen=new Set()){ if(!o||typeof o!=='object'||seen.has(o))return; seen.add(o);
  if((o.who==='pung'||o.who==='gyeol')&&typeof o.text==='string'){acc.push([o.who,o.text]);return;}
  for(const v of Array.isArray(o)?o:Object.values(o)) walk(v,acc,seen);}
const kb=await import('/tmp/ld/src/data/book.js');
const packs={ko:{B:kb.getBook(),G:kb.getGameLines(),S:kb.getScenes()},en:(await import('/tmp/ld/src/i18n/book_en.js')).default,ja:(await import('/tmp/ld/src/i18n/book_ja.js')).default};
for(const [l,p] of Object.entries(packs)){const acc=[];walk(p,acc);out[l]=[...new Map(acc.map(a=>[a.join('|'),a])).values()];}
console.log(JSON.stringify(out));
