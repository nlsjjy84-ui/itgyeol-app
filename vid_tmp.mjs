import { chromium } from 'playwright';
import fs from 'fs';
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const ctx = await b.newContext({ viewport: { width: 420, height: 900 }, acceptDownloads: true });
const p = await ctx.newPage();
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('http://localhost:4810/?m=' + encodeURIComponent(process.argv[2]));
const mb = p.getByText(/^변신! — 같은 조각으로/).filter({ visible: true }).first();
for (let i = 0; i < 40 && !(await mb.isVisible().catch(() => false)); i++) {
  const a = p.getByText(/동의하고/).filter({ visible: true });
  if (await a.count()) await a.first().click().catch(()=>{}); else await p.waitForTimeout(400);
}
await mb.click();
await p.waitForTimeout(1500);
const btn = p.getByText('영상 파일로 저장 (자막 포함)').filter({ visible: true }).first();
const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 90000 }), btn.click()]);
fs.copyFileSync(await dl.path(), process.argv[3]);
console.log('ok', fs.statSync(process.argv[3]).size);
await b.close();
