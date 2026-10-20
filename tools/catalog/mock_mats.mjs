// 예시 작품 450점에 실제 전통 재료(바탕·무늬)를 정한다 — 물건마다 실제로 그 재료로 만드는 조합 안에서,
// 그 작품이 닿은 '떠오르는 것'(main)이 권하는 재료와 맞으면 그것을, 아니면 작품 번호로 고르게 돌린다.
import { readFileSync, writeFileSync } from 'node:fs';
const ROOT = new URL('../../', import.meta.url);
const load = async (rel) => import(`data:text/javascript;base64,${Buffer.from(readFileSync(new URL(rel, ROOT), 'utf8')).toString('base64')}`);
const { TASTE_TO_MATERIAL } = await load('src/data/materialNames.js');
const ITEM_MATS = {
  'keyring/mirror': [['bronze', null], ['bronze', 'silver'], ['yugi', null], ['silver', null]],
  'keyring/norigae': [['silver', 'jade'], ['silk', 'knot'], ['gold', 'gem'], ['silver', 'gem'], ['jade', null], ['otchil', 'najeon']],
  'keyring/brush': [['bamboo', null], ['bamboo', 'ink'], ['bamboo', 'hwagak']],
  'keyring/dice': [['bone', null], ['wood', null], ['jade', null]],
  'keyring/lock': [['yugi', null], ['iron', 'silver'], ['bronze', null]],
  'keyring/ink': [['ink', 'gilt'], ['ink', null]],
  'keyring/pouch': [['silk', 'knot'], ['silk', 'gilt'], ['ramie', 'knot'], ['cotton', 'knot']],
  'keyring/sogo': [['leather', 'dancheong'], ['paulownia', 'leather'], ['leather', null]],
  'keyring/ring': [['silver', null], ['jade', null], ['gold', null], ['yugi', null], ['silver', 'gem']],
  'keyring/mypae': [['otchil', 'najeon'], ['jade', null], ['silver', 'gem'], ['otchil', 'hwagak'], ['yugi', null], ['otchil', 'gilt']],
  'badge/mybadge': [['yugi', null], ['silver', null], ['otchil', 'najeon'], ['celadon', null], ['porcelain', null]],
  'stamp/mystamp': [['jade', null], ['granite', null], ['wood', null], ['bone', null], ['inkstone', null]],
  'desk/mycoaster': [['otchil', 'najeon'], ['wood', null], ['straw', null], ['buncheong', null], ['yugi', null]],
  'desk/mystele': [['granite', null], ['inkstone', null], ['bronze', null], ['jade', null]],
  'bookmark/mybookmark': [['yugi', null], ['silver', null], ['iron', 'silver'], ['gold', null]],
  'sumak/mysumak': [['earthen', null], ['buncheong', null]],
  'treasure/pagoda': [['granite', null]],
  'treasure/hanok': [['wood', 'hanji'], ['wood', 'dancheong']],
  'treasure/onggi': [['onggi', null]],
  'treasure/bell': [['bronze', null]],
  'treasure/moonjar': [['porcelain', null]],
  'treasure/bottari': [['silk', 'knot'], ['ramie', null]],
  'treasure/myjar': [['celadon', null], ['porcelain', null], ['buncheong', null], ['onggi', null]],
  'treasure/soban': [['wood', null], ['otchil', 'najeon']],
  'treasure/bandaji': [['wood', 'yugi'], ['wood', 'iron']],
  'treasure/maebyeong': [['celadon', null]],
  'daily/frame': [['hanji', null], ['silk', null]],
  'daily/towel': [['cotton', null]], 'daily/scarf': [['silk', null]], 'daily/pouch': [['cotton', null], ['silk', null]],
  'daily/spoonrest': [['porcelain', null]], 'daily/hanky': [['cotton', null], ['ramie', null]], 'daily/fan': [['hanji', 'bamboo']],
  'daily/postcard': [['hanji', null]], 'daily/cup': [['porcelain', null]],
};
const p = new URL('src/data/mockWorks.js', ROOT);
let src = readFileSync(p, 'utf8');
const m = src.match(/export const MOCK_WORKS = (\[.*?\]);\n/s);
const works = JSON.parse(m[1]);
const used = {};
for (const w of works) {
  const combos = ITEM_MATS[`${w.group}/${w.item}`] || [['hanji', null]];
  const sug = TASTE_TO_MATERIAL[w.main];
  let pick = sug && combos.find((c) => c[0] === sug[0] && (c[1] || null) === (sug[1] || null));
  if (!pick && sug) pick = combos.find((c) => c[0] === sug[0] || c[1] === sug[0]);
  if (!pick) { const k = `${w.group}/${w.item}`; used[k] = (used[k] || 0) + 1; pick = combos[(used[k] + w.id.charCodeAt(3)) % combos.length]; }
  w.mat = [pick[0], pick[1] || null];
}
src = src.replace(m[0], `export const MOCK_WORKS = ${JSON.stringify(works)};\n`);
writeFileSync(p, src);
const c = {}; works.forEach((w) => { const k = w.mat.join('+'); c[k] = (c[k] || 0) + 1; });
console.log(Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => k + ':' + v).join('  '));
