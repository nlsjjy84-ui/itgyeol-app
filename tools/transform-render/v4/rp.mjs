import { chromium } from '/home/claude/itgyeol-app/node_modules/playwright/index.mjs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for (const s of process.argv.slice(2)) { const p=await b.newPage({viewport:{width:1200,height:1200}}); p.on('pageerror',e=>console.log(s,'ERR',e.message)); p.on('console',m=>{if(m.type()==='error')console.log(s,m.text())});
  await p.goto(`http://localhost:4192/p.html?s=${s}`.replace("await p.goto(`http://localhost:4192/p.html?s=${s}`)v","&v")); await p.waitForFunction(()=>document.title==='done',null,{timeout:400000}).catch(e=>console.log(s,'timeout'));
  await p.screenshot({path:`/tmp/k3/p_${s}.png`}); await p.close(); console.log('ok',s);}
await b.close();
