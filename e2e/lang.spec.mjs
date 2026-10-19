// 언어 바꾸기: 홈의 문장과 판 이름이 그 언어로 나오고, 고친 문장(여섯 판)도 번역돼 있는지
import { test, expect, openHome } from './helpers.mjs';

const CASES = [
  { btn: 'English', tagline: 'Six traditions at your fingertips', board: 'Mask dance' },
  { btn: '中文', tagline: '指尖上的六种传统', board: null },
  { btn: '日本語', tagline: '指先で出会う六つの伝統', board: null },
];

for (const c of CASES) {
  test(`언어: ${c.btn}`, async ({ page }) => {
    await openHome(page);
    await page.getByText(c.btn, { exact: true }).filter({ visible: true }).first().click();
    await expect(page.getByText(c.tagline, { exact: false })).toBeVisible();
    // 홈 첫머리 문장에 한국어가 남지 않아야 한다
    await expect(page.getByText('손끝으로 만나는', { exact: false })).toHaveCount(0);
    await expect(page.getByText('여섯 개의 판 — 어디부터 가도 돼요')).toHaveCount(0);
  });
}
