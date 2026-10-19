// 한 판을 끝까지 놀고 결과물까지, 그리고 여러 판 기록으로 결과 화면이 맞게 바뀌는지
import { test, expect, openHome, enterBoard, carryPath, paintDancheongStage1 } from './helpers.mjs';

test('단청 1단계를 끝까지 칠하면 조각이 생기고(1/6), 결과물 화면으로 이어진다', async ({ page }) => {
  test.setTimeout(240_000);
  await openHome(page);
  await enterBoard(page, '단청 · 전통 문양');
  await paintDancheongStage1(page);
  await expect(page.getByText('다 칠했어요! 단청 한 부재가 완성됐어요.')).toBeVisible();
  await expect(page.getByText('이어진 조각보 · 1/6')).toBeVisible();
  await expect(page.getByText('첫 조각이야! 오늘은 이걸로 박수 한 번 👏')).toBeVisible();
  await page.getByText('결과물 보기', { exact: true }).click();
  await expect(page.getByText('무료로 가져가기 · 이미지 저장').filter({ visible: true })).toBeVisible();
  await expect(page.getByText('첫 조각이야! 다음 판이 이 옆에 이어 붙을 거야 🧩')).toBeVisible();
});

/** QR 주소로 기록을 가져와 결과 화면을 연다 */
async function openResultWith(page, scenes) {
  await openHome(page, carryPath(scenes));
  await expect(page.getByText(`완성한 판 ${scenes.length} / 6`, { exact: false })).toBeVisible();
  await page.getByText('박물관에서 만든 작품을 가져왔어요').click();
}

test('여섯 판을 다 한 기록이면 에필로그가 「여섯 판이 다 모였다」로 맺는다', async ({ page }) => {
  await openResultWith(page, ['jinbeop', 'print', 'tbd', 'hangul', 'talchum', 'dancheong']);
  await expect(page.getByText('여섯 판이 다 모였다!! 조각보가 꽉 찼어 🎉')).toBeVisible();
  await expect(page.getByText('여섯 판을 다 돌았어!', { exact: false })).toBeVisible();
  // 이미 있는 판을 "열릴지 몰라"라고 하면 안 된다
  await expect(page.getByText(/열릴지 몰라/)).toHaveCount(0);
});

test('네 판까지 한 기록이면 「꽉 찼어」가 아니라 아직 안 가 본 판을 안내한다', async ({ page }) => {
  await openResultWith(page, ['jinbeop', 'print', 'tbd', 'hangul']);
  await expect(page.getByText('네 판의 흔적이 모였어! 조각보가 제법 넓어졌어 🧶')).toBeVisible();
  await expect(page.getByText('아직 안 가 본 판도 있어. 마당은 언제든 열려 있어 🚪')).toBeVisible();
  await expect(page.getByText(/꽉 찼어/)).toHaveCount(0);
});

test('결과 화면: 같은 기록이면 같은 작품 번호, 다른 기록이면 다른 번호', async ({ browser }) => {
  const codeOf = async (scenes) => {
    const ctx = await browser.newContext({ viewport: { width: 420, height: 860 } });
    const page = await ctx.newPage();
    await page.route('https://itgyeol-gift.vercel.app/**', (r) => r.abort());
    await openResultWith(page, scenes);
    const txt = await page.locator('body').innerText();
    await ctx.close();
    return (txt.match(/ITG[-A-Z0-9]{4,}/) || [''])[0];
  };
  const a = await codeOf(['jinbeop', 'tbd']);
  const b = await codeOf(['jinbeop', 'tbd']);
  const c = await codeOf(['print', 'hangul', 'dancheong']);
  expect(a).not.toBe('');
  expect(a).toBe(b);
  expect(c).not.toBe(a);
});
