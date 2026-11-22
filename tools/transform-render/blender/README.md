# Blender(Cycles) 시제품 렌더 — 사용자 PC의 RTX 5060(OptiX)으로 돌림

- `render.py`: 장면 7개(diffuser weight coaster4 coaster1 clock frame bell). 그래픽카드는 OptiX → CUDA → HIP → CPU 순으로 자동 선택.
- `2_잇결_시제품_렌더.bat`: 다운로드\잇결_렌더 에서 실행. 처음 한 번 zip(kit_tex, scan_*)을 풀고 1600px·256샘플로 렌더 → `결과\`.
- zip 내용(저장소에 넣지 않음): scans/{monkey,lotus,bell,sansu}/ — 국립중앙박물관 3D 스캔 OBJ + 4096px 질감(원본 8192px를 줄임), tex/ — ambientCG 1K, studio.hdr — Poly Haven.
- 컨테이너에서 확인: `pip install bpy`(5.3) 후 `--cpu --samples 24 --res 400` 으로 미리 돌려 봄.
- 좌표: three.js 장면(v4/p.html)의 숫자(Y가 위, mm)를 `P(x,y,z)`로 Blender(Z가 위)로 옮김. OBJ 불러오기 회전은 모양에 굳힘.
