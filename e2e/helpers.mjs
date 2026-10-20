// 테스트에서 함께 쓰는 동작. 화면 글자로 찾기 때문에, 글자가 바뀌면 테스트도 같이 고친다.
import { test as base, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { useTestCloud } from './cloud.mjs';

// 모든 테스트: 화면에서 자바스크립트 오류가 하나라도 나면 실패
export const test = base.extend({
  pageErrors: [
    async ({ page }, use) => {
      const errors = [];
      page.on('pageerror', (e) => errors.push(e.message));
      await use(errors);
      expect(errors, '화면 오류 없이 끝나야 한다').toEqual([]);
    },
    { auto: true },
  ],
  // 실제 서버(Vercel)에는 절대 닿지 않게: 모든 테스트가 메모리 서버를 쓴다
  cloud: [
    async ({ context }, use) => {
      await use(await useTestCloud(context));
    },
    { auto: true },
  ],
});
export { expect };

export const BOARDS = ['진법', '훈민정음 · 인쇄', '전래놀이', '한글 테트리스', '탈춤 · 가면극', '단청 · 전통 문양'];
export const FOLK_GAMES = ['줄넘기', '줄다리기', '상모돌리기', '구슬치기', '팽이치기', '자치기', '비석치기', '투호', '딱지치기', '고무줄놀이', '연날리기', '굴렁쇠'];

/**
 * 홈까지 간다. 처음이면 동의 → 「3분 둘러보기」(질문·그림책 건너뜀).
 * QR 기록(?w=)으로 열었거나 이미 동의한 기기면 그 단계가 없으므로, 보이는 것만 누른다.
 */
export async function openHome(page, path = '/') {
  await page.goto(path);
  const homeMark = page.getByText('여섯 개의 판 — 어디부터 가도 돼요');
  for (let i = 0; i < 40; i += 1) {
    if (await homeMark.isVisible().catch(() => false)) break;
    const agree = page.getByText('동의하고 시작하기').filter({ visible: true });
    const tour = page.getByText('3분 둘러보기 →').filter({ visible: true });
    if (await agree.count()) await agree.first().click().catch(() => {});
    else if (await tour.count()) await tour.first().click().catch(() => {});
    else await page.waitForTimeout(250);
  }
  await expect(homeMark).toBeVisible();
}

/** 판의 입구 이야기가 있으면 건너뛰고, 카메라·마이크 질문에는 「쓰지 않고 놀기」 */
export async function enterBoard(page, name) {
  await page.getByText(name, { exact: true }).filter({ visible: true }).first().click();
  // 처음 들어가는 판은 그림책 입구 이야기(2쪽)가 먼저 뜬다 — 잠깐 기다렸다가 건너뛴다
  const skip = page.getByText('건너뛰기', { exact: true }).filter({ visible: true }).first();
  try {
    await skip.waitFor({ state: 'visible', timeout: 2500 });
    await skip.click();
  } catch (e) {
    // 이미 본 판이면 이야기 없이 바로 열린다
  }
  await dismissSenses(page);
}

export async function dismissSenses(page) {
  // 질문 창은 조금 늦게 뜨거나 뜨는 중에 움직일 수 있어 잠깐 기다렸다가 누른다
  const no = page.getByText(/^(쓰지 않고 놀기|둘 다 끄고 놀기)$/).filter({ visible: true }).first();
  try {
    await no.waitFor({ state: 'visible', timeout: 1500 });
    await no.click({ timeout: 5000, force: true });
  } catch (e) {
    // 질문 창이 없으면 그대로 간다
  }
}

/** 누르려는 단추를 카메라 질문 창이 가리면 먼저 닫고 다시 누른다 */
export async function press(page, locator) {
  for (let i = 0; i < 3; i += 1) {
    await dismissSenses(page);
    try {
      await locator.click({ timeout: 5000 });
      return;
    } catch (e) {
      if (i === 2) throw e;
    }
  }
}

// 앱의 carry.js(QR 주소 만들기)를 그대로 불러 쓴다. 앱 소스는 확장자가 .js인 ES 모듈이라
// 테스트 도구가 CommonJS로 오해하지 않도록 글을 읽어 data: 주소로 불러온다.
const carrySrc = readFileSync(new URL('../src/utils/carry.js', import.meta.url), 'utf8');
const { packJourney } = await import(`data:text/javascript;base64,${Buffer.from(carrySrc).toString('base64')}`);

/** 놀이 기록을 QR 주소(?w=)에 담아 연다 — 판을 실제로 다 놀지 않고도 결과 화면을 확인할 때 */
export function carryPath(sceneIds, playLog = { byGame: {}, byScene: {} }) {
  const attempts = sceneIds.map((sceneId, i) => ({
    sceneId,
    formationId: 'wonjin',
    mappingCode: `m${i}`,
    ohangKey: ['mok', 'hwa', 'to', 'geum', 'su'][i % 5],
    speed: 'mid',
    seed: 1000 + i * 7919,
  }));
  return `/?w=${packJourney({ attempts, playLog })}`;
}

/** 단청 판 1단계를 실제로 끝까지 칠한다(가칠 세 번 → 먹선·분선 자리를 판 전체에서 고루 눌러 찾기) */
export async function paintDancheongStage1(page) {
  await press(page, page.getByText('시작하기', { exact: true }).filter({ visible: true }).first());
  const board = page.locator('svg[viewBox="0 0 240 100"]');
  const box = await board.boundingBox();
  for (let i = 0; i < 3; i += 1) await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2);
  const done = () => page.getByText('다 칠했어요! 단청 한 부재가 완성됐어요.').isVisible().catch(() => false);
  // 칸 가운데를 한 번씩 누르고(바탕칠·채색), 선 단계는 촘촘히 — 줄마다 끝났는지 본다(누르는 횟수를 줄여 브라우저가 지치지 않게)
  for (let pass = 0; pass < 6; pass += 1) {
    if (await done()) return;
    const step = pass < 2 ? [5, 10] : [2, 3];
    for (let gy = step[0] / 2; gy < 100; gy += step[0]) {
      if (await done()) return;
      for (let gx = step[1] / 2; gx < 240; gx += step[1]) await page.mouse.click(box.x + (gx / 240) * box.width, box.y + (gy / 100) * box.height);
      await page.waitForTimeout(30);
    }
    await page.waitForTimeout(800); // 단계가 바뀐 뒤 잠깐(0.7초)은 누름을 받지 않는다
  }
}
