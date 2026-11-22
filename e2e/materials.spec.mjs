// 실제 전통 재료 고르기 · 전통 자료실 안의 재료/물건 갈래/만드는 곳
import { test, expect, openHome } from './helpers.mjs';

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
