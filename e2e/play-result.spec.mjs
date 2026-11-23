// 한 판을 끝까지 놀고 결과물까지, 그리고 여러 판 기록으로 결과 화면이 맞게 바뀌는지
import { test, expect, openHome, enterBoard, carryPath, paintDancheongStage1 } from './helpers.mjs';

test('단청 1단계를 끝까지 칠하면 도자실이 20% 차고, 그 자리에서 보따리를 풀어 도자실에 전시한다', async ({ page }) => {
  test.setTimeout(240_000);
  await openHome(page);
  await enterBoard(page, '단청 · 전통 문양');
  await paintDancheongStage1(page);
  await expect(page.getByText('다 칠했어요! 단청 한 부재가 완성됐어요.')).toBeVisible();
  await expect(page.getByText('보따리에 진짜 유물 3점이 들었어요')).toBeVisible();
  await expect(page.getByTestId('hall-percent')).toContainText('20%');
  await expect(page.getByText('첫 보따리야! 나의 박물관에 첫 유물이 들어가 👏')).toBeVisible();
  await expect(page.getByText(/조각보/)).toHaveCount(0);
  await page.getByTestId('open-bundle').click();
  await expect(page.getByTestId('hall-odds')).toContainText('도자실 · 작은 진열장');
  await page.getByLabel('보따리 풀기').click();
  await expect(page.getByText(/첫 보따리! 단청 놀이에서 진짜 유물 \d점을 받았어요./)).toBeVisible();
  await page.getByText('도자실에 전시하기', { exact: true }).click();
  await expect(page.getByTestId('hall-head')).toContainText('도자실 · 작은 진열장');
  await expect(page.getByTestId('hall-head')).toContainText('완성도 20%');
});

/** QR 주소로 기록을 가져와 나의 박물관을 연다 */
async function openResultWith(page, scenes) {
  await openHome(page, carryPath(scenes));
  await expect(page.getByText(`열린 전시실 ${scenes.length} / 6`, { exact: false })).toBeVisible();
  await page.getByText('박물관에서 모은 기록을 가져왔어요').click();
}

test('여섯 판을 다 한 기록이면 전시실 여섯 곳이 모두 열린다', async ({ page }) => {
  await openResultWith(page, ['jinbeop', 'print', 'tbd', 'hangul', 'talchum', 'dancheong']);
  await expect(page.getByText(/박물관 완성도 \d+% · 열린 전시실 6 \/ 6/)).toBeVisible();
  for (const id of ['jinbeop', 'print', 'tbd', 'hangul', 'talchum', 'dancheong']) await expect(page.getByTestId('hall-' + id)).toContainText('20%');
});

test('네 판까지 한 기록이면 탈춤·단청 전시실은 아직 닫혀 있고, 누르면 그 판으로 가는 길을 알려 준다', async ({ page }) => {
  await openResultWith(page, ['jinbeop', 'print', 'tbd', 'hangul']);
  await expect(page.getByText(/박물관 완성도 \d+% · 열린 전시실 4 \/ 6/)).toBeVisible();
  await page.getByTestId('hall-dancheong').click();
  await expect(page.getByText('아직 문이 닫혀 있어요.')).toBeVisible();
  await expect(page.getByText('단청 판을 깨면 문이 열려요 — 하러 가기')).toBeVisible();
});

test('유물 굿즈 주문: 같은 유물·같은 물건이면 같은 주문 번호, 다른 물건이면 다른 번호', async ({ browser }) => {
  const codeOf = async (idx) => {
    const ctx = await browser.newContext({ viewport: { width: 420, height: 860 } });
    const page = await ctx.newPage();
    await page.route('https://itgyeol-gift.vercel.app/**', (r) => r.abort());
    await page.addInitScript(() => {
      localStorage.setItem('itgyeol_pieces_v1', JSON.stringify({ owned: { nmk_4220: 1 }, order: ['nmk_4220'], works: [], packs: 1, starter: true, codes: [], claimed: [] }));
    });
    await openResultWith(page, ['jinbeop', 'tbd']);
    await page.getByTestId('vitrine-nmk_4220').click();
    await page.getByTestId('lightbox').getByText('이 유물로 오늘의 물건 만들기', { exact: true }).click();
    await page.getByTestId('craft-order-' + idx).click();
    await page.getByTestId('relic-order').getByText('깜짝 사진 엽서 2장', { exact: true }).click();
    await page.getByTestId('relic-order').getByText('주문표 만들기').click();
    const txt = await page.getByTestId('relic-order').innerText();
    await ctx.close();
    return (txt.match(/ITG[-A-Z0-9]{4,}/) || [''])[0];
  };
  const a = await codeOf(0);
  const b = await codeOf(0);
  const c = await codeOf(1);
  expect(a).not.toBe('');
  expect(a).toBe(b);
  expect(c).not.toBe(a);
});
