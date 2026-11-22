# 변형 시안 4 렌더 도구

- 유물: 국립중앙박물관 3D 데이터(공공누리 제1유형). 받은 zip은 저장소에 넣지 않음(각 30~110MB).
  - 연화문 벽돌 relicId 4390 → fileDownloadById/31709 (bon013968)
  - 산수무늬 벽돌 856 → 31716 (bon013972, 002 스캔이 무늬면)
  - 청동 금강령 1168 → 34923 (duk002457)
  - 청자 석류 원숭이 연적 4220 → 34910 (duk000510)
- 받은 뒤 OBJ 질감(8192px)을 2048px `_2k.jpg`로 줄이고 .mtl의 map_Kd를 바꿈. 폴더 구조: r3d/{lotus,sansu,bell,monkey}/
- 재질: ambientCG(CC0) Wood066, Cork001, Fabric026, Paper004, Rope001, Plaster001 → tex/
- 조명: Poly Haven studio_small_09 (studio.hdr)
- 실행: `python3 -m http.server 4192` 후 `node rp.mjs coaster4 coaster1 clock frame bell diffuser weight`
- 빠진 것: chime(도어 차임) — 끈이 금강저 갈고리를 뚫고 지나가 실제와 다름. 금강령은 세워 흔드는 물건이라 거는 방식은 쓰지 않음.
