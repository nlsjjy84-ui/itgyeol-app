// 브라우저로 웹 앱을 끝까지 눌러 보는 테스트 (npm run e2e)
// 먼저 웹 버전을 만든다: npx expo export -p web --output-dir dist-e2e
// 폰 화면 크기(420×860)로 돈다. 서버(Vercel)는 테스트 안에서 실제 서버 코드를 메모리 저장소로 돌려 대신한다(e2e/cloud.mjs).
import { defineConfig } from '@playwright/test';

const PORT = 4173;
const launchOptions = process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {};

export default defineConfig({
  testDir: './e2e',
  testMatch: '*.spec.mjs',
  timeout: 90_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 420, height: 860 },
    locale: 'ko-KR',
    launchOptions,
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npx serve -s dist-e2e -l ${PORT} --no-clipboard`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 60_000,
  },
});
