// 처음 온 사람의 길: 동의 → 질문 → 그림책 → 홈, 그리고 「3분 둘러보기」
import { test, expect, openHome } from './helpers.mjs';

test('동의 전에는 체험이 시작되지 않고, 개인 정보를 모으지 않는다고 알린다', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('이름이나 연락처 같은 개인 정보는 모으지 않아요.', { exact: false })).toBeVisible();
  await expect(page.getByText('여섯 개의 판 — 어디부터 가도 돼요')).toHaveCount(0);
  await page.getByText('동의하고 시작하기').click();
  await expect(page.getByText('대한민국 전통문화, 하면 뭐가 떠오르세요?')).toBeVisible();
});

test('시작 전 질문: 고른 것과 닿아 있는 예시를 보여 주고, 점수·순위는 없다', async ({ page }) => {
  await page.goto('/');
  await page.getByText('동의하고 시작하기').click();
  await page.getByText('농악·풍물', { exact: true }).click();
  await page.getByText('한글·훈민정음', { exact: true }).click();
  // 아래에 붙은 단추는 고를 때마다 글자가 바뀌며 움직여서, 멈춘 뒤 누른다
  const go = page.getByText('2개 떠올랐어요 · 예시 보기');
  await expect(go).toBeVisible();
  await go.click({ force: true });
  await expect(page.getByText('이런 작품이 놓일 수 있어요')).toBeVisible();
  await expect(page.getByText('예시는 가상의 놀이 기록으로 빚은 모양이에요.', { exact: false })).toBeVisible();
  await expect(page.getByText(/순위|랭킹|점수/)).toHaveCount(0);
});

test('그림책 프롤로그를 끝까지 넘기면 홈의 여섯 개 판에 닿는다', async ({ page }) => {
  await page.goto('/');
  await page.getByText('동의하고 시작하기').click();
  await page.getByText('떠오르는 게 없어요 · 예시 보기').click();
  await page.getByText('놀이하러 가기').click();
  // 톡 · 고르기 · 가만히 있기만으로 넘어간다
  for (let i = 0; i < 120; i += 1) {
    if (await page.getByText('여섯 개의 판 — 어디부터 가도 돼요').isVisible().catch(() => false)) break;
    const next = page.getByText(/^\s*(톡 ›|\(가만히 있는다\)|마당으로 ›)\s*$/).last();
    if (await next.isVisible().catch(() => false)) await next.click().catch(() => {});
    await page.waitForTimeout(150);
  }
  await expect(page.getByText('여섯 개의 판 — 어디부터 가도 돼요')).toBeVisible();
  await expect(page.getByText('판은 여섯 곳이야', { exact: false }).first()).toBeVisible();
});

test('홈: 판 여섯 개와 숫자(놀이 17가지·자료 121점·4개 언어)가 맞다', async ({ page }) => {
  await openHome(page);
  for (const n of ['진법', '훈민정음 · 인쇄', '전래놀이', '한글 테트리스', '탈춤 · 가면극', '단청 · 전통 문양']) {
    await expect(page.getByText(n, { exact: true }).first()).toBeVisible();
  }
  await expect(page.getByText('손끝으로 만나는 여섯 가지 전통', { exact: false })).toBeVisible();
  await expect(page.getByText('17가지')).toBeVisible();
  await expect(page.getByText('121점').first()).toBeVisible();
  await expect(page.getByText('똑같은 작품 0점')).toBeVisible();
  // 판이 여섯인데 예전 숫자(네 개·네 곳)가 남아 있으면 안 된다
  await expect(page.getByText(/네 개의 판|네 가지 전통|판은 네 곳/)).toHaveCount(0);
});

test('3분 둘러보기 ②: 예시 작품 450점으로 바로 간다', async ({ page }) => {
  await openHome(page);
  await expect(page.getByText('다 보고 나면 아래 여섯 개의 판에서 마음대로 골라 놀아요.')).toBeVisible();
  await page.getByText('가상의 놀이 기록으로 빚은 예시 450점').filter({ visible: true }).first().click({ timeout: 15000 });
  await expect(page.getByText('예시 둘러보기', { exact: true }).filter({ visible: true })).toBeVisible();
});

test('3분 둘러보기 ③: 전통 자료실 121점으로 바로 간다', async ({ page }) => {
  await openHome(page);
  await page.getByText('작품의 바탕이 된 실제 유물 121점').filter({ visible: true }).first().click({ timeout: 15000 });
  await expect(page.getByText('창작의 바탕이 되는 실제 전통 121점')).toBeVisible();
});
