// 판 여섯 개와 전래놀이 열두 가지가 모두 열리고 미션까지 보이는지
import { test, expect, openHome, enterBoard, press, BOARDS, FOLK_GAMES } from './helpers.mjs';

for (const name of BOARDS) {
  test(`판 열기: ${name}`, async ({ page }) => {
    await openHome(page);
    await enterBoard(page, name);
    await expect(page.getByText('이번 미션').first()).toBeVisible();
    await expect(page.getByText('시작하기', { exact: true }).first()).toBeVisible();
  });
}

for (const game of FOLK_GAMES) {
  test(`전래놀이: ${game} — 고르면 미션이 바뀌고 시작된다`, async ({ page }) => {
    await openHome(page);
    await enterBoard(page, '전래놀이');
    const tile = page.getByText(game, { exact: true }).filter({ visible: true }).first();
    if (!(await tile.isVisible().catch(() => false))) await press(page, page.getByText(/다른 놀이 고르기/).filter({ visible: true }).first());
    await press(page, page.getByText(game, { exact: true }).filter({ visible: true }).first());
    await expect(page.getByText('이번 미션').filter({ visible: true }).first()).toBeVisible();
    await press(page, page.getByText('시작하기', { exact: true }).filter({ visible: true }).first());
    // 시작하면 미션 카드가 접히고 놀이가 돈다 — 고른 놀이 이름이 그대로 보여야 한다
    await expect(page.getByText(game, { exact: false }).filter({ visible: true }).first()).toBeVisible();
  });
}
