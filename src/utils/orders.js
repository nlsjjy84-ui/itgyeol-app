// 결과물 주문 — 결제(모의)부터 업체 제작, 받기까지의 흐름. 화면과 떨어진 순수 함수라 테스트로 바로 확인한다.
// 실제 결제사·업체와는 아직 연결하지 않았다. 결제 번호는 MOCK-로 시작하고, 주문은 이 기기에만 저장한다
// (키오스크라면 굿즈숍 화면과 같은 기기). 실제 서비스에서는 결제사 승인 번호와 업체 주문 접수로 바뀌는 자리다.
//
// 흐름: 결제 완료 → 업체에 전달(제작 사양서·출력 파일) → 만드는 중 → 받을 준비(굿즈숍 수령 / 발송)
// 취소: 맞춤 제작품이라 업체가 만들기 시작하기 전까지만 전액 취소된다. 결제 전에 이 점을 알리고 동의를 받는다
//       (전자상거래법 제17조 제2항, 같은 법 시행령 제21조 — 주문에 따라 개별 생산되는 재화).
import { PRICES, orderTotal, orderItems, orderNumber } from './order.js';

/** 택배비(가정값) — 굿즈숍에서 찾으면 0원 */
export const SHIP_FEE = 3500;

export const STAGES = ['paid', 'sent', 'making', 'ready'];
export const STAGE_NAME = {
  paid: '결제 완료',
  sent: '업체에 전달',
  making: '만드는 중',
  ready: '받을 준비 끝',
  canceled: '취소·환불',
};
export const METHODS = { card: '신용·체크카드', easy: '간편결제', counter: '굿즈숍 계산대' };

const pad = (n) => String(n).padStart(2, '0');
const ymd = (d) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;

/** 결제 직전 금액: 물건 합계 + 택배비 */
export function payQuote(pick, how) {
  const items = orderItems(pick);
  const goods = orderTotal(pick);
  const ship = how === 'post' && goods > 0 ? SHIP_FEE : 0;
  return { items, goods, ship, total: goods + ship };
}

/**
 * 결제(모의)하고 주문을 만든다. 결제가 끝나면 바로 업체에 전달된다(사양서·출력 파일을 함께 넘김).
 * spec: 이 작품의 제작 사양서 글(없으면 null). seq: 같은 작품의 몇 번째 주문인지(주문 번호 꼬리).
 */
export function placeOrder({ code, pick, how, method, agreed, spec = null, seq = 1, now = Date.now() }) {
  const q = payQuote(pick, how);
  if (!q.items.length) return { error: 'EMPTY' };
  if (!agreed) return { error: 'NOT_AGREED' };
  if (!METHODS[method]) return { error: 'NO_METHOD' };
  const d = new Date(now);
  const no = `${orderNumber(code)}-${seq}`;
  const payRef = `MOCK-${ymd(d)}-${no.replace(/[^A-Z0-9]/g, '').slice(-8)}`;
  return {
    order: {
      no,
      code,
      items: q.items.map((k) => ({ key: k, price: PRICES[k] })),
      goods: q.goods,
      ship: q.ship,
      total: q.total,
      how,
      method,
      payRef,
      // 사양서의 주문 번호 줄을 이 주문 번호로 맞춘다(업체가 주문과 사양서를 바로 짝지을 수 있게)
      spec: spec ? spec.replace(/^주문 번호: .*$/m, `주문 번호: ${no}`) : null,
      stage: 'sent',
      log: [
        { stage: 'paid', at: now },
        { stage: 'sent', at: now },
      ],
    },
  };
}

/** 업체가 다음 단계로 넘긴다(건너뛰기 없음). 이미 끝났거나 취소된 주문은 그대로 둔다. */
export function advance(order, now = Date.now()) {
  const i = STAGES.indexOf(order.stage);
  if (i < 0 || i >= STAGES.length - 1) return order;
  const stage = STAGES[i + 1];
  return { ...order, stage, log: [...order.log, { stage, at: now }] };
}

/** 취소할 수 있나: 업체가 만들기 시작하기 전까지만 */
export const cancelable = (order) => order.stage === 'paid' || order.stage === 'sent';

export function cancel(order, now = Date.now()) {
  if (!cancelable(order)) return { error: 'ALREADY_MAKING', order };
  return { order: { ...order, stage: 'canceled', refund: order.total, log: [...order.log, { stage: 'canceled', at: now }] } };
}

/** 저장소에서 읽은 값 정리 — 깨진 항목은 버린다 */
export function cleanOrders(raw) {
  return Array.isArray(raw) ? raw.filter((o) => o && typeof o.no === 'string' && Array.isArray(o.log)) : [];
}

/** 받는 방법에 맞춘 마지막 단계 이름 */
export const readyText = (order) => (order.how === 'post' ? '보냈어요' : '굿즈숍에서 찾아가요');
