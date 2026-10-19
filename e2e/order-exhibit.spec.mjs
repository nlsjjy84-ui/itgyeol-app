// 주문·전시가 기기 사이에 이어지는지 — 손님 폰과 업체 화면을 두 탭으로 띄우고, 서버는 진짜 서버 코드를 메모리로 돌린다
import { test, expect, carryPath, openHome } from './helpers.mjs';

async function openResult(page) {
  await openHome(page, carryPath(['jinbeop', 'tbd']));
  await page.getByText('박물관에서 만든 작품을 가져왔어요').click();
  await expect(page.getByText('무료로 가져가기 · 이미지 저장').filter({ visible: true })).toBeVisible();
}

test('주문: 손님이 모의 결제하면 업체 화면에 들어오고, 업체가 단계를 넘기면 서버 기록이 바뀐다', async ({ page, context, cloud }) => {
  test.setTimeout(150_000);
  await openResult(page);
  const vis = (t, o) => page.getByText(t, o).filter({ visible: true }).first();
  await vis('깜짝 사진 엽서 2장', { exact: true }).click();
  await vis('주문표 만들기').click();
  await vis(/^결제하기 \((모의|테스트)\)$/).click();
  await expect(vis('결제 전에 확인해 주세요')).toBeVisible();
  // 맞춤 제작 취소 기준에 동의하기 전에는 결제가 되지 않는다
  await vis(/^4,000원 결제 \(모의\)$/).click();
  expect(cloud.calls).not.toContain('POST /api/orders');
  await vis(/맞춤 제작품이라/).click();
  await vis(/^4,000원 결제 \(모의\)$/).click();
  await expect.poll(() => cloud.calls.includes('POST /api/orders')).toBe(true);

  // 서버에 들어간 주문: 앱이 보낸 금액이 아니라 서버 가격표로 다시 계산한 금액, 모의 결제 번호
  const saved = [...cloud.db.files.values()].filter((f) => f.pathname.startsWith('orders/')).map((f) => JSON.parse(f.body));
  expect(saved).toHaveLength(1);
  expect(saved[0].items.map((i) => i.key)).toEqual(['photo']);
  expect(saved[0].total).toBe(4000);
  expect(saved[0].payRef).toMatch(/^MOCK-/);

  // 업체 화면(다른 기기 역할의 두 번째 탭)
  const maker = await context.newPage();
  await openHome(maker);
  await maker.getByText('내 폰으로 하기 QR').filter({ visible: true }).first().click();
  await maker.getByText('업체 화면 (주문 제작) ›').click();
  await expect(maker.getByText('잇결 서버와 이어져 있어요.', { exact: false })).toBeVisible();
  await expect(maker.getByText(saved[0].no, { exact: false }).first()).toBeVisible();
  const before = cloud.calls.filter((c) => c === 'PATCH /api/orders').length;
  // 업체가 다음 단계로 넘긴다 → 서버 기록의 단계가 바뀐다
  const stageBefore = saved[0].stage;
  await maker.getByText(/만들기 시작|다 만들었|보냈|받을 준비/).filter({ visible: true }).first().click();
  await expect.poll(() => cloud.calls.filter((c) => c === 'PATCH /api/orders').length).toBeGreaterThan(before);
  const after = [...cloud.db.files.values()].filter((f) => f.pathname.startsWith('orders/')).map((f) => JSON.parse(f.body));
  expect(after[0].stage).not.toBe(stageBefore);
});

test('전시 신청: 결과 화면에서 켜면 서버 전시 목록에 별명과 나라만 올라간다', async ({ page, cloud }) => {
  await openResult(page);
  await page.getByText('이 작품을 전시해도 돼요').filter({ visible: true }).first().click();
  await expect.poll(() => cloud.calls.includes('POST /api/exhibit')).toBe(true);
  const rows = [...cloud.db.files.values()].filter((f) => f.pathname.startsWith('exhibit/')).map((f) => JSON.parse(f.body));
  expect(rows.length).toBe(1);
  const keys = Object.keys(rows[0]);
  expect(keys).not.toContain('name');
  expect(keys).not.toContain('phone');
});

test('서버에 닿지 않아도(오프라인) 결과 화면과 무료로 가져가기는 그대로 된다', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 420, height: 860 } });
  await ctx.route('https://itgyeol-gift.vercel.app/**', (r) => r.abort('internetdisconnected'));
  const page = await ctx.newPage();
  await openResult(page);
  await expect(page.getByText('무료로 가져가기 · 이미지 저장').filter({ visible: true })).toBeVisible();
  await ctx.close();
});
