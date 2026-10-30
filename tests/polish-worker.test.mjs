// 해설 다듬기 중계 서버 보안 — 잇결 주소에서 온 요청만 받고, 같은 접속자는 1분에 20번까지만 받는다.
import test from 'node:test';
import assert from 'node:assert/strict';
import worker, { allowedOrigin, tooMany } from '../server/polish-worker.js';

test('다른 사이트에서 온 요청은 403으로 막는다', async () => {
  const res = await worker.fetch(new Request('https://w/', {
    method: 'POST', headers: { Origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{"base":"가"}',
  }), { ANTHROPIC_API_KEY: 'test' });
  assert.equal(res.status, 403);
  assert.equal(res.headers.get('access-control-allow-origin'), 'https://nlsjjy84-ui.github.io');
});

test('접근 주소를 정하지 않으면 잇결 웹 주소만 허용한다', () => {
  assert.equal(allowedOrigin({}), 'https://nlsjjy84-ui.github.io');
  assert.equal(allowedOrigin({ ALLOW_ORIGIN: 'https://kiosk.example' }), 'https://kiosk.example');
});

test('같은 접속자의 21번째 요청은 막고, 1분이 지나면 다시 받는다', () => {
  let blocked = false;
  for (let i = 0; i < 21; i += 1) blocked = tooMany('10.0.0.9', 1_000 + i);
  assert.equal(blocked, true);
  assert.equal(tooMany('10.0.0.9', 70_000), false);
  assert.equal(tooMany('10.0.0.10', 1_030), false);
});
