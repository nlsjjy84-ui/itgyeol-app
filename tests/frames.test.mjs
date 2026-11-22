// 합체 틀 점검 — 「변신!」 짝은 반드시 합체 틀(변형 틀이 아님), 틀 이름·설명·마지막 장면 대사가 빠짐없이 있다
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FRAMES, TRANSFORMS, FRAME_BY_ID } from '../src/data/frames.js';
import { readFileSync } from 'node:fs';

const hapche = readFileSync(new URL('../src/utils/hapche.js', import.meta.url), 'utf8');
const morph = Object.fromEntries([...hapche.match(/export const MORPH_TO = \{([^}]*)\}/)[1].matchAll(/(\w+): '(\w+)'/g)].map((m) => [m[1], m[2]]));

test('변신 짝은 모두 있는 합체 틀이고 변형 틀이 아니다', () => {
  for (const [from, to] of Object.entries(morph)) {
    assert.ok(FRAME_BY_ID[from], `${from} 틀이 있어야 한다`);
    assert.ok(FRAME_BY_ID[to], `${to} 틀이 있어야 한다`);
    assert.ok(!FRAME_BY_ID[to].parts, `${from} → ${to}: 변형 틀로는 변신할 수 없다`);
  }
});

test('모든 틀은 id가 겹치지 않고 이름·설명·마지막 장면 대사가 있다', () => {
  const all = [...FRAMES, ...TRANSFORMS];
  assert.equal(new Set(all.map((f) => f.id)).size, all.length);
  for (const f of all) {
    assert.ok(f.name && f.desc && f.kind, f.id);
    assert.match(hapche, new RegExp(`\\n  ${f.id}: '`), `${f.id} 마지막 장면 대사(MISSION)`);
  }
});
