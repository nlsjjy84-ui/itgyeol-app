# 깜짝 선물 사진 임시 저장소

키오스크에서 찍은 깜짝 선물 사진을 폰으로 옮길 때만 쓰는 저장소입니다. 사용자가 "QR로 폰에 받기"를 누를 때만 사진 한 장을 올리고, 24시간이 지나면 저장소(Cloudflare Workers KV)가 스스로 지웁니다.

처음 한 번만 설정합니다(Cloudflare 무료 계정, 카드 등록 없음). 저장소 맨 위의 `setup-gift.bat`을 두 번 누르면 아래를 차례로 합니다.

1. Cloudflare 로그인(브라우저가 열림)
2. KV 저장소 만들기 → `wrangler.toml`에 id 채우기
3. Worker 배포(처음이면 workers.dev 이름을 하나 정함)
4. 배포된 주소를 `src/components/SurpriseGift.js`의 `GIFT_UPLOAD_URL`에 넣고 사이트에 올림
