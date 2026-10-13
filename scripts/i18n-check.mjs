// 언어팩 자동 점검 — GitHub에 올릴 때마다(배포 과정) 실행된다.
// 1) 코드 안의 t('…') / tr('…') 문장과 영어팩의 문장 목록을 모아서, 언어별로 빠진 번역을 찾는다.
// 2) 물건·선택지·놀이 이름 같은 자료 번역도 영어팩과 같은 항목이 다 있는지 본다.
// 3) 그림책(book_*.js)의 쪽 수·대사 수가 영어판과 같은지 본다.
// 윈도우(D:\...)에서도 돌도록 파일 경로는 file:// 주소로 바꿔 불러온다.
// 빠진 번역은 앱에서 한국어로 보이므로 배포는 멈추지 않는다(--strict를 주면 실패로 처리).
import { readFileSync, readdirSync, statSync, appendFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const src = join(root, 'src');
const LANGS = ['en', 'zh', 'ja'];
const strict = process.argv.includes('--strict');

function walk(dir, out = []) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (p.endsWith('.js') && !p.includes(`${join('src', 'i18n')}`)) out.push(p);
  }
  return out;
}
const HANGUL = /[가-힣]/;
const found = new Set();
const re = /\b(?:t|tr|i18nT)\(\s*(['"])((?:\\.|(?!\1).)*)\1/g;
for (const f of walk(src)) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(re)) {
    const k = m[2].replace(/\\n/g, '\n').replace(/\\'/g, "'");
    if (HANGUL.test(k)) found.add(k);
  }
}

// 번역 함수 안에 `…${값}…` 꼴로 넣은 한국어 문장은 번역팩에서 찾을 수 없다 → {p0} 자리표시로 바꿔야 한다.
const tplBad = [];
const reTpl = /\b(?:t|tr|i18nT)\(\s*[^)]*?`[^`]*[가-힣][^`]*`/g;
for (const f of walk(src)) {
  const s = readFileSync(f, 'utf8');
  for (const m of s.matchAll(reTpl)) if (m[0].includes('${')) tplBad.push(`${f.slice(root.length + 1)}: ${m[0].slice(0, 70).replace(/\n/g, ' ')}`);
}

const packs = {};
for (const l of LANGS) packs[l] = (await import(pathToFileURL(join(src, 'i18n', `${l}.js`)).href)).default;
const books = {};
for (const l of LANGS) books[l] = (await import(pathToFileURL(join(src, 'i18n', `book_${l}.js`)).href)).default;

const allKeys = new Set([...found, ...Object.keys(packs.en.ui)]);
const lines = ['## 언어팩 점검 (Translation check)', ''];
let missingTotal = 0;
for (const l of LANGS) {
  const ui = packs[l].ui || {};
  const miss = [...allKeys].filter((k) => !(k in ui));
  const dataMiss = [];
  for (const kind of Object.keys(packs.en)) {
    if (kind === 'ui') continue;
    const ref = Object.keys(packs.en[kind] || {});
    const have = packs[l][kind] || {};
    ref.forEach((id) => { if (!(id in have)) dataMiss.push(`${kind}.${id}`); });
  }
  const bookMiss = [];
  for (const part of Object.keys(books.en.BOOK)) {
    const a = books.en.BOOK[part];
    const b = (books[l].BOOK || {})[part] || [];
    if (a.length !== b.length) bookMiss.push(`${part}: ${b.length}/${a.length}쪽`);
    else a.forEach((pg, i) => { if (pg.lines.length !== b[i].lines.length) bookMiss.push(`${part} ${i + 1}쪽 대사 수`); });
  }
  Object.keys(books.en.GAME_LINES).forEach((g) => { if (!(books[l].GAME_LINES || {})[g]) bookMiss.push(`놀이 대사 ${g}`); });
  const n = miss.length + dataMiss.length + bookMiss.length;
  missingTotal += n;
  lines.push(`### ${l} — ${n === 0 ? '빠진 번역 없음 ✅' : `빠진 번역 ${n}개 ⚠️`}`);
  miss.slice(0, 50).forEach((k) => lines.push(`- 문장: ${k.replace(/\n/g, ' ')}`));
  if (miss.length > 50) lines.push(`- …외 ${miss.length - 50}개`);
  dataMiss.slice(0, 30).forEach((k) => lines.push(`- 자료: ${k}`));
  bookMiss.forEach((k) => lines.push(`- 그림책: ${k}`));
  lines.push('');
}
if (tplBad.length) {
  lines.push(`### 번역할 수 없는 문장 꼴 ${tplBad.length}개 ⚠️ (\`…\${값}…\` → '…{p0}…')`);
  tplBad.forEach((k) => lines.push(`- ${k}`));
  lines.push('');
  missingTotal += tplBad.length;
}
lines.push(`코드에서 찾은 한국어 문장 ${found.size}개 · 영어팩 문장 ${Object.keys(packs.en.ui).length}개`);
const report = lines.join('\n');
console.log(report);
if (process.env.GITHUB_STEP_SUMMARY) appendFileSync(process.env.GITHUB_STEP_SUMMARY, report + '\n');
if (strict && missingTotal > 0) process.exit(1);
