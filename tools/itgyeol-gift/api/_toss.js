// 토스페이먼츠 — 테스트 키만 받는다(test_ck_ / test_sk_). 실제 돈은 오가지 않는다.
// 시크릿 키는 Vercel 환경 변수(TOSS_SECRET_KEY)에만 있고 앱·저장소에는 없다.
const API = 'https://api.tosspayments.com/v1/payments';

export function keys(env = process.env) {
  const ck = env.TOSS_CLIENT_KEY || '';
  const sk = env.TOSS_SECRET_KEY || '';
  const ok = ck.startsWith('test_ck_') && sk.startsWith('test_sk_');
  return ok ? { clientKey: ck, secretKey: sk } : null;
}

const auth = (sk) => `Basic ${Buffer.from(`${sk}:`).toString('base64')}`;

export async function tossConfirm({ paymentKey, orderId, amount }, { env, fetchImpl = fetch } = {}) {
  const k = keys(env);
  if (!k) return { ok: false, message: 'NOT_CONFIGURED' };
  const r = await fetchImpl(`${API}/confirm`, {
    method: 'POST',
    headers: { authorization: auth(k.secretKey), 'content-type': 'application/json' },
    body: JSON.stringify({ paymentKey, orderId, amount }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || j.status !== 'DONE') return { ok: false, message: j.message || `HTTP ${r.status}` };
  return { ok: true, data: j };
}

export async function tossCancel(paymentKey, reason, { env, fetchImpl = fetch } = {}) {
  const k = keys(env);
  if (!k) return { ok: false, message: 'NOT_CONFIGURED' };
  const r = await fetchImpl(`${API}/${encodeURIComponent(paymentKey)}/cancel`, {
    method: 'POST',
    headers: { authorization: auth(k.secretKey), 'content-type': 'application/json' },
    body: JSON.stringify({ cancelReason: reason }),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) return { ok: false, message: j.message || `HTTP ${r.status}` };
  const last = Array.isArray(j.cancels) && j.cancels.length ? j.cancels[j.cancels.length - 1] : null;
  return { ok: true, ref: last ? last.transactionKey : 'CANCELED' };
}
