# 재료 · 소재 목록 · 예시 작품 — 운영 안내

잇결의 결과물은 **실제 전통 재료와 실물 유물**에서 출발합니다. 이 문서는 운영사(업체·박물관·키오스크 운영자)가
재료를 더하거나 바꾸고, 소재 목록을 새로 모으고, 예시 작품을 다시 찍을 때 보는 안내입니다.

## 한눈에 보는 구조

```
사용자: 떠오르는 것 고르기 → 재료 고르기(바탕·무늬) → 그림책 → 여섯 판 놀이 → 결과(3D) → 주문·전시
                         └ 권하는 재료: src/data/materialNames.js (TASTE_TO_MATERIAL)

재료 35가지   src/data/materialTree.js   ← tools/catalog/materials.py 에서 만든다(손으로 고치지 않음)
  · look: 색·거칠기·금속성·겉칠·광택·무지갯빛 → 결과물 3D 재질에 그대로 쓰인다
  · samples: 그 재료로 만든 실물(문화유산·박물관 소장품) · shopKinds: 다루는 업체 갈래
기법          src/components/obj3d/kit.js  realLook() · TECH(재료→기법) · DETAIL_OF(재료→결)
  · 흙(청자·백자·분청·옹기) → 상감/청화 선  · 옻칠 → 나전·화각·금박·주칠  · 쇠붙이 → 두드림·주물·입사
  · 실·천 → 자수  · 나무·돌·옥 → 새김  · 한지·짚·가죽 → 찍기
사양서        src/utils/makerSpec.js  techniqueOf() · materialLines() — 업체용 제작 사양서에 재료·기법·맡길 곳을 적는다
소재 목록     src/data/catalog.js (물건 갈래·업체) · src/data/catalogImages.js · assets/catalog/*.jpg
화면          전통 자료실(재료/물건 갈래/만드는 곳) · 재료 고르기(MaterialScreen) · 결과 화면의 '재료 바꿔 입혀 보기'
예시 작품     src/data/mockWorks.js (작품마다 mat: [바탕, 무늬]) · assets/mock/*.webp
```

## 0. 우리 매장에 맞추기 (운영사 설정 — 코드 수정 없음)

`src/config/operator.js` 한 파일만 고친다.

| 항목 | 뜻 | 예 |
|---|---|---|
| `materials` | 손님이 고를 수 있는 재료(`'all'` 또는 아이디 목록) | 나전칠기 공방: `['otchil', 'najeon', 'hwagak', 'gilt']` |
| `suggest` | 처음 권할 재료(`null`이면 '떠오르는 것' 답으로 권함) | `{ base: 'otchil', accent: 'najeon' }` |
| `allowResin` | 재료 없이 풀컬러 출력(수지)도 받는지 | 공방이면 `false` |
| `exampleGroups` | 예시 작품을 보여 줄 묶음(`'all'` 또는 목록) | `['keyring', 'desk', 'treasure']` |

- 없는 이름을 넣어도 앱은 깨지지 않는다(그 값은 무시하고, 남는 게 없으면 전부 보여 준다).
- `npm test` 가 설정 속 이름이 실제로 있는지 검사해서 미리 알려 준다.
- 전통 자료실(재료 갈래)은 지식 목록이라 설정과 상관없이 35가지를 모두 보여 주고, **재료 고르기**와 결과 화면의 **재료 바꿔 입혀 보기**에만 설정이 적용된다.

## 1. 재료를 더하거나 고치기

1. `tools/catalog/materials.py` 에서 재료를 더하거나 값을 고친다.
   - `rx`: 박물관 재질 칸·이름에서 이 재료를 알아보는 말(정규식)
   - `look`: `color`(실물 사진에서 고른 색), `rough`(0 매끈~1 거침), `metal`(0~1), `clear`(유약·옻칠 겉칠), `sheen`(비단 광택), `irid`(자개 무지갯빛), `inlay`(입사 실 색), `grain`(나뭇결)
   - `note`: 화면에 보이는 한 줄 설명
2. 새 재료라면 `src/components/obj3d/kit.js` 의 `TECH`(어떤 기법으로 무늬를 옮길지)와 `DETAIL_OF`(어떤 결을 입힐지),
   `src/utils/makerSpec.js` 의 `TECH_OF`(사양서에 적을 기법 이름), `src/data/materialNames.js` 의 다른 나라 말 이름을 더한다.
