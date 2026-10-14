# 깜짝 선물 사진 임시 저장소

키오스크에서 찍은 깜짝 선물 사진을 폰으로 옮길 때만 쓰는 저장소입니다. 사용자가 "QR로 폰에 받기"를 누를 때만 사진 한 장을 올리고, 하루가 지나면 자동으로 지웁니다.

처음 한 번만 설정합니다(Cloudflare 무료 계정 필요).

```
npx wrangler login
npx wrangler r2 bucket create itgyeol-gift
npx wrangler r2 bucket lifecycle add itgyeol-gift expire-1day --expire-days 1
npx wrangler deploy
```

배포가 끝나면 나오는 주소(https://itgyeol-gift.<계정>.workers.dev)를 `src/components/SurpriseGift.js`의 `GIFT_UPLOAD_URL`에 넣습니다.
