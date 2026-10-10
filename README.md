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
