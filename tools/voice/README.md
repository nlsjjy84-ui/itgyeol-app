# 풍이·결이 목소리 만들기 (무료 음성 합성 Supertonic, MIT 코드 · OpenRAIL 모델)

1. `lines.mjs` — 그림책 묶음(한국어·영어·일본어)에서 풍이/결이 말을 모두 뽑아 lines.json 으로 (node 로더로 src 복사본을 읽음, i18n/index 는 가짜로 바꿔 둠).
2. `gen.py` — `pip install supertonic` 후 실행. 풍이 F4(밝고 빠르게, 속도 1.12) · 결이 F5(차분하게, 1.0). ffmpeg 로 소리 크기를 맞춰 mp3(24kHz·40kbps) → assets/voice/<열쇠>.mp3
3. 열쇠 = djb2 변형(`x = ((x*33) ^ 글자) & 0xFFFFFFFF`) of `언어|누구|말` — src/utils/narrate.js 의 voiceKey 와 같아야 한다. 말은 narrate.js 의 clean()과 같은 방식으로 다듬은 것.
4. src/data/voiceMap.js 를 다시 만든다. 중국어(지원 안 됨)와 그때그때 바뀌는 말은 브라우저 음성으로 읽는다.
