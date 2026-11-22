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
  await expect(page.getByText('함께 이야기해 봐요')).toBeVisible();
  await expect(page.getByText(/새 이름을 붙인다면/)).toBeVisible();
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
  // 변형 틀을 여러 번 바꿔도 변형할 유물이 비지 않는다
  await page.getByText('합죽선', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('비어 있음')).toHaveCount(0);
  await page.getByText('유물 꽃', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('비어 있음')).toHaveCount(0);
  await page.getByText('변형!', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('변형 영상').filter({ visible: true }).first()).toBeVisible();
});

test('유물 합체: 공유 링크(?m=)로 열면 같은 영상이 바로 나온다', async ({ page }) => {
  await page.goto('/?m=' + encodeURIComponent('flower~42~n42506'));
  const msg = page.getByText('누군가 보낸 합체 영상이에요. 진짜 박물관 유물 조각으로 만들었어요.');
  for (let i = 0; i < 40 && !(await msg.isVisible().catch(() => false)); i += 1) {
    const agree = page.getByText('동의하고 시작하기').filter({ visible: true });
    if (await agree.count()) await agree.first().click().catch(() => {});
    else await page.waitForTimeout(250);
  }
  await expect(page.getByText('누군가 보낸 합체 영상이에요. 진짜 박물관 유물 조각으로 만들었어요.')).toBeVisible();
  await expect(page.getByText('변형 영상').filter({ visible: true }).first()).toBeVisible();
});

test('유물 합체: 자유 합체로 직접 놓고 영상 만들기', async ({ page }) => {
  await openHome(page);
  await page.getByText('첫 보따리 받기').filter({ visible: true }).first().click();
  await page.getByLabel('보따리 풀기').click();
  await page.getByText('작업대에서 합체하기').filter({ visible: true }).first().click();
  await page.getByText('자유 합체 — 내 마음대로').filter({ visible: true }).first().click();
  await expect(page.getByText('조각을 올려 보세요')).toBeVisible();
  await page.getByTestId('tray-0').click();
  await page.getByTestId('tray-1').click();
  await page.getByTestId('tray-2').click();
  await page.getByLabel('크게').click();
  await page.getByLabel('오른쪽으로').click();
  await page.getByText('합체!', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByText('합체 영상').filter({ visible: true }).first()).toBeVisible();
  await expect(page.getByText(/자유 합체/).filter({ visible: true }).first()).toBeVisible();
});

