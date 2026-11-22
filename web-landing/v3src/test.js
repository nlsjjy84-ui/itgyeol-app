import { mountRelic } from './relic3d.js';
const P=new URLSearchParams(location.search);
for (const [id,b] of [['c1','monkey'],['c2','lotus'],['c3','bell']]) {
  const r=JSON.parse(P.get(b)||'[0,0,0]');
  mountRelic(document.getElementById(id),{bin:'m/'+b+'.bin',tex:'m/'+b+'.jpg',rot:r,spin:0,light:'day'}).then(s=>{s.onFrame=()=>{}; window['ok_'+b]=1});
}
