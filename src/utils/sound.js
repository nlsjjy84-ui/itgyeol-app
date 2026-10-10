// 효과음 — 북·꽹과리·징·가야금 소리를 짧게 만들어 두었다. 소리가 안 나오는 환경이어도
// 앱이 멈추지 않도록 모든 호출은 조용히 실패한다.
let createAudioPlayer = null;
try {
  // eslint-disable-next-line global-require
  createAudioPlayer = require('expo-audio').createAudioPlayer;
} catch (e) {
  createAudioPlayer = null;
}

const FILES = {
  drum: require('../../assets/sfx/drum.wav'), // 북 — 시작·큰 동작
  gong: require('../../assets/sfx/gong.wav'), // 꽹과리 — 성공 강조
  jing: require('../../assets/sfx/jing.wav'), // 징 — 완성
  tap: require('../../assets/sfx/tap.wav'), // 딱 — 일반 누름
  stamp: require('../../assets/sfx/stamp.wav'), // 도장
  ok: require('../../assets/sfx/ok.wav'), // 가야금 — 맞았을 때
  fail: require('../../assets/sfx/fail.wav'), // 둔한 북 — 아쉬울 때
  // 국악 관·현악기 — 장면마다 악기를 달리 쓴다
  daegeum: require('../../assets/sfx/daegeum_start.wav'), // 대금 — 시작·여는 소리
  piri: require('../../assets/sfx/piri_done.wav'), // 피리 — 완성
  haegeum: require('../../assets/sfx/haegeum_ok.wav'), // 해금 — 성공
  gayageum: require('../../assets/sfx/gayageum_ok.wav'), // 가야금 — 맞췄을 때
  geomungo: require('../../assets/sfx/geomungo_fail.wav'), // 거문고 — 아쉬울 때
  daegeumCalm: require('../../assets/sfx/daegeum_calm.wav'), // 대금 — 결과 화면
};

const players = {};
let muted = false;

export function setMuted(v) {
  muted = !!v;
}
export function isMuted() {
  return muted;
}

export function play(name) {
  if (muted || !createAudioPlayer || !FILES[name]) return;
  try {
    let p = players[name];
    if (!p) {
      p = createAudioPlayer(FILES[name]);
      players[name] = p;
    }
    try {
      p.seekTo(0);
    } catch (e) {
      // 처음 재생할 때는 되감기가 필요 없다
    }
    const r = p.play();
    if (r && typeof r.catch === 'function') r.catch(() => {});
  } catch (e) {
    // 소리가 안 나도 체험은 계속된다
  }
}
