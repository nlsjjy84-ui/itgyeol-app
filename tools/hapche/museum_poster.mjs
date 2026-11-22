// 박물관 현장 QR 포스터(입구 ?c=, 진열장 ?no=) PDF 만들기 — 저장소 맨 위에서: node tools/hapche/museum_poster.mjs (playwright·qrcode 필요)
import QRCode from 'qrcode';
import fs from 'fs';
import { chromium } from 'playwright';
const SITE = 'https://nlsjjy84-ui.github.io/itgyeol-app/';
const src = fs.readFileSync('src/data/pieces.js', 'utf8');
const P = [...src.matchAll(/\[(\{.*?\}), require/g)].map((m) => JSON.parse(m[1]));
const img = (k) => 'data:image/webp;base64,' + fs.readFileSync(`assets/pieces/${k}.webp`).toString('base64');
const qr = (u) => QRCode.toDataURL(u, { margin: 1, width: 600, color: { dark: '#1b2227', light: '#ffffff' } });
const M = [
  { c: 'SEOUL', name: '국립중앙박물관', region: '서울', pick: (p) => p.by === '국립중앙박물관' && p.rare >= 1 },
  { c: 'GOGUNG', name: '국립고궁박물관', region: '궁궐', pick: (p) => p.by === '국립고궁박물관' && p.rare >= 1 },
  { c: 'GYEONGJU', name: '국립경주박물관', region: '경주', pick: (p) => (p.from || '').includes('경주') },
  { c: 'BUYEO', name: '국립부여박물관', region: '부여', pick: (p) => (p.from || '').includes('부여') },
  { c: 'GONGJU', name: '국립공주박물관', region: '공주', pick: (p) => (p.from || '').includes('공주') },
  { c: 'GIMHAE', name: '국립김해박물관', region: '김해', pick: (p) => (p.from || '').includes('김해') },
  { c: 'CHEONGJU', name: '국립청주박물관', region: '청주', pick: (p) => (p.from || '').includes('청주') },
];
const css = `@page{size:A4;margin:0}body{margin:0;font-family:'Noto Sans CJK KR','Noto Sans KR',sans-serif;color:#1b2227}
.pg{width:210mm;height:297mm;box-sizing:border-box;padding:16mm 16mm;background:#f6f2ea;page-break-after:always;position:relative;overflow:hidden}
.k{color:#b3322b;font-weight:700;letter-spacing:.2em;font-size:12pt}
h1{font-family:'Noto Serif CJK KR',serif;font-size:30pt;line-height:1.25;margin:4mm 0 2mm}
h1 em{font-style:normal;color:#b3322b}
.sub{font-size:13pt;line-height:1.7;margin:0}
.qr{position:absolute;right:16mm;top:108mm;width:78mm;text-align:center}
.qr img{width:78mm;height:78mm;background:#fff;padding:3mm;border-radius:4mm}
.qr p{font-size:11pt;margin:2mm 0 0;word-break:break-all}
.steps{position:absolute;left:16mm;top:110mm;width:94mm;font-size:13pt;line-height:1.6}
.steps b{display:inline-block;width:9mm;height:9mm;border-radius:50%;background:#b9781a;color:#fff;text-align:center;line-height:9mm;margin-right:3mm}
.steps div{margin-bottom:6mm}
.pcs{position:absolute;left:16mm;right:16mm;bottom:30mm;display:flex;justify-content:space-around;align-items:flex-end}
.pcs figure{margin:0;text-align:center;width:52mm}.pcs img{max-width:48mm;max-height:52mm}.pcs figcaption{font-size:10pt;margin-top:2mm}
.foot{position:absolute;left:16mm;right:16mm;bottom:10mm;font-size:9pt;color:#6b5d4d;line-height:1.5}
.lab{display:grid;grid-template-columns:1fr 1fr;gap:5mm;margin-top:6mm}
.l{background:#fff;border-radius:4mm;padding:4mm;display:grid;grid-template-columns:1fr 30mm;grid-template-rows:34mm auto;gap:2mm 4mm;height:56mm;box-sizing:border-box}
.l .im{height:34mm;display:flex;align-items:center;justify-content:center}.l .im img{max-width:100%;max-height:34mm}
.l .tx{grid-column:1 / 3;font-size:9.5pt;line-height:1.45}.l .tx b{font-size:11.5pt;display:block}
.l .q img{width:30mm;height:30mm}`;
let html = `<html><head><meta charset="utf-8"><style>${css}</style></head><body>`;
for (const m of M) {
  const pcs = P.filter(m.pick).slice(0, 3);
  const url = `${SITE}?c=${m.c}`;
  html += `<div class="pg"><p class="k">잇결 · 유물 합체 · 박물관 현장 QR</p>
  <h1>${m.name}에 왔다면<br><em>이곳에서만 나오는 조각</em>을<br>받아 가세요</h1>
  <p class="sub">휴대폰 카메라로 QR을 찍으면 잇결이 열리고, 「${m.region}」 한정 조각이 보따리에 섞이기 시작합니다. 설치도 로그인도 필요 없습니다.</p>
  <div class="steps"><div><b>1</b>QR을 찍어 잇결을 엽니다.</div><div><b>2</b>보따리를 풀면 ${m.region === '궁궐' ? '궁궐' : '이 고장'} 유물 조각이 더 잘 나옵니다.</div><div><b>3</b>전시실 진열장의 소장품번호를 넣으면 눈앞의 그 유물이 조각이 됩니다.</div><div><b>4</b>조각을 합체해 나만의 영상을 만들고 가족에게 보내 보세요.</div></div>
  <div class="qr"><img src="${await qr(url)}"><p>${url}</p><p>암호: <b>${m.c}</b></p></div>
  <div class="pcs">${pcs.map((p) => `<figure><img src="${img(p.k)}"><figcaption>${p.name}</figcaption></figure>`).join('')}</div>
  <p class="foot">유물 사진: ${m.c === 'GOGUNG' ? '국립고궁박물관' : '국립중앙박물관'} 공공누리 제1유형 — 배경만 지우고 모양은 그대로 썼습니다. 이 포스터는 잇결 운영 방식(박물관 현장 → 놀이 → 합체 영상 → 다시 오기)을 보여 주는 예시입니다.</p></div>`;
}
// 진열장 설명판 스티커(소장품번호 QR) — 국립중앙박물관 소장품 중 번호가 있는 조각
const lab = P.filter((p) => p.by === '국립중앙박물관' && p.no && /\d/.test(p.no) && p.era).slice(0, 400).filter((_, i) => i % 33 === 0).slice(0, 8);
html += `<div class="pg"><p class="k">진열장 설명판 옆에 붙이는 QR 스티커(예시)</p><h1 style="font-size:24pt">찍으면 <em>눈앞의 그 유물</em>이 조각이 됩니다</h1><div class="lab">`;
for (const p of lab) {
  const u = `${SITE}?no=${encodeURIComponent(p.no)}`;
  html += `<div class="l"><div class="im"><img src="${img(p.k)}"></div><div class="q"><img src="${await qr(u)}"></div><div class="tx"><b>${p.name}</b>${p.era} · 소장품번호 ${p.no} · QR을 찍으면 이 유물 조각을 받아요</div></div>`;
}
html += `</div></div></body></html>`;
fs.writeFileSync('/tmp/poster/poster.html', html);
const b = await chromium.launch();
const pg = await b.newPage();
await pg.goto('file:///tmp/poster/poster.html');
await pg.waitForTimeout(800);
await pg.pdf({ path: '/mnt/user-data/outputs/잇결_박물관현장QR_포스터.pdf', format: 'A4', printBackground: true });
await pg.setViewportSize({ width: 794, height: 1123 });
await pg.screenshot({ path: '/tmp/poster/p1.png' });
await b.close();
console.log('ok', lab.length);
