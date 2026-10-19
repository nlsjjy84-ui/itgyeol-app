// 그림책 대사 점검 — 판이 여섯 개가 된 뒤에도 대사가 판 수와 맞는지 (네 언어 모두)
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(p, import.meta.url), 'utf8');
const PACKS = { ko: '../src/data/book.js', en: '../src/i18n/book_en.js', zh: '../src/i18n/book_zh.js', ja: '../src/i18n/book_ja.js' };

for (const [lang, file] of Object.entries(PACKS)) {
  test(`${lang}: 결과 화면 에필로그가 0~6판을 모두 갖고 있다`, () => {
    const src = read(file);
    const block = src.slice(src.indexOf('const EPI_BY_COUNT = {'), src.indexOf('};', src.indexOf('const EPI_BY_COUNT = {')));
    for (let n = 0; n <= 6; n += 1) assert.match(block, new RegExp(`\\n\\s*${n}: \\[`), `${n}판 대사가 있어야 한다`);
  });
}

test('에필로그는 여섯 판까지 세고, 여섯 판을 다 해야 「다 돌았다」고 말한다', () => {
  const src = read('../src/data/book.js');
  assert.match(src, /Math\.min\(6, solvedCount/);
  assert.match(src, /n >= 6 \? B\.T\.epiNextAll\(\)/);
});

test('이미 있는 탈춤·단청 판을 "열릴지 몰라"라고 하지 않는다', () => {
  for (const file of Object.values(PACKS)) assert.doesNotMatch(read(file), /열릴지 몰라|opens next|会开|開くかも/);
});

test('판 수를 4로 적어 둔 곳이 없다 (화면 문장)', () => {
  const home = read('../src/screens/HomeScreen.js') + read('../src/ui/QuickTour.js') + read('../src/components/HomeNumbers.js') + read('../src/components/TraceReward.js');
  assert.doesNotMatch(home, /네 가지 전통|네 개의 판|\/ 4'|SCENE_ORDER\.length\)/);
});
