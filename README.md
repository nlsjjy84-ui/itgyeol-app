# 잇결 (Itgyeol)

**바로 해 보기 → https://nlsjjy84-ui.github.io/itgyeol-app/**

손끝으로 만나는 전통 — 그림책처럼 넘기며 놀고, 노는 방식대로 나만의 조각보 작품이 만들어지는 웹 앱입니다.
*Touch Korean tradition — flip through a picture book, play folk games, and your play record shapes your own patchwork artwork.*

- **그림책 이야기**: 풍이·결이와 대화하듯 넘기는 그림책. 생성형 AI 없이 미리 짜 둔 대본과 선택 분기(추임새 고르기 · 톡 · 가만히 있기)로만 움직입니다.
- **여섯 가지 판**: 진법(대형 만들기) · 훈민정음·인쇄 · 전래놀이 12종 · 한글 테트리스 · 탈춤 · 단청
- **실제 전통 재료**: 놀이 전에 재료 35가지(옻칠·자개·놋쇠·청자·백자·비단·한지·옥·말총…) 중에서 바탕과 무늬 재료를 고르면, 결과물이 그 재료와 실제 기법(나전·상감·청화·입사·자수·새김)으로 만들어집니다. 장난감 같은 그림이 아니라 실물 유물에서 출발합니다.
- **결과물**: 판마다 생긴 조각이 무늬가 되고, 어떤 놀이를 몇 번 했는지가 3D 전통 물건(노리개·매병·달항아리 등)의 모양을 바꿉니다.
- **전통 자료실(소재 목록)**: 지정 문화유산·무형유산 1만 5천여 건, 박물관 소장품 1만여 점, 재료를 다루는 공방·국악사·한복집 560곳을 재료 갈래 / 물건 갈래(폴더 안의 폴더) / 만드는 곳으로 찾아봅니다.
- **언어**: 한국어 / English / 中文 / 日本語
- **개인정보**: 로그인·추천·개인 식별 정보 없음. 기록은 기기에만 저장됩니다.

## 실행

```bash
npm install
npx expo start --web
```

`master`에 올라가면 GitHub Actions가 웹 버전을 만들어 GitHub Pages에 자동으로 공개합니다 (`.github/workflows/deploy-pages.yml`).

Expo · React Native Web · three.js

## 운영사(업체·박물관)용 — 재료·소재 목록·예시 작품 바꾸기

재료를 더하거나 고치고, 소재 목록을 새로 모으고, 예시 작품을 다시 찍는 방법은 [`docs/MATERIALS.md`](docs/MATERIALS.md)에 있습니다.

## 사진·자료 출처

- 전통 자료실(`assets/archive`): 국가유산청·국립중앙박물관 공공누리 제1유형(위키미디어 공용), 메트로폴리탄·클리블랜드 미술관 오픈액세스(CC0), 유로피아나 공개 소장품(CC0). 사진마다 출처와 원본 링크는 `src/data/archive.js`에 있습니다.
- 전래놀이 놀이판 그림(`assets/sprites`)
  - 딱지 사진: "Ddakji from Squid Game", Onalion, 위키미디어 공용, CC0 (파란 딱지는 같은 사진의 색을 바꾼 것)
  - 방패연 사진: "Shield-shaped Kite(Bangpaeyeon) and Kite Reel, Jegi (1)", 고려, 위키미디어 공용, CC BY 4.0 (연 부분만 잘라 방구멍을 투명하게 처리)
- 소재 목록(`assets/catalog`, `src/data/catalog.js`, `src/data/materialTree.js`): 위키데이터·한국어 위키백과(국가·시도 지정 문화유산, 무형유산), e뮤지엄(전국 박물관 소장품, 공공누리 유형 표시), 위키미디어 공용(사진 이용 조건 표시), 카카오맵(공방·국악사·한복집 공개 정보), 유네스코. 사진은 공공누리 제1유형·CC0·퍼블릭 도메인·CC BY만 넣었습니다.
- 결과물 3D 조명: Poly Haven `studio_small_09`(CC0)을 줄여 씀(`assets/env/studio.jpg`)
- 놀이 규칙: 나무위키의 딱지치기·자치기·비석치기·투호·팽이치기·구슬치기·굴렁쇠·줄넘기 문서를 참고해 실제 규칙(넘겨먹기, 알 튀겨 치기와 자로 재기, 비석치기 단계, 투호 병의 귀 등)에 맞췄습니다.
