// 실제 전통 재료 고르기 · 전통 자료실 안의 재료/물건 갈래/만드는 곳
import { test, expect, openHome } from './helpers.mjs';

test('떠오른 답에 맞춰 재료를 먼저 권하고, 바꿔 고르면 홈에 고른 재료가 보인다', async ({ page }) => {
  await page.goto('/');
  await page.getByText('동의하고 시작하기').click();
  await page.getByText('농악·풍물', { exact: true }).click();
  const go = page.getByText('1개 떠올랐어요 · 예시 보기');
  await expect(go).toBeVisible();
  await go.click({ force: true });
  await page.getByText('놀이하러 가기').click();
  await expect(page.getByText('떠올린 것에 맞춰 먼저 골라 두었어요.', { exact: false })).toBeVisible();
  // 농악 → 바탕 가죽(장구·북 가죽면)
  await expect(page.getByText('가죽', { exact: true }).first()).toBeVisible();
  // 옻칠 바탕 + 자개 무늬로 바꾼다
  await page.getByText('칠·물감', { exact: true }).click();
  await page.getByText('옻칠', { exact: true }).first().click();
  await page.getByText('바탕 재료로').click();
  await page.getByText('옻칠', { exact: true }).first().click();
  await page.getByText('짐승·바다', { exact: true }).click();
  await page.getByText('자개(나전)', { exact: true }).first().click();
  await expect(page.getByText('나전', { exact: false }).first()).toBeVisible();
  await page.getByText('무늬 재료로').click();
  await page.getByText('이 재료로 놀기').click();
  for (let i = 0; i < 120; i += 1) {
    if (await page.getByText('여섯 개의 판 — 어디부터 가도 돼요').isVisible().catch(() => false)) break;
    const next = page.getByText(/^\s*(톡 ›|\(가만히 있는다\)|마당으로 ›)\s*$/).last();
    if (await next.isVisible().catch(() => false)) await next.click().catch(() => {});
    await page.waitForTimeout(150);
  }
  await expect(page.getByText('고른 재료: 옻칠 + 자개(나전)')).toBeVisible();
});

test('전통 자료실: 재료 › 실물·만드는 곳, 물건 갈래는 폴더 안의 폴더로 열린다', async ({ page }) => {
  await openHome(page);
  await page.getByText('전통 자료실', { exact: true }).last().click();
  await page.getByText('재료', { exact: true }).first().click();
  await page.getByText('놋쇠(유기)', { exact: true }).click();
  await expect(page.getByText('이 재료로 만든 실물', { exact: false })).toBeVisible();
  await expect(page.getByText('이 재료를 다루는 곳')).toBeVisible();
  await page.getByText('물건 갈래', { exact: true }).click();
  await page.getByText('의생활(옷·꾸밈)', { exact: true }).click();
  await page.getByText('관모', { exact: true }).first().click();
  await expect(page.getByText('갓·삿갓·패랭이 (입)', { exact: true }).first()).toBeVisible();
  await page.getByText('만드는 곳', { exact: true }).click();
  await expect(page.getByText('국악기', { exact: true })).toBeVisible();
});
