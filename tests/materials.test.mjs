// 실제 전통 재료 — 재료 목록 자료와 사양서의 재료·기법 줄
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { makerSpec, techniqueOf, materialLines } from '../src/utils/makerSpec.js';

// 자료 파일은 앱 코드(ES 모듈, .js)라 글로 읽어 data: 주소로 불러온다
const load = async (rel) => import(`data:text/javascript;base64,${Buffer.from(readFileSync(new URL(rel, import.meta.url), 'utf8')).toString('base64')}`);

test('재료 갈래 7개, 재료 35가지 — 모두 실제 사진·소장품이 붙은 look 값을 가진다', async () => {
  const { MATERIAL_GROUPS } = await load('../src/data/materialTree.js');
  assert.equal(MATERIAL_GROUPS.length, 7);
  const all = MATERIAL_GROUPS.flatMap((g) => g.items);
  assert.equal(all.length, 35);
  for (const m of all) {
    assert.match(m.look.color, /^#[0-9a-f]{6}$/i, m.id);
    assert.ok(m.look.rough >= 0 && m.look.rough <= 1, m.id);
    assert.ok(Array.isArray(m.samples), m.id);
  }
  // 대표 재료는 실물이 충분히 붙어 있어야 한다
  const by = Object.fromEntries(all.map((m) => [m.id, m]));
  for (const id of ['celadon', 'porcelain', 'silk', 'gold', 'najeon', 'yugi']) assert.ok(by[id].count >= 30, id);
});

test('떠오른 답 → 권하는 재료는 모두 실제 있는 재료', async () => {
  const { TASTE_TO_MATERIAL, suggestMaterials } = await load('../src/data/materialNames.js');
  const { MATERIAL_GROUPS } = await load('../src/data/materialTree.js');
  const ids = new Set(MATERIAL_GROUPS.flatMap((g) => g.items.map((m) => m.id)));
  for (const [k, [b, a]] of Object.entries(TASTE_TO_MATERIAL)) {
    assert.ok(ids.has(b), k);
    if (a) assert.ok(ids.has(a), k);
  }
  assert.deepEqual(suggestMaterials(['celadon']), { base: 'celadon', accent: null });
  assert.deepEqual(suggestMaterials([]), { base: null, accent: null });
});

test('사양서: 재료를 고르면 재료·기법·맡길 곳이 들어가고, 안 고르면 출력 공정 그대로', () => {
  assert.equal(techniqueOf('otchil', 'najeon'), '나전(자개 붙이기)');
  assert.equal(techniqueOf('otchil', null), '주칠 그림');
  assert.equal(techniqueOf('celadon', null), '상감(흰·검은 흙)');
  const mat = { base: { id: 'otchil', name: '옻칠' }, accent: { id: 'najeon', name: '자개(나전)' }, shops: [['통영나전칠기공방', '나전칠기', '경남 통영시', '']] };
  assert.ok(materialLines(mat).some((l) => l.includes('옻칠 바탕 + 무늬 자개(나전)')));
  const txt = makerSpec({ product: 'keyring', title: '맞춤 키링', code: 'ITG-1', mat });
  assert.match(txt, /전통 기법: 나전/);
  assert.match(txt, /통영나전칠기공방/);
  assert.doesNotMatch(txt, /풀컬러 3D 프린팅\(풀컬러 레진/);
  assert.match(makerSpec({ product: 'keyring', title: '맞춤 키링', code: 'ITG-1' }), /풀컬러 3D 프린팅/);
});

test('운영사 설정: 들어간 재료·묶음 이름이 모두 실제로 있고, 잘못된 값이어도 화면이 비지 않는다', async () => {
  const { OPERATOR } = await load('../src/config/operator.js');
  const { MATERIAL_GROUPS, MATERIAL_BY_ID } = await load('../src/data/materialTree.js');
  const opSrc = readFileSync(new URL('../src/utils/operator.js', import.meta.url), 'utf8').replace("import { OPERATOR } from '../config/operator';", 'const OPERATOR = {};');
  const { allowedGroups, allowedSuggest, visibleWorks } = await import(`data:text/javascript;base64,${Buffer.from(opSrc).toString('base64')}`);
  const ids = new Set(MATERIAL_GROUPS.flatMap((g) => g.items.map((m) => m.id)));
  const GROUPS = new Set(['keyring', 'badge', 'stamp', 'sumak', 'desk', 'bookmark', 'treasure', 'daily']);
  if (Array.isArray(OPERATOR.materials)) OPERATOR.materials.forEach((id) => assert.ok(ids.has(id), `없는 재료: ${id}`));
  if (OPERATOR.suggest) ['base', 'accent'].forEach((k) => OPERATOR.suggest[k] && assert.ok(ids.has(OPERATOR.suggest[k]), `없는 재료: ${OPERATOR.suggest[k]}`));
  if (Array.isArray(OPERATOR.exampleGroups)) OPERATOR.exampleGroups.forEach((g) => assert.ok(GROUPS.has(g), `없는 묶음: ${g}`));
  // 나전칠기 공방처럼 일부만 받으면 그것만, 전부 틀린 값이면 전부
  const lacquer = { materials: ['otchil', 'najeon', 'hwagak'] };
  assert.deepEqual(allowedGroups(MATERIAL_GROUPS, lacquer).flatMap((g) => g.items.map((m) => m.id)).sort(), ['hwagak', 'najeon', 'otchil']);
  assert.equal(allowedGroups(MATERIAL_GROUPS, { materials: ['없는재료'] }).length, MATERIAL_GROUPS.length);
  assert.deepEqual(allowedSuggest({ base: 'celadon', accent: null }, MATERIAL_BY_ID, lacquer), { base: null, accent: null });
  assert.deepEqual(allowedSuggest(null, MATERIAL_BY_ID, { ...lacquer, suggest: { base: 'otchil', accent: 'najeon' } }), { base: 'otchil', accent: 'najeon' });
  const works = [{ group: 'keyring' }, { group: 'daily' }];
  assert.equal(visibleWorks(works, { exampleGroups: ['daily'] }).length, 1);
  assert.equal(visibleWorks(works, { exampleGroups: ['없음'] }).length, 2);
});
