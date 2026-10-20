# 원본 자료 모으기 (브라우저에서)

국내 기관 사이트(카카오맵·e뮤지엄)는 해외 서버에서 막혀 있어서, **크롬에서 해당 사이트를 연 뒤 개발자 도구 콘솔(F12 → Console)에 스크립트를 붙여 넣어** 모은다. 끝나면 `Downloads`에 JSON 파일이 저장된다. 그 파일을 `tools/catalog/raw/`에 옮긴다.

| 파일 | 열 사이트 | 결과 파일 | 걸리는 시간 |
|---|---|---|---|
| `wikidata.js` | https://www.wikidata.org | `itgyeol_wikidata.json` (국가·시도 지정 문화유산, 사진 이용 조건 포함) | 약 10분 |
| `kowiki.js` | https://ko.wikipedia.org | `itgyeol_kowiki.json` (무형유산·악기·한복·무기·공예 갈래 문서) | 약 10분 |
| `emuseum.js` | https://www.emuseum.go.kr | `itgyeol_emuseum_r0.json` ~ `_r3.json` (박물관 소장품, 연관단어로 넓히며 4번) | 1~3시간 |
| `emuseum-picks.js` | https://www.emuseum.go.kr (위 수집을 한 탭에서) | `itgyeol_picks.json` (공공누리 1유형 사진, 분류마다 고르게) | 약 5분 |
| `kakao.js` | https://map.kakao.com | `itgyeol_shops2.json` (국악사·공방·한복집) | 약 15분 |

- 크롬이 "여러 파일 다운로드" 허용을 물으면 **허용**을 눌러야 저장된다.
- 사진은 공공누리 제1유형·CC0·퍼블릭 도메인·CC BY만 앱에 넣는다(CC BY-SA·공공누리 2~4유형은 목록에는 남기되 사진은 쓰지 않음).
- 업체 목록은 공개된 지도 정보(상호·주소·전화·누리집)만 모은다. 앱에 사진을 넣으려면 업체 허락이 필요하다.

모은 뒤에는 `tools/catalog/` 의 순서대로 돌린다 → `docs/MATERIALS.md` 참고.
