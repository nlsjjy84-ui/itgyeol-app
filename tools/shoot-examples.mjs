// 예시 작품 450점을 실제 전통 재료로 다시 찍는다 — 앱의 결과 화면(같은 3D 코드)을 그대로 쓴다.
// (웹 빌드를 localhost:8777 에 띄운 뒤) node tools/shoot-examples.mjs [시작번호] [끝번호]   · 이미 찍은 것은 건너뛴다(중간에 끊겨도 이어서)
import { chromium } from 'playwright';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
const carrySrc = readFileSync(new URL('../src/utils/carry.js', import.meta.url), 'utf8');
const { packJourney } = await import(`data:text/javascript;base64,${Buffer.from(carrySrc).toString('base64')}`);
const src = readFileSync(new URL('../src/data/mockWorks.js', import.meta.url), 'utf8');
const works = JSON.parse(src.match(/export const MOCK_WORKS = (\[.*?\]);\n/s)[1]);
const OH = { '목': 'mok', '화': 'hwa', '토': 'to', '금': 'geum', '수': 'su' };
const from = +(process.argv[2] || 0), to = +(process.argv[3] || works.length);
const OUT = process.env.SHOT_OUT || 'shots'; mkdirSync(OUT, { recursive: true });
const hash = (s) => [...s].reduce((h, c) => Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);
const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
const shoot = async (w) => {
  const out = `${OUT}/${w.id}.png`;
  if (existsSync(out)) return;
  const attempts = (w.a || []).map(([sceneId, formationId], i) => ({ sceneId, formationId, mappingCode: `m${i}`, ohangKey: OH[(w.ohang || '목')[0]] || 'mok', speed: 'mid', seed: (hash(w.id + i) >>> 0) }));
  const playLog = { byGame: Object.fromEntries((w.raw && w.raw.g) || []), byScene: Object.fromEntries((w.raw && w.raw.s) || []) };
  const url = `http://localhost:8777/?w=${packJourney({ attempts, playLog })}&pick=${w.group}.${w.item}.${w.variant}&still=1`;
  const p = await b.newPage({ viewport: { width: 430, height: 900 }, deviceScaleFactor: 1.4 });
  try {
    await p.addInitScript(([base, accent]) => { localStorage.setItem('itgyeol_consent_v1', 'yes'); localStorage.setItem('itgyeol_taste_v1', JSON.stringify({ done: true, picks: [] })); localStorage.setItem('itgyeol_book_v1', JSON.stringify({ prologue: true, gates: {}, choice: {} })); localStorage.setItem('itgyeol_material_v1', JSON.stringify({ base, accent })); }, w.mat || [null, null]);
    await p.goto(url); await p.getByText('박물관에서 만든 작품을 가져왔어요').click({ timeout: 30000 });
    const c = p.locator('canvas').first(); await c.waitFor({ timeout: 60000 }); await c.scrollIntoViewIfNeeded({ timeout: 60000 });
    await p.waitForFunction(() => window.__shotReady === true, null, { timeout: 120000, polling: 500 });
    await p.waitForTimeout(800);
    // 화면 뒤 한지 무늬가 섞이지 않게 3D 캔버스 그림만 투명 배경으로 저장
    const data = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/png'));
    writeFileSync(out, Buffer.from(data.split(',')[1], 'base64'));
    console.log('ok', w.id, w.group + '/' + w.item, (w.mat || []).join('+'));
  } catch (e) { console.log('fail', w.id, String(e).slice(0, 120)); }
  await p.close();
};
const list = works.slice(from, to);
for (let i = 0; i < list.length; i += 2) await Promise.all(list.slice(i, i + 2).map(shoot));
await b.close();