3. 아래 2번의 순서대로 목록을 다시 만든다.

## 2. 소재 목록 새로 만들기

원본 자료는 브라우저에서 모은다 → [`tools/catalog/crawl/README.md`](../tools/catalog/crawl/README.md).
받은 JSON 파일을 `tools/catalog/raw/` 에 넣고(깃에는 올리지 않음):

```bash
cd tools/catalog
python3 get_thumbs.py        # 문화유산 사진(자유 이용 조건만) 내려받기 → work/thumbs
python3 build_catalog.py     # 원본 합치기 · 갈래·재료 나누기 · 업체 거르기 → work/catalog.json
python3 page_data.py         # 재료·물건 갈래·사진 묶기 → work/page_data.js
python3 gen_app_data.py      # 앱 자료 만들기 → src/data/materialTree.js, catalog.js, catalogImages.js, assets/catalog/
cd ../.. && npm test         # 재료 수·권하는 재료·사양서 확인
```

거르는 기준(`build_catalog.py`):
- 문화유산: 대한민국 지정(국가·시도·향토·등록)만, 근현대 물건과 천연기념물·명승은 뺀다.
- 사진: 공공누리 제1유형·CC0·퍼블릭 도메인·CC BY만 앱에 넣는다. CC BY-SA·공공누리 2~4유형은 목록에만 남긴다.
- 업체: 업종이 공예·악기·한복 쪽이거나 이름에 공방·공예·국악 같은 말이 분명히 있는 곳만. 식당·숙박·발레복집 등은 뺀다.
- 박물관 분류의 줄임말은 풀어 쓴다(`gen_app_data.py` 의 `NICE`, 예: 입 → 갓·삿갓·패랭이 (입)).

## 3. 예시 작품 다시 찍기

예시 작품은 앱의 결과 화면(같은 3D 코드)을 그대로 찍는다. 그래서 **재료나 기법을 고치면 예시도 같은 모습으로 다시 찍힌다.**

1. 작품마다 재료 정하기: `tools/catalog/mock_mats.mjs` 의 `ITEM_MATS`(물건마다 실제로 만드는 재료 조합)를 고친 뒤
   `node tools/catalog/mock_mats.mjs` → `src/data/mockWorks.js` 의 `mat` 이 바뀐다.
2. 웹으로 만들고 띄우기: `npx expo export -p web --output-dir dist` 후 `cd dist && python3 -m http.server 8777`
3. 찍기: `SHOT_OUT=shots node tools/shoot-examples.mjs 0 450` (끊겨도 다시 돌리면 이어서 찍는다. 3D가 다 그려졌다는 신호를 기다렸다 찍는다)
4. 검사: `python3 tools/check-shots.py shots` — 비었거나·덜 그려졌거나·너무 어둡거나·하얗게 날아간 것을 알려 준다. 그 파일을 지우고 3번을 다시 돌린다.
5. 넣기: `python3 tools/shots-to-mock.py shots` → `assets/mock/wXXX.webp` (검사를 통과한 것만)

촬영용 주소 표시(웹에서만, 앱 사용에는 영향 없음): `?pick=묶음.물건.모양` 으로 결과 화면의 물건을 고르고, `&still=1` 이면 3D가 돌지 않는다.

## 4. 사진 이용 조건

- 앱 안 사진에는 출처와 이용 조건을 붙인다(`src/data/catalog.js` 의 출처 표시, 원본 링크).
- 업체 사진은 넣지 않았다. 업체 사진을 쓰려면 그 업체의 허락을 받는다.
- 결과물 3D 조명: Poly Haven `studio_small_09`(CC0)를 앱용으로 줄인 `assets/env/studio.jpg`.
  밝은 창이 카메라 옆에서 비치도록 90° 돌려 쓴다(`Obj3DViewer.js` 의 `ENV_YAW`). 평평한 은·놋 판이 까맣게 비치지 않고,
  옻칠은 겉칠 한 겹만 빛나게 해서 깊은 검정이 산다. 조명을 바꾸면 예시 작품을 모두 다시 찍는다(3번).
