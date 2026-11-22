// 유물 모으기: 놀이·선물·오늘의 보따리로 얻은 진짜 유물을 도감에서 본다. (2026-11-22 합체를 빼며 hapche.spec에서 옮김)
import { test, expect, openHome, carryPath } from './helpers.mjs';

test('유물: 선물 링크(?g=)로 열면 조각을 받는다', async ({ page }) => {
  await page.goto('/?g=n42506&n=' + encodeURIComponent('풍이'));
  const msg = page.getByText('풍이 님이 유물 조각을 선물했어요! 보따리를 풀어 보세요.');
  for (let i = 0; i < 40 && !(await msg.isVisible().catch(() => false)); i += 1) {
    const agree = page.getByText('동의하고 시작하기').filter({ visible: true });
    if (await agree.count()) await agree.first().click().catch(() => {});
    else await page.waitForTimeout(250);
  }
  await expect(msg).toBeVisible();
  await page.getByLabel('보따리 풀기').click();
  await expect(page.getByText('선물 받은 조각이에요! 도감에 들어갔어요.')).toBeVisible();
});

test('유물: 하루 빠져도 쉼표 부적이 이어 오기를 지켜 준다', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const f = (n) => {
      const d = new Date();
      d.setDate(d.getDate() - n);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    localStorage.setItem(
      'itgyeol_pieces_v1',
      JSON.stringify({ owned: { nmk_42506: 1 }, order: ['nmk_42506'], works: [], packs: 1, starter: true, codes: [], claimed: [], daily: { last: f(2), streak: 6, charms: 1, days: [f(7), f(6), f(5), f(4), f(3), f(2)] } })
    );
  });
  await openHome(page);
  await expect(page.getByText(/빠진 날을 부적이 지켜 줄 거예요/).filter({ visible: true }).first()).toBeVisible();
  await page.getByText(/오늘의 보따리 받기 — 7일째/).filter({ visible: true }).first().click();
  await page.getByLabel('보따리 풀기').click();
  await expect(page.getByText(/빠진 1일은 쉼표 부적이 지켜 줬어요/)).toBeVisible();
  await expect(page.getByTestId('milestone')).toBeVisible();
  await expect(page.getByText(/쉼표 부적 하나를 받았어요/)).toBeVisible();
});

test('유물: 바꾸자 링크(?x=1)로 받으면 내 겹친 조각을 답례로 보낸다', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('itgyeol_pieces_v1', JSON.stringify({ owned: { nmk_112600: 2, nmk_26363: 1 }, order: ['nmk_112600', 'nmk_26363'], works: [], packs: 1, starter: true, codes: [], claimed: [] }));
  });
  await page.goto('/?g=n42506&x=1&n=' + encodeURIComponent('풍이'));
  const msg = page.getByText('풍이 님이 유물 조각을 선물했어요! 보따리를 풀어 보세요.');
  for (let i = 0; i < 40 && !(await msg.isVisible().catch(() => false)); i += 1) {
    const agree = page.getByText('동의하고 시작하기').filter({ visible: true });
    if (await agree.count()) await agree.first().click().catch(() => {});
    else await page.waitForTimeout(250);
  }
  await page.getByLabel('보따리 풀기').click();
  await expect(page.getByText('풍이 님이 조각을 바꾸자고 했어요')).toBeVisible();
  await page.getByTestId('swap-nmk_112600').click();
  await expect(page.getByText('답례 조각을 보낼 준비가 됐어요')).toBeVisible();
  await expect(page.getByText(/풍이 님에게 보내면 「인장」 조각이 건너가요/)).toBeVisible();
});

test('유물: 도감 조각을 열면 풍이가 쓰임·크기·있는 곳을 알려 준다', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('itgyeol_pieces_v1', JSON.stringify({ owned: { nmk_42506: 1 }, order: ['nmk_42506'], works: [], packs: 1, starter: true, codes: [], claimed: [] }));
  });
  await openHome(page);
  await page.getByText('유물 도감', { exact: true }).filter({ visible: true }).first().click();
  await page.getByLabel('백자청화동채복숭아형연적').first().click();
  await expect(page.getByTestId('piece-story')).toBeVisible();
  await expect(page.getByText('먹을 갈 때 벼루에 물을 한 방울씩 떨어뜨리던 작은 물병이야.')).toBeVisible();
  await expect(page.getByText('조선 사람들이 썼어.')).toBeVisible();
  await expect(page.getByText('길이는 7.3cm — 어른 손바닥만 해.')).toBeVisible();
  await expect(page.getByText('진짜는 국립중앙박물관에 있어. 가서 직접 찾아봐!')).toBeVisible();
  // 유물에 담긴 뜻 — 종류(연적)와 모양(복숭아)의 뜻이 출처와 함께 나온다
  await expect(page.getByTestId('piece-meaning')).toBeVisible();
  await expect(page.getByText('유물에 담긴 뜻')).toBeVisible();
  await expect(page.getByText(/서왕모의 천도복숭아처럼 오래 살기/)).toBeVisible();
  await expect(page.getByText(/문화포털 전통문양 「복숭아문」/)).toBeVisible();
});

