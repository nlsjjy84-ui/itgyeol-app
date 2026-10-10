// 웹 공개(GitHub Pages)는 https://<계정>.github.io/itgyeol-app/ 아래에서 열린다.
// 그때만 EXPO_BASE_URL=/itgyeol-app 을 넣어 파일 경로 앞에 붙이고, 평소 개발·로컬 실행은 그대로 둔다.
module.exports = ({ config }) => ({
  ...config,
  web: { ...config.web, name: '잇결 Itgyeol', shortName: '잇결', description: '손끝으로 만나는 전통 — 그림책처럼 넘기며 놀고, 나만의 조각보 작품을 만드는 앱' },
  experiments: { ...(config.experiments || {}), ...(process.env.EXPO_BASE_URL ? { baseUrl: process.env.EXPO_BASE_URL } : {}) },
});
