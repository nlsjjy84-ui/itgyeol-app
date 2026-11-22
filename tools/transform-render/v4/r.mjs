import { chromium } from '/home/claude/itgyeol-app/node_modules/playwright/index.mjs';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
for (const s of process.argv.slice(2)) { const [n,f]=s.split(':');
  const p=await b.newPage({viewport:{width:900,height:900}}); p.on('pageerror',e=>console.log(s,'ERR',e.message));
  await p.goto(`http://localhost:4192/t.html?n=${n}&f=${f}`);
  await p.waitForFunction(()=>document.title==='done',null,{timeout:300000}).catch(e=>console.log(s,'timeout'));
  console.log(s, JSON.stringify(await p.evaluate(()=>window.__size)));
  await p.screenshot({path:`/tmp/k3/t_${n}.png`}); await p.close(); }
await b.close();
