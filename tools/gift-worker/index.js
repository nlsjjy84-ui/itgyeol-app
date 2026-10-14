// 잇결 깜짝 선물 사진 임시 저장소 — Cloudflare Worker + R2.
// POST /gift (image/jpeg, 3MB 이하) → 짐작할 수 없는 긴 번호로 저장하고 { url } 을 돌려준다.
// GET /g/<번호> → 사진 파일을 내려받게 준다. 버킷 수명 규칙으로 하루가 지난 파일은 자동으로 지워진다.
const ORIGIN = 'https://nlsjjy84-ui.github.io';
const cors = { 'access-control-allow-origin': ORIGIN, 'access-control-allow-methods': 'POST, OPTIONS', 'access-control-allow-headers': 'content-type' };

export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
    if (req.method === 'POST' && url.pathname === '/gift') {
      if (req.headers.get('content-type') !== 'image/jpeg') return new Response('jpeg only', { status: 415, headers: cors });
      const body = await req.arrayBuffer();
      if (body.byteLength > 3 * 1024 * 1024) return new Response('too large', { status: 413, headers: cors });
      const id = [...crypto.getRandomValues(new Uint8Array(18))].map((b) => b.toString(16).padStart(2, '0')).join('');
      await env.GIFTS.put(id, body, { httpMetadata: { contentType: 'image/jpeg' } });
      return Response.json({ url: `${url.origin}/g/${id}` }, { headers: cors });
    }
    const m = url.pathname.match(/^\/g\/([0-9a-f]{36})$/);
    if (req.method === 'GET' && m) {
      const obj = await env.GIFTS.get(m[1]);
      if (!obj) return new Response('24시간이 지나 지워졌어요.', { status: 404, headers: { 'content-type': 'text/plain; charset=utf-8' } });
      return new Response(obj.body, { headers: { 'content-type': 'image/jpeg', 'content-disposition': 'attachment; filename="itgyeol-gift.jpg"', 'cache-control': 'private, no-store' } });
    }
    return new Response('not found', { status: 404 });
  },
};
