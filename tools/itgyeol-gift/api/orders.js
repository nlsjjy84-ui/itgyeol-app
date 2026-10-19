import { cors } from './_lib.js';
import { readAll, readOne, writeOne, safeKey } from './_records.js';
import { rebuild, step } from './_shop.js';
import { tossCancel } from './_toss.js';

// 주문 — 손님 화면, 굿즈숍 키오스크, 업체 화면이 서로 다른 기기에서도 같은 주문을 본다.
// GET            → { orders }        (최근 7일)
// POST { order } → 모의·계산대 결제 주문 넣기 (토스 결제 주문은 /api/pay 가 넣는다)
// PATCH { no, action: 'advance' | 'cancel' }
const P = 'orders/';
const json = (body, status = 200) => Response.json(body, { status, headers: cors });
const pub = (o) => {
  const { payKey, ...rest } = o;
  return rest;
};

export async function handle(request, deps = {}) {
  const db = deps.db;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method === 'GET') {
    const rows = await readAll(P, db);
    rows.sort((a, b) => (a.log?.[0]?.at || 0) - (b.log?.[0]?.at || 0));
    return json({ orders: rows.map(pub) });
  }
  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'BAD_JSON' }, 400);
  }
  if (request.method === 'POST') {
    const o = rebuild(body && body.order);
    if (!o) return json({ error: 'BAD_ORDER' }, 400);
    if (await readOne(P, o.no, db)) return json({ error: 'EXISTS' }, 409);
    const tag = o.method === 'counter' ? 'COUNTER' : 'MOCK';
    o.payRef = `${tag}-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${o.no.replace(/[^A-Z0-9]/g, '').slice(-8)}`;
    await writeOne(P, o.no, o, db);
    return json({ order: pub(o) });
  }
  if (request.method === 'PATCH') {
    const no = body && body.no;
    if (!safeKey(no)) return json({ error: 'BAD_NO' }, 400);
    const cur = await readOne(P, no, db);
    if (!cur) return json({ error: 'NOT_FOUND' }, 404);
    const r = step(cur, body.action);
    if (r.error) return json({ error: r.error, order: pub(cur) }, 409);
    // 토스로 결제한 주문은 결제사에서도 환불한다(테스트 모드라 실제 돈은 오가지 않음)
    if (body.action === 'cancel' && cur.payKey) {
      const c = await (deps.tossCancel || tossCancel)(cur.payKey, '맞춤 제작 전 손님 취소');
      if (!c.ok) return json({ error: 'REFUND_FAILED', detail: c.message }, 502);
      r.order.refundRef = c.ref;
    }
    await writeOne(P, no, r.order, db);
    return json({ order: pub(r.order) });
  }
  return json({ error: 'METHOD' }, 405);
}

export const OPTIONS = (req) => handle(req);
export const GET = (req) => handle(req);
export const POST = (req) => handle(req);
export const PATCH = (req) => handle(req);