test('유물: 유물 수수께끼를 풀면 조각을 얻거나 정답을 알려 준다', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('itgyeol_pieces_v1', JSON.stringify({ owned: { nmk_42506: 1 }, order: ['nmk_42506'], works: [], packs: 1, starter: true, codes: [], claimed: [] }));
  });
  await openHome(page);
  await page.getByText('유물 수수께끼', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByTestId('riddle-q')).toBeVisible();
  await expect(page.getByText(/오늘 남은 문제 5개/)).toBeVisible();
  await page.getByTestId('riddle-opt-0').click();
  await expect(page.getByText(/맞았어요! 얼쑤!|아쉬워요. 정답은 \d번이에요./)).toBeVisible();
  await expect(page.getByText(/오늘 남은 문제 4개/)).toBeVisible();
  await page.getByText('다음 수수께끼').click();
  await expect(page.getByTestId('riddle-q')).toBeVisible();
});

test('유물: 도감에서 이름으로 찾으면 그 조각만 보인다', async ({ page }) => {
  await openHome(page);
  await page.getByText('유물 도감', { exact: true }).filter({ visible: true }).first().click();
  await page.getByTestId('dex-search').fill('호랑이');
  await expect(page.getByText(/^\d+개 찾았어요$/)).toBeVisible();
  const n = Number((await page.getByText(/^\d+개 찾았어요$/).textContent()).match(/\d+/)[0]);
  expect(n).toBeGreaterThan(5);
  expect(n).toBeLessThan(200);
  await page.getByLabel('지우기').click();
  await expect(page.getByText(/^\d+개 찾았어요$/)).toHaveCount(0);
});

test('유물: 도감의 우리 땅 지도에서 지역을 누르면 그곳 조각만 보인다', async ({ page }) => {
  await openHome(page);
  await page.getByText('유물 도감', { exact: true }).filter({ visible: true }).first().click();
  await page.getByLabel('초록').click();
  await page.getByText('우리 땅 지도').click();
  await expect(page.getByTestId('region-map')).toBeVisible();
  await page.getByLabel('경상북도').click();
  await expect(page.getByText('나온 곳: 경상북도 ✕')).toBeVisible();
});

test('유물: 유물이 있으면 홈에서 오늘의 보따리를 받는다(하루 한 번)', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('itgyeol_pieces_v1', JSON.stringify({ owned: { nmk_42506: 1 }, order: ['nmk_42506'], works: [], packs: 1, starter: true, codes: [], claimed: [] }));
  });
  await openHome(page);
  await expect(page.getByText('놀이로 모은 진짜 유물 1점').filter({ visible: true }).first()).toBeVisible();
  await page.getByText(/오늘의 보따리 받기 — 1일째/).filter({ visible: true }).first().click();
  await page.getByLabel('보따리 풀기').click();
  await expect(page.getByText(/오늘의 보따리! 1일째 이어서 왔어요/)).toBeVisible();
  await openHome(page);
  await expect(page.getByText(/오늘의 보따리는 받았어요/).filter({ visible: true }).first()).toBeVisible();
});

test('유물: 홈에는 합체 칸이 없고, 놀이 판이 맨 위에 있다', async ({ page }) => {
  await openHome(page);
  await expect(page.getByText('오늘 놀 판 — 판을 깨면 진짜 유물을 얻어요')).toBeVisible();
  await expect(page.getByText(/합체 작업대|합체 전시관|새 장르 · 유물 합체/)).toHaveCount(0);
});

test('유물: 판을 마치고 받는 첫 보따리는 그 판의 유물이고, 왜 나왔는지 한 줄로 알려 준다', async ({ page }) => {
  await openHome(page, carryPath(['dancheong']));
  await page.getByText('박물관에서 만든 작품을 가져왔어요').click();
  await page.getByText('놀이 보상 — 진짜 유물 보따리 받기').click();
  await page.getByLabel('보따리 풀기').click();
  await expect(page.getByText(/첫 보따리! 단청 놀이에서 진짜 유물 \d점을 받았어요./)).toBeVisible();
  await expect(page.getByTestId('scene-reason')).toHaveText('색과 무늬를 입힌 그릇이 나와요 — 청자·백자·분청');
  await expect(page.getByText('놀이 보따리도 풀기')).toHaveCount(0);
});
