// 처음 온 사람의 길: 동의 → 이야기 영상 → 홈, 그리고 「3분 둘러보기」
import { test, expect, openHome } from './helpers.mjs';

test('동의 전에는 체험이 시작되지 않고, 개인 정보를 모으지 않는다고 알린다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('이름이나 연락처 같은 개인 정보는 모으지 않아요.', { exact: false })).toBeVisible();
  await expect(page.getByText('오늘 놀 판 — 판을 깨면 진짜 유물을 얻어요')).toHaveCount(0);
  await page.getByText('동의하고 시작하기').click();
  // 2026-11-22: 시작 전 질문(떠오르는 것)은 뺐다 — 동의하면 바로 이야기 영상
  await expect(page.getByText('대한민국 전통문화, 하면 뭐가 떠오르세요?')).toHaveCount(0);
});

test('이야기 영상을 끝까지 보면 홈의 놀이 판에 닿는다', async ({ page }) => {
  test.setTimeout(300000); // 이야기 영상을 끝까지 본다
  await page.goto('/');
  await page.getByText('동의하고 시작하기').click();
  // 톡 · 고르기 · 가만히 있기만으로 넘어간다
  for (let i = 0; i < 700; i += 1) {
    if (await page.getByText('오늘 놀 판 — 판을 깨면 진짜 유물을 얻어요').isVisible().catch(() => false)) break;
    const next = page.getByText(/^\s*(다음 장면 ›|\(가만히 있는다\))\s*$/).last();
    if (await next.isVisible().catch(() => false)) await next.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(150);
  }
  await expect(page.getByText('오늘 놀 판 — 판을 깨면 진짜 유물을 얻어요')).toBeVisible();
  // 2026-11-22: 홈의 이야기 장면은 뺐다 — 홈 맨 위가 놀이 판
});

test('홈: 판 여섯 개와 숫자(6판·진짜 유물 2,903점·4개 언어)가 맞다', async ({ page }) => {
  await openHome(page);
  for (const n of ['진법', '훈민정음 · 인쇄', '전래놀이', '한글 테트리스', '탈춤 · 가면극', '단청 · 전통 문양']) {
    await expect(page.getByText(n, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText('손끝으로 만나는 여섯 가지 전통', { exact: false })).toBeVisible();
  await expect(page.getByText('6판')).toBeVisible();
  await expect(page.getByText('2,903점').first()).toBeVisible();
  // 옛 예시 작품 통계는 뺐다
  await expect(page.getByText(/예시 작품 \d+점/)).toHaveCount(0);
  // 판이 여섯인데 예전 숫자(네 개·네 곳)가 남아 있으면 안 된다
  await expect(page.getByText(/네 개의 판|네 가지 전통|판은 네 곳/)).toHaveCount(0);
});

test('3분 둘러보기 ②: 첫 유물 보따리를 열면 진짜 유물을 받는다', async ({ page }) => {
  await openHome(page);
  await expect(page.getByText('다 보고 나면 아래 여섯 개의 판에서 마음대로 골라 놀아요.')).toBeVisible();
  await page.getByText('처음 주는 보따리를 열어 진짜 박물관 유물을 받아요').filter({ visible: true }).first().click({ timeout: 15000 });
  await expect(page.getByText('유물 보따리', { exact: true }).filter({ visible: true })).toBeVisible();
});

test('3분 둘러보기 ③: 나의 박물관으로 바로 간다', async ({ page }) => {
  await openHome(page);
  await page.getByText('받은 유물을 전시하고, 그 쓰임과 뜻으로 오늘의 물건을 만들어요').filter({ visible: true }).first().click({ timeout: 15000 });
  await expect(page.getByText('나의 박물관', { exact: true }).filter({ visible: true })).toBeVisible();
});
