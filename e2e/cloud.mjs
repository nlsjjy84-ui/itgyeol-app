// 테스트용 잇결 서버 — 진짜 서버 코드(tools/itgyeol-gift/api)를 그대로 부르고, 저장소만 메모리로 바꾼다.
// 그래서 앱 화면 ↔ 서버 규칙(주문 재계산, 단계 넘기기, 전시 정리)까지 한 번에 확인된다.
// 결제는 토스 키가 없는 상태(모의 결제)로 돈다.
import * as orders from '../tools/itgyeol-gift/api/orders.js';
import * as exhibit from '../tools/itgyeol-gift/api/exhibit.js';

const CLOUD = 'https://itgyeol-gift.vercel.app';

export function memoryDb() {
  const files = new Map();
  let t = 0;
  return {
    files,
    put: async (path, body) => {
      const pathname = path.replace('--x.json', `--${(++t).toString(36)}r.json`);
      files.set(pathname, { pathname, url: `u:${pathname}`, uploadedAt: new Date(Date.now() + t).toISOString(), body });
    },
    list: async ({ prefix }) => ({ blobs: [...files.values()].filter((f) => f.pathname.startsWith(prefix)), hasMore: false }),
    del: async (urls) => {
      for (const u of [].concat(urls)) files.delete(u.slice(2));
    },
    get: async (url) => JSON.parse(files.get(url.slice(2)).body),
  };
}

/** 이 브라우저 컨텍스트(손님 폰·업체 화면 등 여러 탭)가 같은 테스트 서버를 보게 한다 */
export async function useTestCloud(context, { offline = false } = {}) {
  const db = memoryDb();
  const calls = [];
  await context.route(`${CLOUD}/**`, async (route) => {
    const req = route.request();
    const url = new URL(req.url());
    calls.push(`${req.method()} ${url.pathname}`);
    if (offline) return route.abort('internetdisconnected');
    const init = { method: req.method(), headers: { 'content-type': 'application/json' } };
    if (!['GET', 'HEAD', 'OPTIONS'].includes(req.method())) init.body = req.postData() || '';
    const request = new Request(url.toString(), init);
    let res;
    if (url.pathname === '/api/orders') res = await orders.handle(request, { db });
    else if (url.pathname === '/api/exhibit') res = await exhibit.handle(request, { db });
    else if (url.pathname === '/api/pay') res = Response.json({ clientKey: null }); // 토스 키 없음 → 앱이 모의 결제로
    else res = Response.json({ error: 'NOT_IN_TEST' }, { status: 404 });
    const body = await res.text();
    await route.fulfill({
      status: res.status,
      body,
      headers: { 'content-type': 'application/json', 'access-control-allow-origin': '*' },
    });
  });
  return { db, calls };
}