test('유물 합체: 선물 링크(?g=)로 열면 조각을 받는다', async ({ page }) => {
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

test('유물 합체: 장단 맞춰 합체하면 등급이 나온다', async ({ page }) => {
  test.setTimeout(120000);
  await page.goto('/?m=' + encodeURIComponent('flower~42~n42506'));
  const btn = page.getByText('장단 맞춰 합체하기 — 끼워질 때 톡!');
  for (let i = 0; i < 40 && !(await btn.isVisible().catch(() => false)); i += 1) {
    const agree = page.getByText('동의하고 시작하기').filter({ visible: true });
    if (await agree.count()) await agree.first().click().catch(() => {});
    else await page.waitForTimeout(250);
  }
  await btn.click();
  const pad = page.getByLabel('장단 맞춰 톡');
  await expect(page.getByText('장단 합체 중… 박에 맞춰 톡!')).toBeVisible();
  for (let i = 0; i < 10; i += 1) {
    await pad.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(700);
  }
  await expect(page.getByText(/장단 등급/)).toBeVisible({ timeout: 30000 });
});

test('유물 합체: 첫 보따리 뒤 홈에서 오늘의 보따리를 받는다(하루 한 번)', async ({ page }) => {
  await openHome(page);
  await page.getByText('첫 보따리 받기').filter({ visible: true }).first().click();
  await page.getByLabel('보따리 풀기').click();
  await expect(page.getByText(/첫 보따리! 자리마다 하나씩/)).toBeVisible();
  await openHome(page);
  await page.getByText(/오늘의 보따리 받기 — 1일째/).filter({ visible: true }).first().click();
  await page.getByLabel('보따리 풀기').click();
  await expect(page.getByText(/오늘의 보따리! 1일째 이어서 왔어요/)).toBeVisible();
  await openHome(page);
  await expect(page.getByText(/오늘의 보따리는 받았어요/).filter({ visible: true }).first()).toBeVisible();
});

test('유물 합체: 합체 전시관이 예시 작품을 틀고 QR을 보여 준다', async ({ page }) => {
  await openHome(page);
  await page.getByText('합체 전시관 (큰 화면)').filter({ visible: true }).first().click();
  await expect(page.getByText('잇결 · 유물 합체 전시관')).toBeVisible();
  await expect(page.getByText('이 영상을 내 폰으로')).toBeVisible();
  await expect(page.getByText(/작품 1 \/ \d+/)).toBeVisible();
});

test('유물 합체: 박물관 소장품번호로 진짜 유물 조각을 찾는다', async ({ page }) => {
  await openHome(page);
  await page.getByText('첫 보따리 받기').filter({ visible: true }).first().click();
  await page.getByTestId('scan-no').fill('덕수 1496');
  await page.getByText('찾기', { exact: true }).click();
  await expect(page.getByText(/진짜 유물을 찾았어요!/)).toBeVisible();
  await expect(page.getByText(/백자청화동채복숭아형연적|복숭아/).first()).toBeVisible();
});

test('유물 합체: 하루 빠져도 쉼표 부적이 이어 오기를 지켜 준다', async ({ page }) => {
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

test('유물 합체: 바꾸자 링크(?x=1)로 받으면 내 겹친 조각을 답례로 보낸다', async ({ page }) => {
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

test('유물 합체: 도감 조각을 열면 풍이가 쓰임·크기·있는 곳을 알려 준다', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('itgyeol_pieces_v1', JSON.stringify({ owned: { nmk_42506: 1 }, order: ['nmk_42506'], works: [], packs: 1, starter: true, codes: [], claimed: [] }));
  });
  await openHome(page);
  await page.getByText('조각 도감', { exact: true }).filter({ visible: true }).first().click();
  await page.getByLabel('백자청화동채복숭아형연적').first().click();
  await expect(page.getByTestId('piece-story')).toBeVisible();
  await expect(page.getByText('먹을 갈 때 벼루에 물을 한 방울씩 떨어뜨리던 작은 물병이야.')).toBeVisible();
  await expect(page.getByText('조선 사람들이 썼어.')).toBeVisible();
  await expect(page.getByText('길이는 7.3cm — 어른 손바닥만 해.')).toBeVisible();
  await expect(page.getByText('진짜는 국립중앙박물관에 있어. 가서 직접 찾아봐!')).toBeVisible();
});

test('유물 합체: 유물 수수께끼를 풀면 조각을 얻거나 정답을 알려 준다', async ({ page }) => {
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    localStorage.setItem('itgyeol_pieces_v1', JSON.stringify({ owned: { nmk_42506: 1 }, order: ['nmk_42506'], works: [], packs: 1, starter: true, codes: [], claimed: [] }));
  });
  await openHome(page);
  await page.getByText('유물 수수께끼 — 맞히면 조각을 가져요').filter({ visible: true }).first().click();
  await expect(page.getByTestId('riddle-q')).toBeVisible();
  await expect(page.getByText(/오늘 남은 문제 5개/)).toBeVisible();
  await page.getByTestId('riddle-opt-0').click();
  await expect(page.getByText(/맞았어요! 얼쑤!|아쉬워요. 정답은 \d번이에요./)).toBeVisible();
  await expect(page.getByText(/오늘 남은 문제 4개/)).toBeVisible();
  await page.getByText('다음 수수께끼').click();
  await expect(page.getByTestId('riddle-q')).toBeVisible();
});

test('유물 합체: 도감의 우리 땅 지도에서 지역을 누르면 그곳 조각만 보인다', async ({ page }) => {
  await openHome(page);
  await page.getByText('조각 도감', { exact: true }).filter({ visible: true }).first().click();
  await page.getByText('우리 땅 지도').click();
  await expect(page.getByTestId('region-map')).toBeVisible();
  await page.getByLabel('경상북도').click();
  await expect(page.getByText('나온 곳: 경상북도 ✕')).toBeVisible();
});

test('유물 합체: 작품 사진(PNG)을 저장하면 출동 장면이 담긴 그림 파일이 내려받아진다', async ({ page }) => {
  await page.goto('/?m=' + encodeURIComponent('whale~5~n42506.n69779.n26363.n7732.n91260.n112600.g367533'));
  const btn = page.getByText('작품 사진 저장 (PNG)').filter({ visible: true }).first();
  for (let i = 0; i < 40 && !(await btn.isVisible().catch(() => false)); i += 1) {
    const agree = page.getByText('동의하고 시작하기').filter({ visible: true });
    if (await agree.count()) await agree.first().click().catch(() => {});
    else await page.waitForTimeout(250);
  }
  await expect(page.getByTestId('jangdan')).toHaveText(/배경 장단: 중모리/);
  const [dl] = await Promise.all([page.waitForEvent('download'), btn.click()]);
  expect(dl.suggestedFilename()).toMatch(/^itgyeol_photo_.*\d{8}-\d{6}\.png$/);
  const path = await dl.path();
  const fs = await import('fs');
  const buf = fs.readFileSync(path);
  expect(buf.slice(1, 4).toString()).toBe('PNG');
  fs.copyFileSync(path, '/tmp/poster_e2e.png');
});

test('유물 합체: 오늘의 합체 미션 — 조건 맞춘 합체 영상을 만들면 귀한 조각을 받는다', async ({ page }) => {
  const fs = await import('fs');
  const keys = [...fs.readFileSync('src/data/pieces.js', 'utf8').matchAll(/"k": "([^"]+)"/g)].map((m) => m[1]).filter((k) => !k.startsWith('gogung'));
  await page.addInitScript((keys) => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', '1');
    const owned = {};
    keys.forEach((k) => (owned[k] = 1));
    localStorage.setItem('itgyeol_pieces_v1', JSON.stringify({ owned, order: keys, works: [], packs: 1, starter: true, codes: [], claimed: [] }));
  }, keys);
  await openHome(page);
  await page.getByText(/오늘의 합체 미션:/).filter({ visible: true }).first().click();
  await expect(page.getByTestId('mission-bar')).toBeVisible();
  await expect(page.getByText(/조각을 \d자리 이상 넣기 — 지금 \d+자리/)).toBeVisible();
  await page.getByText('합체!', { exact: true }).filter({ visible: true }).first().click();
  await expect(page.getByTestId('mission-win')).toBeVisible();
  await expect(page.getByText(/상으로 귀한 조각 「.+」을\(를\) 받았어요/)).toBeVisible();
});
