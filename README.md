# 잇결 (Itgyeol)

**바로 해 보기 → https://nlsjjy84-ui.github.io/itgyeol-app/**

손끝으로 만나는 전통 — 그림책처럼 넘기며 놀고, 노는 방식대로 나만의 조각보 작품이 만들어지는 웹 앱입니다.
*Touch Korean tradition — flip through a picture book, play folk games, and your play record shapes your own patchwork artwork.*

- **그림책 이야기**: 풍이·결이와 대화하듯 넘기는 그림책. 생성형 AI 없이 미리 짜 둔 대본과 선택 분기(추임새 고르기 · 톡 · 가만히 있기)로만 움직입니다.
- **네 가지 판**: 진법(대형 만들기) · 훈민정음·인쇄 · 전래놀이 12종 · 한글 테트리스
- **결과물**: 판마다 생긴 조각이 조각보가 되고, 어떤 놀이를 몇 번 했는지가 3D 전통 물건(노리개·비녀·달항아리 등)의 모양을 바꿉니다.
- **언어**: 한국어 / English (중국어·일본어는 언어팩 자리만 마련)
- **개인정보**: 로그인·추천·개인 식별 정보 없음. 기록은 기기에만 저장됩니다.

## 실행

```bash
npm install
npx expo start --web
```

`master`에 올라가면 GitHub Actions가 웹 버전을 만들어 GitHub Pages에 자동으로 공개합니다 (`.github/workflows/deploy-pages.yml`).

Expo · React Native Web · three.js

## 사진·자료 출처

- 전통 자료실(`assets/archive`): 국가유산청·국립중앙박물관 공공누리 제1유형(위키미디어 공용), 메트로폴리탄·클리블랜드 미술관 오픈액세스(CC0), 유로피아나 공개 소장품(CC0). 사진마다 출처와 원본 링크는 `src/data/archive.js`에 있습니다.
- 전래놀이 놀이판 그림(`assets/sprites`)
  - 딱지 사진: "Ddakji from Squid Game", Onalion, 위키미디어 공용, CC0 (파란 딱지는 같은 사진의 색을 바꾼 것)
  - 방패연 사진: "Shield-shaped Kite(Bangpaeyeon) and Kite Reel, Jegi (1)", 고려, 위키미디어 공용, CC BY 4.0 (연 부분만 잘라 방구멍을 투명하게 처리)
- 놀이 규칙: 나무위키의 딱지치기·자치기·비석치기·투호·팽이치기·구슬치기·굴렁쇠·줄넘기 문서를 참고해 실제 규칙(넘겨먹기, 알 튀겨 치기와 자로 재기, 비석치기 단계, 투호 병의 귀 등)에 맞췄습니다.
