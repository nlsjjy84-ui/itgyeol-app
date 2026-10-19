// 서버 쪽 주문 규칙 — 앱(src/utils/order.js · orders.js)과 같은 값. 금액은 서버가 다시 계산해서 믿는다.
// 값이 앱과 같은지는 test.mjs가 앱 파일을 불러와 대조한다.
export const PRICES = {
  photo: 4000, badge: 15000, keyring: 15000, stamp: 20000, sumak: 18000, paperweight: 25000, coaster: 15000,
  bookmark: 12000, model: 45000, fan: 12000, towel: 15000, cup: 25000, spoonrest: 9000,
  hanky: 12000, scarf: 28000, pouch: 15000, postcard: 3000, frame: 18000,
};
export const SHIP_FEE = 3500;
export const STAGES = ['paid', 'sent', 'making', 'ready'];
export const METHODS = ['card', 'easy', 'counter'];

/** 앱이 보낸 주문 초안을 서버 기준으로 다시 만든다(금액·단계는 서버가 정함). 틀리면 null */
export function rebuild(draft, now = Date.now()) {
  if (!draft || typeof draft.no !== 'string' || !/^ITG-[A-Z0-9]{1,6}-\d{1,3}$/.test(draft.no)) return null;
  if (typeof draft.code !== 'string' || draft.code.length > 64) return null;
  const keys = Array.isArray(draft.items) ? [...new Set(draft.items.map((i) => (i && typeof i === 'object' ? i.key : i)))] : [];
  if (!keys.length || keys.some((k) => !(k in PRICES))) return null;
  const how = draft.how === 'post' ? 'post' : 'shop';
  const method = METHODS.includes(draft.method) ? draft.method : 'card';
  if (how === 'post' && method === 'counter') return null;
  const goods = keys.reduce((s, k) => s + PRICES[k], 0);
  const ship = how === 'post' ? SHIP_FEE : 0;
  return {
    no: draft.no,
    code: draft.code,
    items: keys.map((k) => ({ key: k, price: PRICES[k] })),
    goods,
    ship,
    total: goods + ship,
    how,
    method,
    spec: typeof draft.spec === 'string' ? draft.spec.slice(0, 8000) : null,
    stage: 'sent',
    log: [
      { stage: 'paid', at: now },
      { stage: 'sent', at: now },
    ],
  };
}

/** 업체가 다음 단계로 / 손님이 취소 — 앱 규칙과 같다 */
export function step(order, action, now = Date.now()) {
  if (action === 'advance') {
    const i = STAGES.indexOf(order.stage);
    if (i < 0 || i >= STAGES.length - 1) return { error: 'DONE' };
    const stage = STAGES[i + 1];
    return { order: { ...order, stage, log: [...order.log, { stage, at: now }] } };
  }
  if (action === 'cancel') {
    if (!(order.stage === 'paid' || order.stage === 'sent')) return { error: 'ALREADY_MAKING' };
    return { order: { ...order, stage: 'canceled', refund: order.total, log: [...order.log, { stage: 'canceled', at: now }] } };
  }
  return { error: 'BAD_ACTION' };
}
