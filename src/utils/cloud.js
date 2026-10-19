// 잇결 서버(Vercel, tools/itgyeol-gift) — 주문·전시·결제를 여러 기기가 함께 본다.
// 서버가 안 열리면(오프라인·설정 전) 앱은 예전처럼 이 기기 안에서만 돈다.
export const CLOUD_URL = process.env.EXPO_PUBLIC_CLOUD_URL || 'https://itgyeol-gift.vercel.app';
const TIMEOUT_MS = 6000;

async function call(path, { method = 'GET', body } = {}) {
  if (!CLOUD_URL || typeof fetch !== 'function') throw new Error('NO_CLOUD');
  const ctl = typeof AbortController === 'function' ? new AbortController() : null;
  const timer = ctl ? setTimeout(() => ctl.abort(), TIMEOUT_MS) : null;
  try {
    const r = await fetch(`${CLOUD_URL}${path}`, {
      method,
      headers: body ? { 'content-type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal: ctl ? ctl.signal : undefined,
    });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      const e = new Error(j.error || `HTTP ${r.status}`);
      e.status = r.status;
      e.data = j;
      throw e;
    }
    return j;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

export const cloud = {
  orders: () => call('/api/orders').then((j) => j.orders || []),
  addOrder: (order) => call('/api/orders', { method: 'POST', body: { order } }).then((j) => j.order),
  stepOrder: (no, action) => call('/api/orders', { method: 'PATCH', body: { no, action } }).then((j) => j.order),
  exhibit: () => call('/api/exhibit').then((j) => j.entries || []),
  putExhibit: (code, entry) => call('/api/exhibit', { method: 'POST', body: { code, entry } }).then((j) => j.entry),
  payConfig: () => call('/api/pay').then((j) => j.clientKey || null),
  confirmPay: (p) => call('/api/pay', { method: 'POST', body: p }).then((j) => j.order),
};
