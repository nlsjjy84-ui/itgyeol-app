import { chromium } from 'playwright';
const b=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}); 
for (const s of process.argv.slice(2)) {
  const p=await b.newPage({viewport:{width:900,height:900}});
  p.on('console',m=>{ if(m.type()==='error') console.log(s,'ERR',m.text())}); p.on('pageerror',e=>console.log(s,'PAGEERR',e.message));
  await p.goto('http://localhost:4191/scene.html?s='+s);
  await p.waitForFunction(()=>document.title==='done',null,{timeout:120000}).catch(e=>console.log(s,'timeout'));
  await p.screenshot({path:'/tmp/kr/out_'+s+'.png'}); await p.close();
}
await b.close();
