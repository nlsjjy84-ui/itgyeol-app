// 해설 다듬기 중계 서버(예: Cloudflare Workers). 앱에는 열쇠를 넣지 않고, 이 서버만 모델 열쇠를 가진다.
// 배포 후 앱의 환경변수 EXPO_PUBLIC_POLISH_URL 에 이 주소를 넣으면 켜지고, 비우면 꺼진다.
// 환경변수: ANTHROPIC_API_KEY (서버 비밀값), ALLOW_ORIGIN (선택 — 비우면 잇결 웹 주소만 허용)
// 보안: 잇결 주소에서 온 요청만 받고(다른 사이트가 열쇠를 빌려 쓰지 못하게), 같은 접속자는 1분에 20번까지만 받는다.
const SYSTEM = [
  '너는 전통 물건 해설 문장의 "문장 다듬이"다.',
  '입력으로 받은 facts(고정 자료)와 base(기본 해설)에 있는 내용만 사용한다.',
  'facts·base에 없는 사실, 연도, 숫자, 인물, 지명, 유물 이름을 절대 보태지 않는다.',
  '의미를 바꾸지 않고 어색한 이음과 반복만 정리해 2~3문장으로 쓴다. 존댓말, 담백하게. 평가·칭찬·가르치는 말투(예: ~하세요, 잘했어요)는 쓰지 않는다.',
  '출력은 해설 문장만. 따옴표·머리말·영어는 쓰지 않는다.',
].join('\n');

const DEFAULT_ORIGIN = 'https://nlsjjy84-ui.github.io';
const LIMIT_PER_MINUTE = 20;
const hits = new Map(); // 접속자별 최근 1분 요청 시각(이 서버 인스턴스 메모리에만, 저장하지 않음)

export function allowedOrigin(env) {
  return (env && env.ALLOW_ORIGIN) || DEFAULT_ORIGIN;
}

export function tooMany(ip, now = Date.now()) {
  const key = ip || 'unknown';
  const recent = (hits.get(key) || []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) hits.clear();
  return recent.length > LIMIT_PER_MINUTE;
}

export default {
  async fetch(request, env) {
    const origin = allowedOrigin(env);
    const cors = { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'POST, OPTIONS' };
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (request.method !== 'POST') return new Response('POST only', { status: 405, headers: cors });
    if (request.headers.get('Origin') !== origin) return new Response('origin not allowed', { status: 403, headers: cors });
    if (tooMany(request.headers.get('CF-Connecting-IP'))) return new Response('too many requests', { status: 429, headers: { ...cors, 'Retry-After': '60' } });
    let body;
    try { body = await request.json(); } catch { return new Response('bad json', { status: 400, headers: cors }); }
    const facts = Array.isArray(body.facts) ? body.facts.slice(0, 8).map((s) => String(s).slice(0, 300)) : [];
    const base = String(body.base || '').slice(0, 900);
    if (!base) return new Response('no base', { status: 400, headers: cors });
    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env.ANTHROPIC_API_KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 300,
        system: SYSTEM,
        messages: [{ role: 'user', content: `facts:\n${facts.map((f) => `- ${f}`).join('\n')}\n\nbase:\n${base}` }],
      }),
    });
    if (!r.ok) return new Response('upstream error', { status: 502, headers: cors });
    const j = await r.json();
    const text = (j.content && j.content[0] && j.content[0].text) || '';
    return new Response(JSON.stringify({ text }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  },
};
