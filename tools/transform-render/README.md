# 변형 시안 렌더러 (2026-11-22)

진짜 유물 사진(배경 제거) + 3D로 만든 금속 고리·체인·스프링·가죽 끈·거울을 한 장면에서 렌더링해 상품 사진처럼 만든다.

- 조명: Poly Haven `studio_small_09` (CC0) — https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr 를 `studio.hdr`로 받아 이 폴더에 둔다
- three: `ln -s ../../node_modules/three three`
- 서버: `python3 -m http.server 4191` (npx serve는 주소 뒤 ?s= 를 지우므로 쓰지 않는다)
- 렌더: `node render.mjs A B C D E F G H` → /tmp/kr/out_*.png (render.mjs 안 경로를 바꿔 쓴다)
- 배경 제거: rembg `isnet-general-use` (bria 모델은 메모리가 모자라 멈춤), 그 뒤 알파 128 기준으로 다시 잘라야 실제 크기가 맞는다
