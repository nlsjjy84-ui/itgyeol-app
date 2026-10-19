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

test('탈춤·단청도 처음 들어가면 입구 이야기 2쪽이 먼저 뜬다', async ({ page }) => {
  await openHome(page);
  for (const [board, first, second] of [
    ['탈춤 · 가면극', '탈춤이야. 탈을 쓰고 장단에 맞춰 추는 우리 춤이야 🎭', '북이 치는 박에 맞춰 춤사위를 눌러 봐. 갈수록 장단이 빨라져!'],
    ['단청 · 전통 문양', '저 처마 밑 좀 봐. 알록달록한 무늬 보이지? 단청이야 🏯', '단청은 순서가 있어. 바탕칠 → 무늬 옮기기 → 색칠 → 선 긋기!'],
  ]) {
    await page.getByText(board, { exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByText('건너뛰기', { exact: true }).filter({ visible: true })).toBeVisible();
    const tok = page.getByText(/^\s*톡 ›\s*$/).filter({ visible: true }).last();
    for (const line of [first, second]) {
      for (let i = 0; i < 8 && !(await page.getByText(line).isVisible().catch(() => false)); i += 1) await tok.click().catch(() => {});
      await expect(page.getByText(line)).toBeVisible();
    }
    await openHome(page);
  }
});
