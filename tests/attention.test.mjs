// 판 섞기(어텐션) 점검 — 여섯 판이 모두 서로 다른 자리로 들어가는지
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attemptToVector, synthesizeAttention, SCENE_ORDER } from '../src/utils/attentionSynth.js';

const a = (sceneId, seed = 1234) => ({ sceneId, ohangKey: 'mok', speed: 'mid', seed });
const BOARDS = ['jinbeop', 'print', 'tbd', 'hangul', 'talchum', 'dancheong'];

test('여섯 판이 모두 섞는 단계의 장면 목록에 있다', () => {
  assert.deepEqual(SCENE_ORDER, BOARDS);
});

test('같은 기록이어도 판이 다르면 벡터가 다르다 (탈춤 ≠ 단청)', () => {
  const vecs = BOARDS.map((id) => JSON.stringify(attemptToVector(a(id))));
  assert.equal(new Set(vecs).size, 6);
});

test('탈춤·단청을 섞으면 결과 모양 값이 서로 다르다', () => {
  const t = synthesizeAttention([a('jinbeop', 11), a('talchum', 22)]);
  const d = synthesizeAttention([a('jinbeop', 11), a('dancheong', 22)]);
  assert.notDeepEqual(t.shapeWeights, d.shapeWeights);
  assert.ok(Math.abs(t.attentionBySceneId.talchum + t.attentionBySceneId.jinbeop - 1) < 1e-9);
});

test('벡터 길이와 값은 그대로 32칸, 숫자', () => {
  for (const id of BOARDS) {
    const v = attemptToVector(a(id, 98765));
    assert.equal(v.length, 32);
    assert.ok(v.every(Number.isFinite));
  }
});
