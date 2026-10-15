# itgyeol-gift — 깜짝 선물 사진 임시 저장소

키오스크에서 찍은 깜짝 선물 사진을 QR로 폰에 옮기기 위한 아주 작은 저장소입니다.

- **어디에**: Vercel Functions + Vercel Blob (이미 쓰는 Vercel 계정, 무료 범위)
- **POST /gift** (image/jpeg, 3MB 이하) → `{ url }` — 짐작할 수 없는 36자리 번호 주소. 앱이 이 주소를 QR로 보여 줍니다.
- **지우기**: 24시간 지난 사진은 새 사진이 올라올 때마다, 그리고 매일 한 번(cron) 지웁니다.
- **받는 곳 제한**: `https://nlsjjy84-ui.github.io`(잇결 웹 앱)에서만 올릴 수 있습니다(CORS).
- **설정**: 저장소 맨 위 `setup-gift.bat`을 한 번 실행 → 로그인 · 프로젝트 · 저장소 · 배포 · 앱에 주소 넣기까지 자동.
- **테스트**: `npm install && node test.mjs` (가짜 Blob으로 업로드·형식·크기·하루 지난 사진 지우기 확인)
