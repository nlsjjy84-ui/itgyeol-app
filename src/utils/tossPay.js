// 토스페이먼츠 테스트 결제(웹) — 결제창은 토스가 띄우고, 승인은 잇결 서버가 한다(금액을 서버가 다시 계산).
// 테스트 키라 실제 돈은 나가지 않는다. 키가 설정되지 않았거나 앱(안드로이드)에서는 모의 결제로 돈다.
import { Platform } from 'react-native';
import { cloud } from './cloud';
import { tossOrderId, readPayReturn } from './sync';
import { putConfirmed } from './orderStore';

const SDK = 'https://js.tosspayments.com/v2/standard';
const PENDING = 'itgyeol_pay_pending_v1';
let keyPromise = null;
let notice = null;
const noticeSubs = new Set();
const setNotice = (n) => {
  notice = n;
  noticeSubs.forEach((fn) => fn(n));
};

const web = () => Platform.OS === 'web' && typeof window !== 'undefined';

/** 테스트 결제를 쓸 수 있으면 클라이언트 키, 아니면 null */
export function tossKey() {
  if (!web()) return Promise.resolve(null);
  if (!keyPromise) keyPromise = cloud.payConfig().catch(() => null);
  return keyPromise;
}

function loadSdk() {
  if (window.TossPayments) return Promise.resolve(window.TossPayments);
  return new Promise((ok, fail) => {
    const s = document.createElement('script');
    s.src = SDK;
    s.onload = () => (window.TossPayments ? ok(window.TossPayments) : fail(new Error('SDK')));
    s.onerror = () => fail(new Error('SDK'));
    document.head.appendChild(s);
  });
}

/** 결제창 열기. draft: 주문 초안(placeOrder 결과), orderName: 결제창에 보일 이름 */
export async function startTossPay(draft, orderName) {
  const clientKey = await tossKey();
  if (!clientKey) return { fallback: true };
  const TossPayments = await loadSdk();
  const orderId = tossOrderId(draft.no);
  try {
    window.localStorage.setItem(PENDING, JSON.stringify({ draft, orderId }));
  } catch (e) {
    return { error: 'STORAGE' };
  }
  const back = `${window.location.origin}${window.location.pathname}`;
  const payment = TossPayments(clientKey).payment({ customerKey: TossPayments.ANONYMOUS });
  try {
    await payment.requestPayment({
      method: 'CARD',
      amount: { currency: 'KRW', value: draft.total },
      orderId,
      orderName: orderName.slice(0, 100),
      successUrl: `${back}?pay=ok`,
      failUrl: `${back}?pay=fail`,
    });
    return { redirected: true };
  } catch (e) {
    // 손님이 결제창을 닫은 경우 등
    return { error: (e && e.code) || 'CLOSED', message: e && e.message };
  }
}

/** 결제창에서 돌아왔으면 승인을 마무리한다(앱이 열릴 때 한 번) */
export async function finishTossPay() {
  if (!web()) return null;
  const ret = readPayReturn(window.location.search);
  if (!ret) return null;
  window.history.replaceState(null, '', window.location.pathname);
  let pending = null;
  try {
    pending = JSON.parse(window.localStorage.getItem(PENDING) || 'null');
    window.localStorage.removeItem(PENDING);
  } catch (e) {
    pending = null;
  }
  if (!ret.ok) {
    setNotice({ ok: false, message: ret.message });
    return notice;
  }
  if (!pending || pending.orderId !== ret.orderId) {
    setNotice({ ok: false, message: 'PENDING_LOST' });
    return notice;
  }
  setNotice({ busy: true });
  try {
    const order = await cloud.confirmPay({ paymentKey: ret.paymentKey, orderId: ret.orderId, amount: ret.amount, draft: pending.draft });
    putConfirmed(order);
    setNotice({ ok: true, order });
  } catch (e) {
    setNotice({ ok: false, message: (e && e.data && (e.data.detail || e.data.error)) || (e && e.message) });
  }
  return notice;
}

/** 결과 화면이 결제 결과 알림을 받는다 */
export function onPayNotice(fn) {
  noticeSubs.add(fn);
  fn(notice);
  return () => noticeSubs.delete(fn);
}
export const clearPayNotice = () => setNotice(null);
export const isPayReturn = () => web() && !!readPayReturn(window.location.search);
