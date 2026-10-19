// 서버 목록과 이 기기 목록 합치기 — 화면과 떨어진 순수 함수라 테스트로 바로 확인한다.
// 서버가 기준이다. 다만 아직 서버에 못 보낸 것(local: true)은 남겨 두었다가 다시 보낸다.

/** 주문: 번호(no)로 짝짓고, 서버에 있으면 서버 것을 쓴다 */
export function mergeOrders(local, remote) {
  const byNo = new Map();
  for (const o of Array.isArray(local) ? local : []) if (o && o.local) byNo.set(o.no, o);
  for (const o of Array.isArray(remote) ? remote : []) if (o && typeof o.no === 'string') byNo.set(o.no, o);
  return [...byNo.values()].sort((a, b) => ((a.log && a.log[0] && a.log[0].at) || 0) - ((b.log && b.log[0] && b.log[0].at) || 0));
}

/** 전시: 코드(code)로 짝짓는다. pending은 아직 서버에 못 보낸 코드 → 그 기기 값(없으면 내린 것)을 쓴다 */
export function mergeExhibit(local, remote, pending = new Set()) {
  const byCode = new Map();
  for (const e of Array.isArray(remote) ? remote : []) if (e && typeof e.code === 'string') byCode.set(e.code, e);
  const loc = new Map((Array.isArray(local) ? local : []).filter((e) => e && typeof e.code === 'string').map((e) => [e.code, e]));
  for (const code of pending) {
    if (loc.has(code)) byCode.set(code, loc.get(code));
    else byCode.delete(code);
  }
  return [...byCode.values()].sort((a, b) => (a.at || 0) - (b.at || 0));
}

/** 이 기기에서 신청한 작품만 */
export function mineOnly(entries, myCodes) {
  const mine = new Set(Array.isArray(myCodes) ? myCodes : []);
  return (Array.isArray(entries) ? entries : []).filter((e) => mine.has(e.code));
}

/** 토스 결제 주문 번호(orderId): 주문 번호 + 무작위 6자 (토스 규칙: 6~64자, 영문·숫자·-·_) */
export function tossOrderId(no, rand = Math.random) {
  const tail = Array.from({ length: 6 }, () => 'abcdefghjkmnpqrstuvwxyz23456789'[Math.floor(rand() * 31)]).join('');
  return `${no}-${tail}`;
}

/** 결제사에서 돌아온 주소 읽기: ?pay=ok&paymentKey=..&orderId=..&amount=.. / ?pay=fail&code=..&message=.. */
export function readPayReturn(search) {
  const q = new URLSearchParams(search || '');
  const pay = q.get('pay');
  if (pay === 'ok' && q.get('paymentKey') && q.get('orderId')) return { ok: true, paymentKey: q.get('paymentKey'), orderId: q.get('orderId'), amount: Number(q.get('amount')) };
  if (pay === 'fail') return { ok: false, code: q.get('code') || '', message: q.get('message') || '' };
  return null;
}
