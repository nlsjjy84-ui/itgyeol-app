// 유물 합체(새 장르): 첫 보따리 → 도감 → 작업대 → 합체 영상 → 내 작품 저장 → 변형까지 끝까지 눌러 본다.
import { test, expect, openHome } from './helpers.mjs';

test('유물 합체: 첫 보따리 받고 합체 영상까지', async ({ page }) => {
  await openHome(page);
  await page.getByText('첫 보따리 받기').filter({ visible: true }).first().click();
  await page.getByLabel('보따리 풀기').click();
  await expect(page.getByText(/첫 보따리! 자리마다 하나씩/)).toBeVisible();
  await page.getByText('작업대에서 합체하기').filter({ visible: true }).first().click();
  await expect(page.getByText('합체 작업대').filter({ visible: true }).first()).toBeVisible();
  await page.getByText('하늘배', { exact: true }).filter({ visible: true }).first().click();
  await page.getByText('합체!', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('합체 영상').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/이 작품에 들어간 진짜 유물 \d+점/)).toBeVisible();
  await page.getByText('내 작품에 저장', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('내 작품에 저장했어요 ✓')).toBeVisible();
  await page.getByText('조각 도감', { exact: true }).filter({ visible: true }).last().click();
  await expect(page.getByText(/실제 유물 \d+점 중 \d+점을 모았어요/)).toBeVisible();
});

test('유물 합체: 조각 하나로 변형', async ({ page }) => {
  await openHome(page);
  await page.getByText('첫 보따리 받기').filter({ visible: true }).first().click();
  await page.getByLabel('보따리 풀기').click();
  await page.getByText('작업대에서 합체하기').filter({ visible: true }).first().click();
  await page.getByText('변형 — 조각 하나로 새 모양').filter({ visible: true }).first().click();
  await page.getByText('유물 꽃', { exact: true }).filter({ visible: true }).first().click();
  await page.getByText('변형!', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('변형 영상').filter({ visible: true }).first()).toBeVisible();
});
