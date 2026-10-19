import { cors } from './_lib.js';
import { readOne, writeOne } from './_records.js';
import { rebuild } from './_shop.js';
import { keys, tossConfirm } from './_toss.js';

// 토스페이먼츠 테스트 결제
// GET              → { clientKey }  (테스트 키가 없으면 null → 앱은 모의 결제로 돈다)
// POST { paymentKey, orderId, amount, draft } → 서버가 금액을 다시 계산해 맞을 때만 토스에 승인을 요청하고 주문을 넣는다
const json = (body, status = 200) => Response.json(body, { status, headers: cors });

export async function handle(request, deps = {}) {
  const env = deps.env || process.env;
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  if (request.method === 'GET') {
    const k = keys(env);
    return json({ clientKey: k ? k.clientKey : null });
  }
  if (request.method !== 'POST') return json({ error: 'METHOD' }, 405);
  let b;
  try {
    b = await request.json();
  } catch (e) {
    return json({ error: 'BAD_JSON' }, 400);
  }
  const o = rebuild(b && b.draft);
  if (!o || o.method === 'counter') return json({ error: 'BAD_ORDER' }, 400);
  if (typeof b.paymentKey !== 'string' || typeof b.orderId !== 'string' || !b.orderId.startsWith(`${o.no}-`)) return json({ error: 'BAD_PAYMENT' }, 400);
  if (Number(b.amount) !== o.total) return json({ error: 'AMOUNT_MISMATCH', expected: o.total }, 400);
  const done = await readOne('orders/', o.no, deps.db);
  if (done) return json({ order: { ...done, payKey: undefined } });
  const c = await (deps.confirm || tossConfirm)({ paymentKey: b.paymentKey, orderId: b.orderId, amount: o.total }, { env });
  if (!c.ok) return json({ error: 'CONFIRM_FAILED', detail: c.message }, 402);
  o.method = c.data.method === '간편결제' ? 'easy' : 'card';
  o.payRef = `TOSS-${b.orderId}`;
  o.payKey = b.paymentKey;
  o.test = true;
  await writeOne('orders/', o.no, o, deps.db);
  const { payKey, ...pub } = o;
  return json({ order: pub });
}

export const OPTIONS = (req) => handle(req);
export const GET = (req) => handle(req);
export const POST = (req) => handle(req);
